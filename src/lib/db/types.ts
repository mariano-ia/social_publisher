// Types matching the Supabase schema. Keep in sync with supabase-schema.sql.

export type ImageEngine = "argo_photo_panel" | "html";
export type Archetype = "authority" | "innovator" | "friend" | "rebel" | "guide";
export type PostFormat = "ig_feed" | "li_single" | "li_carousel";
export type SlideKind = "cover" | "content" | "cta";
export type AssetKind = "single" | "slide";
export type RunMode = "batch" | "single_idea";
export type RunStatus =
  | "pending"
  | "generating"
  | "images_pending"
  | "ready_for_review"
  | "approved"
  | "exported"
  | "discarded"
  | "failed";
export type PostStatus =
  | "draft"
  | "approved"
  | "rejected"
  | "exported"
  | "published_externally"
  | "image_failed";
export type TemplateFormat = "ig_feed" | "li_single" | "li_carousel_slide" | "multi";

export interface Cadence {
  ig_feed: number;
  li_single: number;
  li_carousel: number;
  carousel_slides: number;
}

export interface VoiceDimensions {
  formal_casual?: number;
  serious_playful?: number;
  technical_simple?: number;
  reserved_bold?: number;
}

export interface Pillar {
  name: string;
  description?: string;
  weight?: number;
}

export interface SampleCopy {
  context: string;
  sample: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  website_url: string | null;
  image_engine: ImageEngine;
  cadence: Cadence;
  created_at: string;
  updated_at: string;
}

export interface BrandVoiceVersion {
  id: string;
  tenant_id: string;
  version: number;
  is_active: boolean;
  archetype: Archetype | null;
  dimensions: VoiceDimensions;
  voice_is: string[];
  voice_is_not: string[];
  vocabulary_use: string[];
  vocabulary_avoid: string[];
  signature_phrases: string[];
  dos: string[];
  donts: string[];
  pillars: Pillar[];
  monthly_themes: string[];
  sample_copy: SampleCopy[];
  language: string;
  language_rules: string | null;
  system_prompt_override: string | null;
  created_at: string;
}

export interface VisualTemplate {
  id: string;
  tenant_id: string;
  slug: string;
  format: TemplateFormat;
  engine: ImageEngine;
  weight: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

export interface GenerationRun {
  id: string;
  tenant_id: string;
  brand_voice_version_id: string | null;
  mode: RunMode;
  manual_idea_id: string | null;
  status: RunStatus;
  retry_count: number;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  exported_at: string | null;
  created_at: string;
}

export interface GeneratedSlide {
  index: number;
  kind: SlideKind;
  title?: string;
  subtitle?: string;
  body?: string;
  visual_hint?: string;
}

export interface GeneratedPost {
  id: string;
  run_id: string;
  tenant_id: string;
  format: PostFormat;
  visual_template_id: string | null;
  visual_template_slug: string | null;
  visual_variables: Record<string, unknown>;
  pillar: string | null;
  topic: string | null;
  topic_embedding: string | null;
  title: string | null;
  copy: string;
  hashtags: string[];
  cta: string | null;
  slot_order: number | null;
  slides: GeneratedSlide[] | null;
  status: PostStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedAsset {
  id: string;
  post_id: string;
  kind: AssetKind;
  slide_index: number | null;
  storage_path: string;
  public_url: string;
  width: number | null;
  height: number | null;
  prompt_used: string | null;
  created_at: string;
}

export interface ManualIdea {
  id: string;
  tenant_id: string;
  target_format: PostFormat;
  idea_text: string;
  notes: string | null;
  consumed_at: string | null;
  consumed_run_id: string | null;
  created_at: string;
}
