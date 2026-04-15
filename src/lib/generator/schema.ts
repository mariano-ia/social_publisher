import { z } from "zod";

// Slide schema. Accept 0-indexed and 1-indexed (0..6) because Claude
// sometimes 0-indexes and different batches have different slide counts.
// The orchestrator renumbers slides to 1..N canonically before persisting.
export const SlideSchema = z.object({
  index: z.number().int().min(0).max(6),
  kind: z.enum(["cover", "content", "cta"]),
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
  body: z.string().nullish(),
  visual_hint: z.string().nullish(),
});

// Single post schema. Tolerant of Claude returning null or omitting optional
// fields. The only truly required fields are the ones without which we can't
// render anything: slot_order, format, title, copy. Everything else has
// either a default, a fallback, or gets filled in by the orchestrator.
export const GeneratedPostSchema = z.object({
  slot_order: z.number().int().min(1).max(12),
  format: z.enum(["ig_feed", "li_single", "li_carousel", "ig_carousel"]),
  title: z.string().min(1),
  copy: z.string().min(1),
  pillar: z.string().nullish().transform((v) => v ?? ""),
  topic: z.string().nullish().transform((v) => v ?? ""),
  hashtags: z.array(z.string()).nullish().transform((v) => v ?? []),
  cta: z.string().nullish(),
  // If Claude omits the slug, the orchestrator picks one via round-robin
  // from available templates for that format.
  visual_template_slug: z.string().nullish(),
  visual_variables: z.record(z.string(), z.unknown()).nullish().transform((v) => v ?? {}),
  slides: z.array(SlideSchema).nullish(),
});

interface CadenceShape {
  ig_feed: number;
  li_single: number;
  li_carousel: number;
  ig_carousel: number;
  carousel_slides: number;
}

/**
 * Build a batch response schema that validates the exact cadence expected
 * for a specific tenant. Cadence-aware so each tenant can have its own
 * shape (e.g. Argo with 2 IG + 1 IG carousel vs Yacaré with 2 IG + 2 LI
 * single + 1 LI carousel).
 */
export function buildBatchSchema(cadence: CadenceShape) {
  return z
    .object({
      run_summary: z.string().optional(),
      posts: z.array(GeneratedPostSchema),
    })
    .superRefine((data, ctx) => {
      const counts = { ig_feed: 0, li_single: 0, li_carousel: 0, ig_carousel: 0 };
      data.posts.forEach((p) => {
        counts[p.format]++;
      });
      const checks: Array<[keyof typeof counts, number, string]> = [
        ["ig_feed", cadence.ig_feed, "posts de Instagram feed"],
        ["li_single", cadence.li_single, "posts single de LinkedIn"],
        ["li_carousel", cadence.li_carousel, "carruseles de LinkedIn"],
        ["ig_carousel", cadence.ig_carousel, "carruseles de Instagram"],
      ];
      for (const [field, expected, label] of checks) {
        if (counts[field] !== expected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Esperaba ${expected} ${label}, recibió ${counts[field]}`,
          });
        }
      }

      // Carousel posts must have exactly cadence.carousel_slides slides in
      // the right kind order: cover → content×N → cta.
      data.posts.forEach((p, idx) => {
        if (p.format === "li_carousel" || p.format === "ig_carousel") {
          const expectedSlideCount = cadence.carousel_slides;
          if (!p.slides || p.slides.length !== expectedSlideCount) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `posts[${idx}] (${p.format}) debe tener exactamente ${expectedSlideCount} slides, recibió ${p.slides?.length ?? 0}`,
              path: ["posts", idx, "slides"],
            });
            return;
          }
          const kinds = p.slides.map((s) => s.kind);
          const expectedKinds = ["cover"];
          for (let i = 0; i < expectedSlideCount - 2; i++) expectedKinds.push("content");
          expectedKinds.push("cta");
          for (let i = 0; i < expectedSlideCount; i++) {
            if (kinds[i] !== expectedKinds[i]) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `posts[${idx}].slides[${i}] debe ser kind="${expectedKinds[i]}", recibió "${kinds[i]}"`,
                path: ["posts", idx, "slides", i, "kind"],
              });
            }
          }
        }
      });
    });
}

// Back-compat: default export for callers that don't know the cadence yet.
// Validates basic shape only (post count flexibility up to 12).
export const BatchResponseSchema = z.object({
  run_summary: z.string().optional(),
  posts: z.array(GeneratedPostSchema),
});

// Single idea response (1 post only)
export const SingleIdeaResponseSchema = z.object({
  run_summary: z.string().optional(),
  posts: z.array(GeneratedPostSchema).length(1),
});

export type GeneratedPostInput = z.infer<typeof GeneratedPostSchema>;
export type BatchResponse = z.infer<typeof BatchResponseSchema>;
export type SingleIdeaResponse = z.infer<typeof SingleIdeaResponseSchema>;
export type SlideInput = z.infer<typeof SlideSchema>;
