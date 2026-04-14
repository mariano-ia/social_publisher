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
import { renderArgoSinglePhoto, renderArgoCarouselCoverPhoto } from "./argo-photo";
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

  // Persist posts (status: draft, no images yet).
  // Canonicalize slide indexes to 1..5 by array position, so downstream code
  // (renderer, export, PostCard) can always assume 1-indexed slides regardless
  // of what Claude returned.
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
    slides: p.slides ? p.slides.map((s, i) => ({ ...s, index: i + 1 })) : null,
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

  // ARGO single posts → gpt-image-1 for the photo, then HTML compositing.
  // Pipeline:
  //   1. Ask gpt-image-1 for a photo-only image (no text, no UI)
  //   2. Render the ar-ig-photo HTML template with photo_url pointing to it
  //   3. Upload the composited PNG
  // The intermediate photo is kept in storage too (with a -photo suffix) for debug.
  if (tenant.image_engine === "argo_photo_panel" && (post.format === "ig_feed" || post.format === "li_single")) {
    const photoResult = await renderArgoSinglePhoto({
      format: post.format,
      title: vars.title ?? post.title ?? "",
      subtitle: vars.subtitle,
      pillar: post.pillar ?? vars.pillar,
      scene_hint: vars.scene_hint,
      tenantSlug: tenant.slug,
      postId: post.id,
    });

    // Composite the HTML panel over the photo
    const tmpl = getHtmlTemplate("ar-ig-photo");
    if (!tmpl) throw new Error("ar-ig-photo template not found");
    const dims = FORMAT_DIMS[post.format];
    const html = tmpl({
      width: dims.width,
      height: dims.height,
      title: vars.title ?? post.title ?? "",
      subtitle: vars.subtitle,
      pillar: post.pillar ?? vars.pillar,
      photo_url: photoResult.publicUrl,
    });
    const composited = await renderHtmlToPng({
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
      storage_path: composited.storagePath,
      public_url: composited.publicUrl,
      width: composited.width,
      height: composited.height,
      prompt_used: photoResult.promptUsed,
    });
    return;
  }

  // ARGO carousel → HYBRID pipeline:
  //   - slide.kind === "cover"   → gpt-image-1 photo + ar-ig-photo HTML composite
  //     (so the cover has a real photo with the overlay panel)
  //   - slide.kind === "content" → ar-carousel-content HTML template (no photo)
  //   - slide.kind === "cta"     → ar-carousel-cta HTML template (no photo)
  // This saves 8 gpt-image-1 calls per batch (vs. one per slide).
  if (tenant.image_engine === "argo_photo_panel" && post.format === "li_carousel") {
    const slides = post.slides ?? [];
    for (const slide of slides) {
      const dims = FORMAT_DIMS.li_carousel;

      if (slide.kind === "cover") {
        // 1. Generate the photo
        const photoResult = await renderArgoCarouselCoverPhoto({
          slideIndex: slide.index,
          slideKind: slide.kind,
          slideTitle: slide.title ?? "",
          slideBody: slide.body ?? undefined,
          pillar: post.pillar ?? vars.pillar,
          scene_hint: slide.visual_hint ?? vars.scene_hint,
          tenantSlug: tenant.slug,
          postId: post.id,
        });
        // 2. Composite the ar-ig-photo template over it (headline + chip + panel)
        const coverTmpl = getHtmlTemplate("ar-ig-photo");
        if (!coverTmpl) throw new Error("ar-ig-photo template not found");
        const coverHtml = coverTmpl({
          width: dims.width,
          height: dims.height,
          title: slide.title ?? post.title ?? "",
          subtitle: slide.body ?? undefined,
          pillar: post.pillar ?? vars.pillar,
          photo_url: photoResult.publicUrl,
        });
        const composited = await renderHtmlToPng({
          html: coverHtml,
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
          storage_path: composited.storagePath,
          public_url: composited.publicUrl,
          width: composited.width,
          height: composited.height,
          prompt_used: photoResult.promptUsed,
        });
      } else {
        // Content or CTA slide → pure HTML, no gpt-image-1
        const templateSlug = slide.kind === "cta" ? "ar-carousel-cta" : "ar-carousel-content";
        const tmpl = getHtmlTemplate(templateSlug);
        if (!tmpl) throw new Error(`${templateSlug} template not found`);
        const html = tmpl({
          width: dims.width,
          height: dims.height,
          title: slide.title ?? "",
          subtitle: slide.body ?? undefined,
          body_text: slide.body ?? undefined,
          pillar: post.pillar ?? vars.pillar,
          slide,
          total_slides: slides.length,
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
    // Build the teaser list for the cover: titles of slides 2..5 (content + cta)
    const teaserTitles = slides
      .filter((s) => s.kind !== "cover")
      .map((s) => s.title ?? "")
      .filter((t) => t.length > 0);

    for (const slide of slides) {
      const dims = FORMAT_DIMS.li_carousel;
      // Cover slides use yc-cover regardless of the post's assigned template.
      // Content + cta slides use the post's assigned template.
      const slideTemplate = slide.kind === "cover" ? getHtmlTemplate("yc-cover") : tmpl;
      if (!slideTemplate) throw new Error(`Template not found for slide kind ${slide.kind}`);

      const html = slideTemplate({
        width: dims.width,
        height: dims.height,
        title: slide.kind === "cover" ? post.title ?? vars.title : slide.title ?? vars.title,
        subtitle:
          slide.kind === "cover"
            ? slide.body ?? vars.subtitle
            : vars.subtitle,
        body_text: slide.body ?? vars.body_text,
        cta: vars.title,
        pillar: post.pillar ?? vars.pillar,
        slide,
        slide_titles: slide.kind === "cover" ? teaserTitles : undefined,
        total_slides: slide.kind === "cover" ? slides.length : undefined,
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
