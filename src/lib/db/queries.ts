import { createServerClient } from "./supabase";
import type {
  Tenant,
  BrandVoiceVersion,
  VisualTemplate,
  GenerationRun,
  GeneratedPost,
  GeneratedAsset,
  ManualIdea,
  TemplateFormat,
  PostFormat,
  PostStatus,
  RunStatus,
} from "./types";

// ────────── tenants ──────────
export async function listTenants(): Promise<Tenant[]> {
  const sb = createServerClient();
  const { data, error } = await sb.from("tenants").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tenant[];
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const sb = createServerClient();
  const { data, error } = await sb.from("tenants").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as Tenant) ?? null;
}

export async function createTenant(
  input: Omit<Tenant, "id" | "created_at" | "updated_at">,
): Promise<Tenant> {
  const sb = createServerClient();
  const { data, error } = await sb.from("tenants").insert(input).select().single();
  if (error) throw error;
  return data as Tenant;
}

// ────────── brand voice ──────────
export async function getActiveVoiceVersion(tenantId: string): Promise<BrandVoiceVersion | null> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("brand_voice_versions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as BrandVoiceVersion) ?? null;
}

export async function listVoiceVersions(tenantId: string): Promise<BrandVoiceVersion[]> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("brand_voice_versions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("version", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrandVoiceVersion[];
}

export async function createNewVoiceVersion(
  tenantId: string,
  input: Omit<BrandVoiceVersion, "id" | "tenant_id" | "version" | "is_active" | "created_at">,
): Promise<BrandVoiceVersion> {
  const sb = createServerClient();

  // Find next version number
  const { data: latest } = await sb
    .from("brand_voice_versions")
    .select("version")
    .eq("tenant_id", tenantId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = ((latest as { version: number } | null)?.version ?? 0) + 1;

  // Deactivate existing
  await sb.from("brand_voice_versions").update({ is_active: false }).eq("tenant_id", tenantId);

  // Insert new
  const { data, error } = await sb
    .from("brand_voice_versions")
    .insert({ ...input, tenant_id: tenantId, version: nextVersion, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as BrandVoiceVersion;
}

// ────────── visual templates ──────────
export async function listVisualTemplates(
  tenantId: string,
  format?: TemplateFormat,
): Promise<VisualTemplate[]> {
  const sb = createServerClient();
  let q = sb.from("visual_templates").select("*").eq("tenant_id", tenantId).eq("is_active", true);
  if (format) q = q.eq("format", format);
  const { data, error } = await q.order("slug");
  if (error) throw error;
  return (data ?? []) as VisualTemplate[];
}

export async function listVisualTemplatesForFormat(
  tenantId: string,
  postFormat: PostFormat,
): Promise<VisualTemplate[]> {
  const sb = createServerClient();
  // Map post format to template format(s)
  const formatMap: Record<PostFormat, TemplateFormat[]> = {
    ig_feed: ["ig_feed", "multi"],
    ig_carousel: ["ig_carousel_slide", "li_carousel_slide", "multi"],
    li_single: ["li_single", "multi"],
    li_carousel: ["li_carousel_slide", "multi"],
  };
  const formats = formatMap[postFormat];
  const { data, error } = await sb
    .from("visual_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .in("format", formats)
    .order("slug");
  if (error) throw error;
  return (data ?? []) as VisualTemplate[];
}

// ────────── runs ──────────
export async function createRun(input: {
  tenant_id: string;
  brand_voice_version_id: string | null;
  mode: "batch" | "single_idea";
  manual_idea_id?: string | null;
}): Promise<GenerationRun> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("generation_runs")
    .insert({ ...input, status: "generating" })
    .select()
    .single();
  if (error) throw error;
  return data as GenerationRun;
}

export async function updateRun(
  runId: string,
  patch: Partial<Pick<GenerationRun, "status" | "error" | "completed_at" | "exported_at" | "retry_count">>,
): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from("generation_runs").update(patch).eq("id", runId);
  if (error) throw error;
}

export async function getRun(runId: string): Promise<GenerationRun | null> {
  const sb = createServerClient();
  const { data, error } = await sb.from("generation_runs").select("*").eq("id", runId).maybeSingle();
  if (error) throw error;
  return (data as GenerationRun) ?? null;
}

export async function listRunsByTenant(tenantId: string, limit = 30): Promise<GenerationRun[]> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("generation_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as GenerationRun[];
}

// ────────── posts ──────────
export async function getPostsByRun(runId: string): Promise<GeneratedPost[]> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("generated_posts")
    .select("*")
    .eq("run_id", runId)
    .order("slot_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GeneratedPost[];
}

export async function getPost(postId: string): Promise<GeneratedPost | null> {
  const sb = createServerClient();
  const { data, error } = await sb.from("generated_posts").select("*").eq("id", postId).maybeSingle();
  if (error) throw error;
  return (data as GeneratedPost) ?? null;
}

export async function bulkInsertPosts(
  posts: Omit<GeneratedPost, "id" | "created_at" | "updated_at">[],
): Promise<GeneratedPost[]> {
  const sb = createServerClient();
  const { data, error } = await sb.from("generated_posts").insert(posts).select();
  if (error) throw error;
  return (data ?? []) as GeneratedPost[];
}

export async function updatePost(
  postId: string,
  patch: Partial<Pick<GeneratedPost, "status" | "rejection_reason" | "title" | "copy" | "hashtags" | "cta" | "visual_template_slug" | "visual_template_id" | "visual_variables">>,
): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb
    .from("generated_posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw error;
}

export async function bulkUpdatePostsStatus(postIds: string[], status: PostStatus): Promise<void> {
  if (postIds.length === 0) return;
  const sb = createServerClient();
  const { error } = await sb
    .from("generated_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", postIds);
  if (error) throw error;
}

export async function getRecentPostsForAntiRepeat(
  tenantId: string,
  days = 60,
): Promise<Array<Pick<GeneratedPost, "title" | "topic" | "pillar" | "format" | "created_at">>> {
  const sb = createServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("generated_posts")
    .select("title, topic, pillar, format, created_at")
    .eq("tenant_id", tenantId)
    .neq("status", "rejected")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) throw error;
  return (data ?? []) as Array<Pick<GeneratedPost, "title" | "topic" | "pillar" | "format" | "created_at">>;
}

// ────────── assets ──────────
export async function insertAsset(
  asset: Omit<GeneratedAsset, "id" | "created_at">,
): Promise<GeneratedAsset> {
  const sb = createServerClient();
  const { data, error } = await sb.from("generated_assets").insert(asset).select().single();
  if (error) throw error;
  return data as GeneratedAsset;
}

export async function getAssetsByPostIds(postIds: string[]): Promise<GeneratedAsset[]> {
  if (postIds.length === 0) return [];
  const sb = createServerClient();
  const { data, error } = await sb
    .from("generated_assets")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GeneratedAsset[];
}

/**
 * Delete all assets for a post. Used before re-rendering so we don't end up
 * with stale rows pointing to overwritten storage files.
 */
export async function deleteAssetsByPostId(postId: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from("generated_assets").delete().eq("post_id", postId);
  if (error) throw error;
}

export async function getVisualTemplateBySlug(
  tenantId: string,
  slug: string,
): Promise<VisualTemplate | null> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("visual_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as VisualTemplate) ?? null;
}

// ────────── manual ideas ──────────
export async function createManualIdea(input: {
  tenant_id: string;
  target_format: PostFormat;
  idea_text: string;
  notes?: string | null;
}): Promise<ManualIdea> {
  const sb = createServerClient();
  const { data, error } = await sb.from("manual_ideas").insert(input).select().single();
  if (error) throw error;
  return data as ManualIdea;
}

export async function consumeManualIdea(ideaId: string, runId: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb
    .from("manual_ideas")
    .update({ consumed_at: new Date().toISOString(), consumed_run_id: runId })
    .eq("id", ideaId);
  if (error) throw error;
}
