import type { PostFormat } from "@/lib/db/types";
import { type YacareTemplateProps } from "./templates/yacare/_shared";
import { type ArgoTemplateProps } from "./templates/argo/_shared";
import { ycContrarianTake } from "./templates/yacare/yc-contrarian-take";
import { ycProcessStep } from "./templates/yacare/yc-process-step";
import { ycFaqCard } from "./templates/yacare/yc-faq-card";
import { ycReframe } from "./templates/yacare/yc-reframe";
import { ycManifestoBlock } from "./templates/yacare/yc-manifesto-block";
import { ycCover } from "./templates/yacare/yc-cover";
import { arCarouselContent } from "./templates/argo/ar-carousel-content";
import { arCarouselCta } from "./templates/argo/ar-carousel-cta";
import { arSolidViolet } from "./templates/argo/ar-solid-violet";
import { arIgPhoto } from "./templates/argo/ar-ig-photo";
import { arIgMinimal } from "./templates/argo/ar-ig-minimal";

// Common polymorphic prop type — templates accept either Yacaré or Argo props.
// The orchestrator knows which template to call based on the tenant + slug.
export type HtmlTemplateProps = YacareTemplateProps | ArgoTemplateProps;
export type HtmlTemplateFn = (props: HtmlTemplateProps) => string;

export const HTML_TEMPLATES: Record<string, HtmlTemplateFn> = {
  // Yacaré
  "yc-contrarian-take": ycContrarianTake as HtmlTemplateFn,
  "yc-process-step": ycProcessStep as HtmlTemplateFn,
  "yc-faq-card": ycFaqCard as HtmlTemplateFn,
  "yc-reframe": ycReframe as HtmlTemplateFn,
  "yc-manifesto-block": ycManifestoBlock as HtmlTemplateFn,
  "yc-cover": ycCover as HtmlTemplateFn,
  // Argo
  "ar-carousel-content": arCarouselContent as HtmlTemplateFn,
  "ar-carousel-cta": arCarouselCta as HtmlTemplateFn,
  "ar-solid-violet": arSolidViolet as HtmlTemplateFn,
  "ar-ig-photo": arIgPhoto as HtmlTemplateFn,
  "ar-ig-minimal": arIgMinimal as HtmlTemplateFn,
};

export const FORMAT_DIMS: Record<PostFormat, { width: number; height: number }> = {
  ig_feed: { width: 1080, height: 1080 },
  li_single: { width: 1200, height: 800 },
  li_carousel: { width: 1080, height: 1350 },
};

export function getHtmlTemplate(slug: string): HtmlTemplateFn | null {
  return HTML_TEMPLATES[slug] ?? null;
}

export function listAvailableHtmlTemplates(): string[] {
  return Object.keys(HTML_TEMPLATES);
}
