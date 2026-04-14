import type { PostFormat } from "@/lib/db/types";
import { type YacareTemplateProps } from "./templates/yacare/_shared";
import { ycContrarianTake } from "./templates/yacare/yc-contrarian-take";
import { ycProcessStep } from "./templates/yacare/yc-process-step";
import { ycFaqCard } from "./templates/yacare/yc-faq-card";
import { ycReframe } from "./templates/yacare/yc-reframe";
import { ycManifestoBlock } from "./templates/yacare/yc-manifesto-block";

export type HtmlTemplateFn = (props: YacareTemplateProps) => string;

export const HTML_TEMPLATES: Record<string, HtmlTemplateFn> = {
  "yc-contrarian-take": ycContrarianTake,
  "yc-process-step": ycProcessStep,
  "yc-faq-card": ycFaqCard,
  "yc-reframe": ycReframe,
  "yc-manifesto-block": ycManifestoBlock,
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
