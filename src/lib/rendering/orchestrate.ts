import {
  getActiveVoiceVersion,
  getRecentPostsForAntiRepeat,
  listVisualTemplates,
  listVisualTemplatesForFormat,
  bulkInsertPosts,
  insertAsset,
  updateRun,
  getPost,
  updatePost,
  consumeManualIdea,
  createRun,
} from "@/lib/db/queries";
import type { GeneratedPost, PostFormat, Tenant, VisualTemplate } from "@/lib/db/types";
import { composeSystemPrompt } from "@/lib/prompts/compose";
import { generateBatch } from "@/lib/generator";
import type { GeneratedPostInput } from "@/lib/generator/schema";
import { renderArgoSingle, renderArgoCarouselSlide } from "./argo-photo";
import { renderHtmlToPng } from "./html-renderer";
import { getHtmlTemplate, FORMAT_DIMS } from "./template-registry";

interface RunOrchestrationInput {
  tenant: Tenant;
  mode: "batch" | "single_idea";
  manualIdea?: { id: string; text: string; format: PostFormat; notes?: string | null };
}

/**
 * Run the full generation pipeline for a tenant.
 * Returns the runId so the caller can poll status / show the review screen.
 */
export async function startRun(input: RunOrchestrationInput): Promise<string> {
  const voice = await getActiveVoiceVersion(input.tenant.id);
  if (!voice) throw new Error(`No active brand voice for tenant ${input.tenant.slug}`);

  const run = await createRun({
    tenant_id: input.tenant.id,
    brand_voice_version_id: voice.id,
    mode: input.mode,
    manual_idea_id: input.manualIdea?.id ?? null,
  });

  // Fire-and-forget the actual work
  void executeRun(run.id, input).catch(async (err) => {
    console.error("[orchestrate] run failed", err);
    await updateRun(run.id, { status: "failed", error: String(err?.message ?? err) }).catch(() => {});
  });

  return run.id;
}

async function executeRun(runId: string, input: RunOrchestrationInput): Promise<void> {
  const { tenant } = input;

  await updateRun(runId, { status: "generating" });

  const voice = await getActiveVoiceVersion(tenant.id);
  if (!voice) throw new Error("No active voice");

  const recentPosts = await getRecentPostsForAntiRepeat(tenant.id);
  const allTemplates = await listVisualTemplates(tenant.id);

  const systemPrompt = composeSystemPrompt({
    tenant,
    voice,
    recentPosts,
    templates: allTemplates,
  });

  const { parsed, retryCount } = await generateBatch({
    systemPrompt,
    cadence: tenant.cadence,
    manualIdea: input.manualIdea
      ? { text: input.manualIdea.text, format: input.manualIdea.format, notes: input.manualIdea.notes ?? undefined }
      : undefined,
  });

  if (retryCount > 0) await updateRun(runId, { retry_count: retryCount });

  // Validate visual_template_slug per post + reassign if invalid/repeated
  const usedByFormat: Record<PostFormat, string[]> = { ig_feed: [], li_single: [], li_carousel: [] };
  const normalized = await Promise.all(
    parsed.posts.map(async (p) => {
      const available = await listVisualTemplatesForFormat(tenant.id, p.format);
      const validSlug = await pickValidTemplate(p, available, usedByFormat[p.format]);
      usedByFormat[p.format].push(validSlug.slug);
      return { input: p, template: validSlug };
    }),
  );

  // Persist posts (status: draft, no images yet)
  const postsToInsert = normalized.map(({ input: p, template }) => ({
    run_id: runId,
    tenant_id: tenant.id,
    format: p.format,
    visual_template_id: template.id,
    visual_template_slug: template.slug,
    visual_variables: p.visual_variables,
    pillar: p.pillar,
    topic: p.topic,
    topic_embedding: null,
    title: p.title,
    copy: p.copy,
    hashtags: p.hashtags,
    cta: p.cta ?? null,
    slot_order: p.slot_order,
    slides: p.slides ?? null,
    status: "draft" as const,
    rejection_reason: null,
  }));
  const insertedPosts = await bulkInsertPosts(postsToInsert);

  await updateRun(runId, { status: "images_pending" });

  // Render images in parallel with concurrency limit of 3
  await renderAllImages(tenant, insertedPosts);

  await updateRun(runId, { status: "ready_for_review", completed_at: new Date().toISOString() });

  if (input.manualIdea) {
    await consumeManualIdea(input.manualIdea.id, runId);
  }
}

async function pickValidTemplate(
  post: GeneratedPostInput,
  available: VisualTemplate[],
  usedSoFar: string[],
): Promise<VisualTemplate> {
  if (available.length === 0) {
    throw new Error(`No active visual templates for format ${post.format}`);
  }
  const requested = available.find((t) => t.slug === post.visual_template_slug);
  const lastUsed = usedSoFar[usedSoFar.length - 1];
  if (requested && requested.slug !== lastUsed) return requested;

  // Round-robin: pick first that isn't lastUsed and has lowest usage in this run
  const usageCount = (slug: string) => usedSoFar.filter((s) => s === slug).length;
  const sorted = [...available].sort((a, b) => usageCount(a.slug) - usageCount(b.slug));
  const candidate = sorted.find((t) => t.slug !== lastUsed) ?? sorted[0];
  return candidate;
}

const RENDER_CONCURRENCY = 3;

async function renderAllImages(tenant: Tenant, posts: GeneratedPost[]): Promise<void> {
  const queue = [...posts];
  const workers: Promise<void>[] = [];

  for (let i = 0; i < RENDER_CONCURRENCY; i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const post = queue.shift();
          if (!post) return;
          try {
            await renderImagesForPost(tenant, post);
          } catch (err) {
            console.error(`[orchestrate] render failed for post ${post.id}`, err);
            await updatePost(post.id, { status: "image_failed" });
          }
        }
      })(),
    );
  }
  await Promise.all(workers);
}

async function renderImagesForPost(tenant: Tenant, post: GeneratedPost): Promise<void> {
  const vars = post.visual_variables as {
    title?: string;
    subtitle?: string;
    body_text?: string;
    accent?: string;
    pillar?: string;
    scene_hint?: string;
  };

  // ARGO single posts → gpt-image-1
  if (tenant.image_engine === "argo_photo_panel" && (post.format === "ig_feed" || post.format === "li_single")) {
    const result = await renderArgoSingle({
      format: post.format,
      title: vars.title ?? post.title ?? "",
      subtitle: vars.subtitle,
      pillar: post.pillar ?? vars.pillar,
      scene_hint: vars.scene_hint,
      tenantSlug: tenant.slug,
      postId: post.id,
    });
    await insertAsset({
      post_id: post.id,
      kind: "single",
      slide_index: null,
      storage_path: result.storagePath,
      public_url: result.publicUrl,
      width: result.width,
      height: result.height,
      prompt_used: result.promptUsed,
    });
    return;
  }

  // ARGO carousel → 5 slides via gpt-image-1
  if (tenant.image_engine === "argo_photo_panel" && post.format === "li_carousel") {
    const slides = post.slides ?? [];
    for (const slide of slides) {
      const result = await renderArgoCarouselSlide({
        slideIndex: slide.index,
        slideKind: slide.kind,
        slideTitle: slide.title ?? "",
        slideBody: slide.body,
        pillar: post.pillar ?? vars.pillar,
        scene_hint: slide.visual_hint ?? vars.scene_hint,
        tenantSlug: tenant.slug,
        postId: post.id,
      });
      await insertAsset({
        post_id: post.id,
        kind: "slide",
        slide_index: slide.index,
        storage_path: result.storagePath,
        public_url: result.publicUrl,
        width: result.width,
        height: result.height,
        prompt_used: result.promptUsed,
      });
    }
    return;
  }

  // HTML engine → puppeteer
  const slug = post.visual_template_slug;
  if (!slug) throw new Error(`Post ${post.id} has no visual_template_slug`);
  const tmpl = getHtmlTemplate(slug);
  if (!tmpl) throw new Error(`Unknown HTML template: ${slug}`);

  if (post.format === "li_carousel") {
    const slides = post.slides ?? [];
    for (const slide of slides) {
      const dims = FORMAT_DIMS.li_carousel;
      const html = tmpl({
        width: dims.width,
        height: dims.height,
        title: slide.title ?? vars.title,
        subtitle: vars.subtitle,
        body_text: slide.body ?? vars.body_text,
        cta: vars.title,
        pillar: post.pillar ?? vars.pillar,
        slide,
      });
      const result = await renderHtmlToPng({
        html,
        width: dims.width,
        height: dims.height,
        tenantSlug: tenant.slug,
        postId: post.id,
        filename: `slide-${String(slide.index).padStart(2, "0")}.png`,
      });
      await insertAsset({
        post_id: post.id,
        kind: "slide",
        slide_index: slide.index,
        storage_path: result.storagePath,
        public_url: result.publicUrl,
        width: result.width,
        height: result.height,
        prompt_used: null,
      });
    }
    return;
  }

  // Single post HTML render
  const dims = FORMAT_DIMS[post.format];
  const html = tmpl({
    width: dims.width,
    height: dims.height,
    title: vars.title ?? post.title ?? "",
    subtitle: vars.subtitle,
    body_text: vars.body_text,
    cta: post.cta ?? undefined,
    pillar: post.pillar ?? vars.pillar,
  });
  const result = await renderHtmlToPng({
    html,
    width: dims.width,
    height: dims.height,
    tenantSlug: tenant.slug,
    postId: post.id,
    filename: "single.png",
  });
  await insertAsset({
    post_id: post.id,
    kind: "single",
    slide_index: null,
    storage_path: result.storagePath,
    public_url: result.publicUrl,
    width: result.width,
    height: result.height,
    prompt_used: null,
  });
}

/**
 * Re-render a single post (e.g., after the user changes its visual template
 * in the review screen). Reuses content from the post but generates new image(s).
 */
export async function rerenderPost(postId: string): Promise<void> {
  const post = await getPost(postId);
  if (!post) throw new Error(`Post ${postId} not found`);
  const tenant = await import("@/lib/db/queries").then((m) => m.getTenantBySlug);
  // We need the full tenant; fetch by id instead
  const sb = (await import("@/lib/db/supabase")).createServerClient();
  const { data: tenantRow } = await sb.from("tenants").select("*").eq("id", post.tenant_id).maybeSingle();
  if (!tenantRow) throw new Error("Tenant not found");
  await renderImagesForPost(tenantRow as Tenant, post);
}
