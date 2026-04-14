import { z } from "zod";

// Slide schema. Accept both 0-indexed (0..4) and 1-indexed (1..5) because
// Claude sometimes naturally 0-indexes despite our prompts. The orchestrator
// renumbers to 1..5 canonically before persisting.
// All optional string fields use .nullish() because Claude sometimes returns
// `null` instead of omitting the key, and we want both treated the same.
export const SlideSchema = z.object({
  index: z.number().int().min(0).max(5),
  kind: z.enum(["cover", "content", "cta"]),
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
  body: z.string().nullish(),
  visual_hint: z.string().nullish(),
});

// Single post schema. Tolerant of Claude returning null for optional fields.
export const GeneratedPostSchema = z
  .object({
    slot_order: z.number().int().min(1).max(8),
    format: z.enum(["ig_feed", "li_single", "li_carousel"]),
    pillar: z.string().min(1),
    topic: z.string().min(1),
    title: z.string().min(1),
    copy: z.string().min(1),
    hashtags: z.array(z.string()).nullish().transform((v) => v ?? []),
    cta: z.string().nullish(),
    visual_template_slug: z.string().min(1),
    visual_variables: z.record(z.string(), z.unknown()).nullish().transform((v) => v ?? {}),
    slides: z.array(SlideSchema).nullish(),
  })
  .superRefine((post, ctx) => {
    if (post.format === "li_carousel") {
      if (!post.slides || post.slides.length !== 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `li_carousel debe tener exactamente 5 slides, recibió ${post.slides?.length ?? 0}`,
        });
        return;
      }
      const kinds = post.slides.map((s) => s.kind);
      const expected = ["cover", "content", "content", "content", "cta"];
      for (let i = 0; i < 5; i++) {
        if (kinds[i] !== expected[i]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `slide ${i + 1} debe ser kind="${expected[i]}", recibió "${kinds[i]}"`,
          });
        }
      }
    }
  });

// Full batch response
export const BatchResponseSchema = z
  .object({
    run_summary: z.string().optional(),
    posts: z.array(GeneratedPostSchema),
  })
  .superRefine((data, ctx) => {
    const counts = { ig_feed: 0, li_single: 0, li_carousel: 0 };
    data.posts.forEach((p) => {
      counts[p.format]++;
    });
    if (counts.ig_feed !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Esperaba 4 posts ig_feed, recibió ${counts.ig_feed}`,
      });
    }
    if (counts.li_single !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Esperaba 2 posts li_single, recibió ${counts.li_single}`,
      });
    }
    if (counts.li_carousel !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Esperaba 2 posts li_carousel, recibió ${counts.li_carousel}`,
      });
    }
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
