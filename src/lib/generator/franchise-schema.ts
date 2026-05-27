import { z } from "zod";
import type { Franchise } from "@/lib/franchises/types";

export const SceneSchema = z.object({
  index: z.number().int().min(1),
  /** On-screen / spoken text for this scene (kept short by the prompt). */
  script: z.string().min(1),
  /** AI image-generation prompt for this scene's background. */
  image_prompt: z.string().min(1),
});

export const FranchiseSlideSchema = z.object({
  index: z.number().int().min(1),
  kind: z.enum(["cover", "content", "cta"]),
  title: z.string().nullish(),
  body: z.string().nullish(),
});

export const FranchisePieceSchema = z.object({
  franchise_slug: z.string().min(1),
  format: z.enum(["reel", "carousel"]),
  title: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).nullish().transform((v) => v ?? []),
  cta: z.string().nullish(),
  scenes: z.array(SceneSchema).nullish(),
  slides: z.array(FranchiseSlideSchema).nullish(),
});

export type FranchisePieceInput = z.infer<typeof FranchisePieceSchema>;

/**
 * Build a batch schema bound to a specific ordered franchise list. Enforces:
 * exactly one piece per franchise, each with the franchise's format and unit
 * count (scenes for reels, slides for carousels).
 */
export function buildFranchiseBatchSchema(franchises: Franchise[]) {
  const bySlug = new Map(franchises.map((f) => [f.slug, f]));

  return z
    .object({
      run_summary: z.string().optional(),
      pieces: z.array(FranchisePieceSchema),
    })
    .superRefine((data, ctx) => {
      if (data.pieces.length !== franchises.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Esperaba ${franchises.length} piezas (una por franquicia), recibio ${data.pieces.length}`,
        });
      }

      data.pieces.forEach((p, idx) => {
        const f = bySlug.get(p.franchise_slug);
        if (!f) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `pieces[${idx}]: franchise_slug "${p.franchise_slug}" no pertenece a esta tanda`,
            path: ["pieces", idx, "franchise_slug"],
          });
          return;
        }
        if (p.format !== f.format) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `pieces[${idx}] (${f.slug}) debe ser format="${f.format}", recibio "${p.format}"`,
            path: ["pieces", idx, "format"],
          });
        }
        if (f.format === "reel") {
          if (!p.scenes || p.scenes.length !== f.units) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `pieces[${idx}] (${f.slug}) debe tener ${f.units} scenes, recibio ${p.scenes?.length ?? 0}`,
              path: ["pieces", idx, "scenes"],
            });
          }
        } else {
          if (!p.slides || p.slides.length !== f.units) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `pieces[${idx}] (${f.slug}) debe tener ${f.units} slides, recibio ${p.slides?.length ?? 0}`,
              path: ["pieces", idx, "slides"],
            });
          }
        }
      });
    });
}

export type FranchiseBatchResponse = {
  run_summary?: string;
  pieces: FranchisePieceInput[];
};
