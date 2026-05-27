# Argo Social Fase A — Voz v2 + Franquicias (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the generation "brain" for Argo's new consumer social strategy: a v2 brand voice plus a franchise-driven batch generator that produces ready-to-publish copy (reels as scenes, carousels as slides), validated as text before any Blotato or rendering integration.

**Architecture:** Fase A is intentionally isolated from the existing render/persist pipeline (`orchestrate.ts`, puppeteer, gpt-image-1) and from the DB `format` enum. It adds pure, independently testable units: franchise config, a franchise content schema (zod), the v2 voice prompt, franchise-aware prompt composition, and a thin Claude-calling generator. A CLI preview script proves it end-to-end. Rendering via Blotato and DB persistence are deferred to Fase B.

**Tech Stack:** TypeScript (ESM, `@/*` → `src/*`), Zod, Anthropic SDK (`claude-sonnet-4-5`), Vitest (added here), tsx (already present).

**Spec:** `docs/superpowers/specs/2026-05-27-argo-social-strategy-blotato-design.md`

---

## File Structure

Created in this phase:
- `vitest.config.ts` — test runner config with `@/` alias.
- `src/lib/generator/json-utils.ts` — `extractJson` + `stripEmojisDeep`, extracted from `index.ts` (DRY) so the franchise generator reuses them.
- `src/lib/generator/json-utils.test.ts` — tests for the extracted utils.
- `src/lib/franchises/types.ts` — `Franchise`, `ToneRegister`, `FranchiseFormat`, `Platform`.
- `src/lib/franchises/argo.ts` — the 6 Argo franchises + `ARGO_WEEKLY_FRANCHISES`.
- `src/lib/franchises/argo.test.ts` — config invariants.
- `src/lib/generator/franchise-schema.ts` — `SceneSchema`, `FranchiseSlideSchema`, `FranchisePieceSchema`, `buildFranchiseBatchSchema`.
- `src/lib/generator/franchise-schema.test.ts` — schema validation tests.
- `src/lib/prompts/argo-v2.ts` — `ARGO_V2_SYSTEM_PROMPT`.
- `src/lib/prompts/argo-v2.test.ts` — voice prompt invariants.
- `src/lib/prompts/compose-franchise.ts` — `composeFranchiseSystemPrompt`, `buildFranchiseUserPrompt` (pure).
- `src/lib/prompts/compose-franchise.test.ts` — composition tests.
- `src/lib/generator/franchise-generate.ts` — `generateFranchiseBatch` (Claude call + validation).
- `scripts/preview-argo-franchises.ts` — CLI: generate + print JSON for manual validation.

Modified:
- `src/lib/generator/index.ts` — import `extractJson`/`stripEmojisDeep` from `json-utils` instead of defining them inline.
- `package.json` — add `test`, `test:watch`, `preview:argo` scripts + `vitest` devDependency.

NOT touched in Fase A (deferred to Fase B): `orchestrate.ts`, `schema.ts` (count-based path stays as-is for Yacaré), DB schema, `PostCard.tsx`, any `/api` route, any rendering file.

---

## Task 1: Test infrastructure (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest**

Run:
```bash
npm install -D vitest
```
Expected: `vitest` added to devDependencies, no peer-dep errors.

- [ ] **Step 2: Create the vitest config with the `@/` alias**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json` `"scripts"`, add these three entries (keep existing ones):
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "preview:argo": "tsx scripts/preview-argo-franchises.ts"
```

- [ ] **Step 4: Add a smoke test to confirm the runner works**

Create a temporary `src/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run:
```bash
npm test
```
Expected: PASS, 1 test passed.

- [ ] **Step 6: Remove the smoke test and commit**

```bash
rm src/smoke.test.ts
git add vitest.config.ts package.json package-lock.json
git commit -m "test: add vitest infrastructure with @/ alias"
```

---

## Task 2: Extract JSON utilities from the generator (DRY)

`extractJson` and `stripEmojisDeep` currently live inline in `src/lib/generator/index.ts` (lines ~239-302). The franchise generator needs the same logic. Extract them into a shared module and have both callers import it. This also gives the existing logic test coverage.

**Files:**
- Create: `src/lib/generator/json-utils.ts`
- Create: `src/lib/generator/json-utils.test.ts`
- Modify: `src/lib/generator/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/generator/json-utils.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { extractJson, stripEmojisDeep } from "./json-utils";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("slices from first { to last } when surrounded by prose", () => {
    expect(extractJson('Sure! {"a":1} done')).toEqual({ a: 1 });
  });

  it("repairs trailing commas via jsonrepair", () => {
    expect(extractJson('{"a":1,}')).toEqual({ a: 1 });
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("stripEmojisDeep", () => {
  it("removes emojis from strings", () => {
    expect(stripEmojisDeep("hola 👋 mundo")).toBe("hola mundo");
  });

  it("recurses into arrays and objects", () => {
    expect(stripEmojisDeep({ t: "a ✨", xs: ["b 🚀"] })).toEqual({ t: "a", xs: ["b"] });
  });

  it("leaves non-strings untouched", () => {
    expect(stripEmojisDeep(42)).toBe(42);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
npx vitest run src/lib/generator/json-utils.test.ts
```
Expected: FAIL — cannot find module `./json-utils`.

- [ ] **Step 3: Create the module by moving the functions out of index.ts**

Create `src/lib/generator/json-utils.ts`:
```ts
import { jsonrepair } from "jsonrepair";

/**
 * Strip emojis and decorative unicode pictographs from any string field,
 * recursively. The runtime renderer ships without an emoji font, so any
 * emoji renders as a "tofu" box. Belt-and-suspenders on top of the explicit
 * "no emojis" rule in the user prompt.
 */
const EMOJI_RE = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

export function stripEmojisDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(EMOJI_RE, "").replace(/[ \t]{2,}/g, " ").trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripEmojisDeep);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripEmojisDeep(v);
    }
    return out;
  }
  return value;
}

/**
 * Parse an LLM response as JSON, with escalating recovery:
 *   1. Direct JSON.parse after stripping markdown fences.
 *   2. Slice from first `{` to last `}` and parse again.
 *   3. Run jsonrepair on the slice (unescaped quotes, missing/trailing commas,
 *      single quotes, raw newlines inside strings, etc.).
 */
export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("LLM response did not contain JSON");
  }
  const sliced = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(sliced);
  } catch {
    /* fall through */
  }

  try {
    const repaired = jsonrepair(sliced);
    return JSON.parse(repaired);
  } catch (err) {
    throw new Error(
      `Unable to parse LLM response as JSON even after repair: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run src/lib/generator/json-utils.test.ts
```
Expected: PASS, all 8 tests.

- [ ] **Step 5: Update index.ts to import from json-utils and delete the inline copies**

In `src/lib/generator/index.ts`:
1. Add to the imports at the top (after the existing `import { z } from "zod";` line):
```ts
import { extractJson, stripEmojisDeep } from "./json-utils";
```
2. Delete the inline `const EMOJI_RE = ...`, the `function stripEmojisDeep(...)`, and the `function extractJson(...)` definitions (the whole block from the `/** Strip emojis ... */` comment through the end of `extractJson`). Also delete the now-unused `import { jsonrepair } from "jsonrepair";` line at the top of `index.ts`.

- [ ] **Step 6: Verify nothing else broke**

Run:
```bash
npm run typecheck && npx vitest run src/lib/generator/json-utils.test.ts
```
Expected: typecheck passes (no unused/missing symbols), tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/generator/json-utils.ts src/lib/generator/json-utils.test.ts src/lib/generator/index.ts
git commit -m "refactor: extract extractJson + stripEmojisDeep into json-utils (DRY)"
```

---

## Task 3: Franchise types + Argo franchise config

**Files:**
- Create: `src/lib/franchises/types.ts`
- Create: `src/lib/franchises/argo.ts`
- Create: `src/lib/franchises/argo.test.ts`

- [ ] **Step 1: Write the types**

Create `src/lib/franchises/types.ts`:
```ts
export type ToneRegister = "calido" | "revelador" | "directo";
export type FranchiseFormat = "reel" | "carousel";
export type Platform = "instagram" | "tiktok";
export type FranchisePillar = "vinculo" | "metodo" | "mitos" | "producto";

/**
 * A named recurring content series. `blotatoTemplateId` is metadata consumed in
 * Fase B (publishing); Fase A only needs it to round-trip. `units` is the number
 * of scenes (reel) or slides (carousel) the generator must produce for a piece.
 */
export interface Franchise {
  slug: string;
  name: string;
  pillar: FranchisePillar;
  tone: ToneRegister;
  format: FranchiseFormat;
  platforms: Platform[];
  blotatoTemplateId: string;
  units: number;
  /** One-paragraph instruction to the LLM about this franchise's angle. */
  brief: string;
}
```

- [ ] **Step 2: Write the failing test for the Argo config**

Create `src/lib/franchises/argo.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ARGO_FRANCHISES, ARGO_WEEKLY_FRANCHISES } from "./argo";

describe("ARGO_FRANCHISES", () => {
  it("defines exactly 6 franchises", () => {
    expect(ARGO_FRANCHISES).toHaveLength(6);
  });

  it("has unique slugs", () => {
    const slugs = ARGO_FRANCHISES.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every franchise has valid pillar, tone, format and units > 0", () => {
    for (const f of ARGO_FRANCHISES) {
      expect(["vinculo", "metodo", "mitos", "producto"]).toContain(f.pillar);
      expect(["calido", "revelador", "directo"]).toContain(f.tone);
      expect(["reel", "carousel"]).toContain(f.format);
      expect(f.units).toBeGreaterThan(0);
      expect(f.platforms.length).toBeGreaterThan(0);
      expect(f.brief.length).toBeGreaterThan(20);
    }
  });

  it("briefs and names contain no voseo and no em dashes", () => {
    const voseo = /\b(podés|querés|tenés|hacés|mirá|hacé|poné|dejá|sos|acá)\b/i;
    for (const f of ARGO_FRANCHISES) {
      expect(f.brief).not.toMatch(voseo);
      expect(f.brief).not.toContain("—");
      expect(f.name).not.toContain("—");
    }
  });
});

describe("ARGO_WEEKLY_FRANCHISES", () => {
  it("has 5 entries that all exist in ARGO_FRANCHISES", () => {
    expect(ARGO_WEEKLY_FRANCHISES).toHaveLength(5);
    const known = new Set(ARGO_FRANCHISES.map((f) => f.slug));
    for (const slug of ARGO_WEEKLY_FRANCHISES) {
      expect(known.has(slug)).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run:
```bash
npx vitest run src/lib/franchises/argo.test.ts
```
Expected: FAIL — cannot find module `./argo`.

- [ ] **Step 4: Write the Argo franchise config**

Create `src/lib/franchises/argo.ts`:
```ts
import type { Franchise } from "./types";

/**
 * Blotato visual template ids (from blotato_list_visual_templates). Used in Fase B.
 */
const TEMPLATES = {
  aiStoryVideo: "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  whenXThenY: "/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1",
  tutorialCarousel: "/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1",
  imageSlideshowProminent: "/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1",
  igCarouselSlideshow: "53cfec04-2500-41cf-8cc1-ba670d2c341a",
} as const;

export const ARGO_FRANCHISES: Franchise[] = [
  {
    slug: "60-segundos-metodo",
    name: "60 segundos de metodo",
    pillar: "metodo",
    tone: "revelador",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.aiStoryVideo,
    units: 3,
    brief:
      "Micro pildora educativa: explica en lenguaje de padres una idea del metodo Argo (un eje DISC, el motor, un arquetipo) aplicada a una escena deportiva concreta. Tono revelador: planteas una observacion poco obvia y la explicas claro. Termina invitando a pensar distinto, sin vender.",
  },
  {
    slug: "carta-papa-deportivo",
    name: "Carta a un papa deportivo",
    pillar: "vinculo",
    tone: "calido",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.aiStoryVideo,
    units: 4,
    brief:
      "Una reflexion breve dirigida a una madre o padre sobre una escena cotidiana del deporte infantil (el chico que se frustra, el que no quiere ir a entrenar, el que se compara). Tono calido, de igual a igual, empatico. Reencuadra la escena desde la comprension del chico, nunca desde el reto ni la exigencia.",
  },
  {
    slug: "como-funciona-mente",
    name: "Como funciona la mente de...",
    pillar: "metodo",
    tone: "revelador",
    format: "carousel",
    platforms: ["instagram"],
    blotatoTemplateId: TEMPLATES.tutorialCarousel,
    units: 5,
    brief:
      "Explica un arquetipo o un rasgo (ej: el chico que necesita saber el por que antes de hacer) en lenguaje de padres. Cover con el hook, slides de contenido que describen como tiende a comportarse y como acompanarlo, y un cierre. Lenguaje probabilistico, sin etiquetas rigidas.",
  },
  {
    slug: "mito-vs-dato",
    name: "Mito vs Dato",
    pillar: "mitos",
    tone: "directo",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.whenXThenY,
    units: 3,
    brief:
      "Derriba un mito del deporte infantil (ej: el chico timido no sirve para deportes de equipo). Cada escena contrapone el mito y el dato. Tono directo y con postura, pero nunca agresivo ni contra el lector: cuestiona la creencia, no a quien la sostiene.",
  },
  {
    slug: "el-gesto-que-cambia",
    name: "El gesto que cambia todo",
    pillar: "vinculo",
    tone: "calido",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.imageSlideshowProminent,
    units: 4,
    brief:
      "Un cambio concreto y pequeno en como el adulto (padre o entrenador) le habla al chico, accionable hoy mismo. Tono calido y practico. Una sola idea por pieza, mostrada con un antes y un despues de la frase o el gesto.",
  },
  {
    slug: "detras-de-la-odisea",
    name: "Detras de la Odisea",
    pillar: "producto",
    tone: "calido",
    format: "carousel",
    platforms: ["instagram"],
    blotatoTemplateId: TEMPLATES.igCarouselSlideshow,
    units: 5,
    brief:
      "Muestra que es Argo sin sonar a venta: como es la experiencia de la Odisea para el chico y que recibe el adulto. Tono calido y curioso. Foco en el vinculo y la comprension, no en el rendimiento. Usa el glosario (Odisea, Perfil, adulto acompanante).",
  },
];

/** The Monday-to-Friday weekly batch (producto runs separately, biweekly). */
export const ARGO_WEEKLY_FRANCHISES: string[] = [
  "60-segundos-metodo",
  "carta-papa-deportivo",
  "como-funciona-mente",
  "mito-vs-dato",
  "el-gesto-que-cambia",
];

export function getArgoFranchises(slugs: string[]): Franchise[] {
  return slugs.map((slug) => {
    const f = ARGO_FRANCHISES.find((x) => x.slug === slug);
    if (!f) throw new Error(`Unknown Argo franchise: ${slug}`);
    return f;
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/franchises/argo.test.ts
```
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/franchises/types.ts src/lib/franchises/argo.ts src/lib/franchises/argo.test.ts
git commit -m "feat(franchises): Argo franchise types + config (6 series, weekly set)"
```

---

## Task 4: Franchise content schema (Zod)

The output schema for a franchise-driven batch. A reel piece carries `scenes`; a carousel piece carries `slides`. `buildFranchiseBatchSchema(franchises)` enforces one piece per franchise, in order, with the correct format and unit count.

**Files:**
- Create: `src/lib/generator/franchise-schema.ts`
- Create: `src/lib/generator/franchise-schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/generator/franchise-schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildFranchiseBatchSchema } from "./franchise-schema";
import type { Franchise } from "@/lib/franchises/types";

const reel: Franchise = {
  slug: "r", name: "R", pillar: "metodo", tone: "revelador", format: "reel",
  platforms: ["instagram"], blotatoTemplateId: "t", units: 2, brief: "x".repeat(30),
};
const carousel: Franchise = {
  slug: "c", name: "C", pillar: "vinculo", tone: "calido", format: "carousel",
  platforms: ["instagram"], blotatoTemplateId: "t", units: 3, brief: "x".repeat(30),
};

function reelPiece() {
  return {
    franchise_slug: "r", format: "reel", title: "Hook", caption: "Caption largo",
    hashtags: ["#a"], cta: "Segui a Argo",
    scenes: [
      { index: 1, script: "uno", image_prompt: "img uno" },
      { index: 2, script: "dos", image_prompt: "img dos" },
    ],
  };
}
function carouselPiece() {
  return {
    franchise_slug: "c", format: "carousel", title: "Hook", caption: "Caption",
    hashtags: ["#b"], cta: null,
    slides: [
      { index: 1, kind: "cover", title: "T", body: null },
      { index: 2, kind: "content", title: "T2", body: "b" },
      { index: 3, kind: "cta", title: "T3", body: "b" },
    ],
  };
}

describe("buildFranchiseBatchSchema", () => {
  const schema = buildFranchiseBatchSchema([reel, carousel]);

  it("accepts a valid batch (one piece per franchise, right order)", () => {
    const r = schema.safeParse({ run_summary: "ok", pieces: [reelPiece(), carouselPiece()] });
    expect(r.success).toBe(true);
  });

  it("rejects a reel missing scenes", () => {
    const bad = reelPiece();
    delete (bad as Record<string, unknown>).scenes;
    const r = schema.safeParse({ pieces: [bad, carouselPiece()] });
    expect(r.success).toBe(false);
  });

  it("rejects a reel with the wrong scene count", () => {
    const bad = reelPiece();
    bad.scenes = [{ index: 1, script: "uno", image_prompt: "img" }];
    const r = schema.safeParse({ pieces: [bad, carouselPiece()] });
    expect(r.success).toBe(false);
  });

  it("rejects a carousel missing slides", () => {
    const bad = carouselPiece();
    delete (bad as Record<string, unknown>).slides;
    const r = schema.safeParse({ pieces: [reelPiece(), bad] });
    expect(r.success).toBe(false);
  });

  it("rejects a piece whose franchise_slug is not in the batch", () => {
    const bad = reelPiece();
    bad.franchise_slug = "ghost";
    const r = schema.safeParse({ pieces: [bad, carouselPiece()] });
    expect(r.success).toBe(false);
  });

  it("rejects a wrong piece count", () => {
    const r = schema.safeParse({ pieces: [reelPiece()] });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
npx vitest run src/lib/generator/franchise-schema.test.ts
```
Expected: FAIL — cannot find module `./franchise-schema`.

- [ ] **Step 3: Write the schema**

Create `src/lib/generator/franchise-schema.ts`:
```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/generator/franchise-schema.test.ts
```
Expected: PASS, all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/generator/franchise-schema.ts src/lib/generator/franchise-schema.test.ts
git commit -m "feat(generator): franchise content schema (reel scenes + carousel slides)"
```

---

## Task 5: Argo v2 brand voice prompt

The hand-written system prompt that encodes the new consumer strategy. Replaces the role of `argo-legacy.ts` for the franchise path. Validated by asserting it contains the non-negotiable invariants and omits voseo.

**Files:**
- Create: `src/lib/prompts/argo-v2.ts`
- Create: `src/lib/prompts/argo-v2.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/prompts/argo-v2.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ARGO_V2_SYSTEM_PROMPT } from "./argo-v2";

describe("ARGO_V2_SYSTEM_PROMPT", () => {
  it("states the positioning line", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("comprension");
  });

  it("declares tuteo and forbids voseo", () => {
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("tuteo");
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("voseo");
  });

  it("names the three tone registers", () => {
    for (const t of ["calido", "revelador", "directo"]) {
      expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain(t);
    }
  });

  it("includes the glossary and the blacklist", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("Odisea");
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("adulto acompanante");
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("talento");
  });

  it("contains no voseo verb forms and no em dashes", () => {
    const voseo = /\b(podés|querés|tenés|hacés|mirá|hacé|poné|dejá|sentí|vení)\b/i;
    expect(ARGO_V2_SYSTEM_PROMPT).not.toMatch(voseo);
    expect(ARGO_V2_SYSTEM_PROMPT).not.toContain("—");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
npx vitest run src/lib/prompts/argo-v2.test.ts
```
Expected: FAIL — cannot find module `./argo-v2`.

- [ ] **Step 3: Write the prompt**

Create `src/lib/prompts/argo-v2.ts`:
```ts
// Argo brand voice v2 — consumer strategy (IG + TikTok), franchise-based.
// Replaces the B2B legacy prompt for the franchise generation path.
// All copy is Spanish latam neutro, tuteo (never voseo), no em dashes, no emojis.

export const ARGO_V2_SYSTEM_PROMPT = `# Argo Method: Departamento de contenido (redes)

Sos el departamento de contenido de Argo Method para Instagram y TikTok. Operas de
forma autonoma siguiendo estas guidelines. Generas piezas listas para publicar.

## Que es Argo
Argo Method es un sistema de perfilamiento conductual para jovenes deportistas (8 a 16
anos), basado en el modelo DISC, el ritmo interno (Motor) y la alineacion con el entorno.
El adulto registra al chico, el chico juega la Odisea (una experiencia interactiva breve)
y el adulto recibe un Perfil con el lenguaje exacto para conectar con ese deportista.

## Posicionamiento (norte de marca)
Argo ayuda al adulto a ver a cada chico como es en el deporte. No mas fuerte, no mas
exigente: mas entendido.

> El deporte infantil no necesita mas presion. Necesita mas comprension.

Vendemos indirecto: primero el adulto entiende a su chico, despues descubre que Argo le
da el lenguaje para hacerlo. Nunca sonamos a venta dura.

## Audiencia
Mixta: madres y padres (primario) y entrenadores (secundario). Hablamos de igual a igual,
nunca desde arriba.

## Sistema de tono (3 registros)
Cada pieza usa el registro que le indique su franquicia:
- **calido**: de madre o padre a madre o padre. Escenas cotidianas, empatia, cercania.
- **revelador**: "sabias que". Curiosidad mas autoridad accesible. Para metodo y DISC.
- **directo**: postura clara, sin agredir. Contra la presion, la comparacion, el grito.
  Cuestiona la creencia, nunca al lector.

## Reglas de lenguaje (no se negocian)
- Espanol latam neutro. **Tuteo siempre (tu), nunca voseo.** Prohibido: podes, queres,
  tenes, haces, mira (imperativo vos), deja (vos), sos, aca. Usa: puedes, quieres, tienes,
  haces, mira (tu), deja, eres, aqui.
- Frases cortas, voz activa. Si se dice en 5 palabras, no uses 10.
- Lenguaje probabilistico: "tiende a", "suele", "es probable que", "podria". Nunca
  diagnosticos ni sentencias definitivas.
- Centrado en el nino: foco en bienestar, disfrute y continuidad, no en rendimiento.
- Sin guiones (raya em o en). Usa puntos, comas o parentesis.
- Sin emojis ni simbolos decorativos en ningun campo.

## Glosario
| Usar | No usar |
|---|---|
| Odisea | juego, test, evaluacion, cuestionario |
| Perfil | diagnostico, resultado, puntuacion |
| Link de invitacion | URL, enlace |
| adulto acompanante | padre, madre (salvo que se sepa el rol) |

## Lista negra de terminos
No uses: talento, ganar, errores, etiquetas, control, dominacion, agresividad, rigido,
debil, inseguro, lento. Si necesitas la idea, reformula desde el bienestar y el proceso.

## Pilares
- **vinculo** (padres): como conectar, comunicar y acompanar. Registro calido.
- **metodo** (DISC, motor, arquetipos): como funciona la mente deportiva. Registro revelador.
- **mitos** (cultura del deporte infantil): derribar creencias. Registro directo.
- **producto** (la Odisea, el Perfil): que es Argo, sin venta dura. Registro calido.

## Formato de salida
Cada pieza es un reel (video vertical, contenido por escenas) o un carrusel (slides).
- reel: cada escena tiene un texto en pantalla corto y un prompt de imagen.
- carousel: slides con kind cover, content y cta.
- title: el hook visual, corto (maximo 8 palabras).
- caption: el texto largo que acompana la publicacion en IG/TikTok.
`;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/prompts/argo-v2.test.ts
```
Expected: PASS, all 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts/argo-v2.ts src/lib/prompts/argo-v2.test.ts
git commit -m "feat(prompts): Argo brand voice v2 (consumer, franchise-based)"
```

---

## Task 6: Franchise-aware prompt composition

Two pure functions: `composeFranchiseSystemPrompt` (voice prompt + the batch's franchise briefs + anti-repeat history) and `buildFranchiseUserPrompt` (the per-piece instructions + JSON shape). Deliberately does NOT reuse `compose.ts`'s `languageDirective`, which forces voseo for Spanish — Argo needs tuteo.

**Files:**
- Create: `src/lib/prompts/compose-franchise.ts`
- Create: `src/lib/prompts/compose-franchise.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/prompts/compose-franchise.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { composeFranchiseSystemPrompt, buildFranchiseUserPrompt } from "./compose-franchise";
import { ARGO_FRANCHISES, getArgoFranchises, ARGO_WEEKLY_FRANCHISES } from "@/lib/franchises/argo";

const weekly = getArgoFranchises(ARGO_WEEKLY_FRANCHISES);

describe("composeFranchiseSystemPrompt", () => {
  const prompt = composeFranchiseSystemPrompt({
    voicePrompt: "VOICE_MARKER",
    franchises: weekly,
    recentPosts: [{ title: "Algo viejo", topic: "tema viejo", created_at: "2026-05-01T00:00:00Z" }],
  });

  it("includes the brand voice prompt verbatim", () => {
    expect(prompt).toContain("VOICE_MARKER");
  });

  it("lists each franchise with its name, tone and brief", () => {
    for (const f of weekly) {
      expect(prompt).toContain(f.name);
      expect(prompt).toContain(f.tone);
      expect(prompt).toContain(f.brief.slice(0, 24));
    }
  });

  it("includes the anti-repeat history block", () => {
    expect(prompt).toContain("Algo viejo");
    expect(prompt.toLowerCase()).toContain("no repetir");
  });

  it("does not inject the voseo language directive", () => {
    expect(prompt.toLowerCase()).not.toContain("voseo cuando");
  });
});

describe("buildFranchiseUserPrompt", () => {
  const user = buildFranchiseUserPrompt(weekly);

  it("asks for one piece per franchise in order", () => {
    weekly.forEach((f) => expect(user).toContain(f.slug));
  });

  it("specifies scenes for reels and slides for carousels with unit counts", () => {
    const reel = weekly.find((f) => f.format === "reel")!;
    const carousel = weekly.find((f) => f.format === "carousel")!;
    expect(user).toContain(`${reel.units} scenes`);
    expect(user).toContain(`${carousel.units} slides`);
  });

  it("forbids emojis and demands JSON only", () => {
    expect(user.toLowerCase()).toContain("emojis");
    expect(user).toContain('"pieces"');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
npx vitest run src/lib/prompts/compose-franchise.test.ts
```
Expected: FAIL — cannot find module `./compose-franchise`.

- [ ] **Step 3: Write the composition module**

Create `src/lib/prompts/compose-franchise.ts`:
```ts
import type { Franchise } from "@/lib/franchises/types";

export interface FranchiseRecentPost {
  title: string | null;
  topic: string | null;
  created_at: string;
}

export interface ComposeFranchiseContext {
  /** The brand voice system prompt (e.g. ARGO_V2_SYSTEM_PROMPT). */
  voicePrompt: string;
  /** The franchises that make up this batch, in publish order. */
  franchises: Franchise[];
  recentPosts: FranchiseRecentPost[];
}

export function composeFranchiseSystemPrompt(ctx: ComposeFranchiseContext): string {
  const sections: string[] = [ctx.voicePrompt, ""];

  sections.push("## Franquicias de esta tanda");
  sections.push(
    "Genera exactamente una pieza por franquicia, en este orden. Respeta el registro de tono y el formato de cada una.",
  );
  sections.push("");
  ctx.franchises.forEach((f, i) => {
    const units = f.format === "reel" ? `${f.units} scenes` : `${f.units} slides`;
    sections.push(
      `${i + 1}. [${f.slug}] "${f.name}" — pilar: ${f.pillar} · tono: ${f.tone} · formato: ${f.format} (${units})`,
    );
    sections.push(`   Brief: ${f.brief}`);
  });
  sections.push("");

  sections.push(buildHistorySection(ctx.recentPosts));

  return sections.join("\n");
}

function buildHistorySection(recent: FranchiseRecentPost[]): string {
  if (recent.length === 0) {
    return "## Publicaciones recientes\n(Ninguna todavia. Esta es la primera tanda.)";
  }
  const lines = ["## Publicaciones recientes — NO REPETIR tema ni titular similar"];
  recent.forEach((p) => {
    const date = p.created_at.split("T")[0];
    lines.push(`- [${date}] "${p.title ?? "(sin titulo)"}" — tema: ${p.topic ?? "—"}`);
  });
  lines.push("");
  lines.push("REGLA DURA: no repitas el mismo tema, angulo ni titular similar a los de esta lista.");
  return lines.join("\n");
}

export function buildFranchiseUserPrompt(franchises: Franchise[]): string {
  const lines: string[] = [];
  franchises.forEach((f, i) => {
    const shape =
      f.format === "reel"
        ? `${f.units} scenes (cada scene: {index, script, image_prompt}); script es texto corto en pantalla, image_prompt describe la imagen de fondo`
        : `${f.units} slides (cada slide: {index, kind, title, body}); orden: cover, content..., cta`;
    lines.push(`${i + 1}. franchise_slug="${f.slug}" · format="${f.format}" · ${shape}`);
  });

  return `Genera ahora la tanda de esta semana: una pieza por franquicia, respetando voz, tono, pilar y reglas de no repeticion.

PROHIBIDO: ningun campo puede contener emojis, iconos ni simbolos unicode decorativos. Sin excepciones.

PIEZAS A GENERAR (en este orden):
${lines.join("\n")}

Para cada pieza:
1. title: el hook visual, corto (maximo 8 palabras).
2. caption: el texto largo listo para publicar en IG/TikTok (puede tener varias lineas, usa \\n).
3. hashtags: array de hashtags relevantes (sin emojis).
4. cta: llamado a la accion breve (puede ser null).
5. Si format="reel": llena scenes[] con la cantidad indicada. Si format="carousel": llena slides[] con la cantidad indicada y el orden cover, content..., cta.

REGLA DE ESCAPE: escapa comillas dobles con backslash y usa \\n en vez de saltos de linea literales dentro de strings.

REGLA DURA: responde UNICAMENTE con un JSON valido (sin markdown, sin backticks, sin texto antes o despues) con este shape:

{
  "run_summary": "string corto sobre el angulo general de la tanda",
  "pieces": [ ...una pieza por franquicia, en el orden de arriba ]
}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/prompts/compose-franchise.test.ts
```
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts/compose-franchise.ts src/lib/prompts/compose-franchise.test.ts
git commit -m "feat(prompts): franchise-aware system + user prompt composition"
```

---

## Task 7: Franchise batch generator (Claude call)

A thin generator: build the prompts, call Claude, parse + sanitize + validate against the franchise batch schema, with one retry on failure (mirrors `index.ts`). The pure prompt-building is already tested in Task 6; this wires the network call.

**Files:**
- Create: `src/lib/generator/franchise-generate.ts`

- [ ] **Step 1: Write the generator**

Create `src/lib/generator/franchise-generate.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import type { Franchise } from "@/lib/franchises/types";
import {
  composeFranchiseSystemPrompt,
  buildFranchiseUserPrompt,
  type FranchiseRecentPost,
} from "@/lib/prompts/compose-franchise";
import { buildFranchiseBatchSchema, type FranchiseBatchResponse } from "./franchise-schema";
import { extractJson, stripEmojisDeep } from "./json-utils";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 8000;

// Lazy client so the module is import-safe before env is loaded. The CLI
// preview script loads .env.local AFTER imports are hoisted, so constructing
// the client at module load (like index.ts does for the Next runtime) would
// read an undefined ANTHROPIC_API_KEY. Reading it at call time avoids that.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface GenerateFranchiseBatchInput {
  voicePrompt: string;
  franchises: Franchise[];
  recentPosts: FranchiseRecentPost[];
}

export interface FranchiseCallResult {
  parsed: FranchiseBatchResponse;
  retryCount: number;
}

export async function generateFranchiseBatch(
  input: GenerateFranchiseBatchInput,
): Promise<FranchiseCallResult> {
  const systemPrompt = composeFranchiseSystemPrompt({
    voicePrompt: input.voicePrompt,
    franchises: input.franchises,
    recentPosts: input.recentPosts,
  });
  const userPrompt = buildFranchiseUserPrompt(input.franchises);
  const schema = buildFranchiseBatchSchema(input.franchises);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const retryNote =
        attempt > 0
          ? `\n\nIMPORTANTE: tu respuesta anterior fallo la validacion: ${String(lastError)}. Corrigela.`
          : "";
      const response = await getClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt + retryNote,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");

      const json = extractJson(text);
      const sanitized = stripEmojisDeep(json);
      const parsed = schema.parse(sanitized);
      return { parsed: parsed as FranchiseBatchResponse, retryCount: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === 1) throw err;
    }
  }
  throw new Error("Unreachable");
}
```

- [ ] **Step 2: Verify it typechecks**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/generator/franchise-generate.ts
git commit -m "feat(generator): franchise batch generator (Claude call + validation)"
```

---

## Task 8: Preview script + manual validation

A CLI that runs the real generator with Argo's weekly franchises and prints the JSON. This is the Fase A acceptance gate: it proves the new voice produces franchise-driven, schema-valid content before any Blotato work.

**Files:**
- Create: `scripts/preview-argo-franchises.ts`

- [ ] **Step 1: Write the preview script**

Create `scripts/preview-argo-franchises.ts`:
```ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { generateFranchiseBatch } from "@/lib/generator/franchise-generate";
import { ARGO_V2_SYSTEM_PROMPT } from "@/lib/prompts/argo-v2";
import { getArgoFranchises, ARGO_WEEKLY_FRANCHISES } from "@/lib/franchises/argo";

async function main() {
  const franchises = getArgoFranchises(ARGO_WEEKLY_FRANCHISES);
  console.log(`Generating ${franchises.length} pieces for Argo weekly plan...\n`);

  const { parsed, retryCount } = await generateFranchiseBatch({
    voicePrompt: ARGO_V2_SYSTEM_PROMPT,
    franchises,
    recentPosts: [],
  });

  console.log(`retryCount: ${retryCount}`);
  console.log(`run_summary: ${parsed.run_summary ?? "(none)"}\n`);
  for (const piece of parsed.pieces) {
    console.log("─".repeat(70));
    console.log(`[${piece.franchise_slug}] (${piece.format})  ${piece.title}`);
    console.log(`caption: ${piece.caption}`);
    console.log(`cta: ${piece.cta ?? "—"}  hashtags: ${piece.hashtags.join(" ")}`);
    if (piece.scenes) piece.scenes.forEach((s) => console.log(`  scene ${s.index}: ${s.script}  [img: ${s.image_prompt}]`));
    if (piece.slides) piece.slides.forEach((s) => console.log(`  slide ${s.index} (${s.kind}): ${s.title ?? ""} — ${s.body ?? ""}`));
  }
  console.log("─".repeat(70));
  console.log("\nFull JSON:\n");
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch((err) => {
  console.error("preview failed:", err);
  process.exit(1);
});
```

Note: the `@/` alias resolves at runtime because `tsx` reads `tsconfig.json` `paths`. The existing `scripts/seed.ts` runs the same way.

- [ ] **Step 2: Confirm `ANTHROPIC_API_KEY` is set**

Run:
```bash
grep -q ANTHROPIC_API_KEY .env.local && echo "key present" || echo "MISSING — add ANTHROPIC_API_KEY to .env.local"
```
Expected: `key present`. (`.env.local` already lists `ANTHROPIC_API_KEY` per the env audit.)

- [ ] **Step 3: Run the preview (real Claude call)**

Run:
```bash
npm run preview:argo
```
Expected: prints `retryCount: 0`, a `run_summary`, and 5 pieces. If validation fails it throws with the zod message (the schema is the contract). Read the output and confirm: tuteo (no "podés/tenés"), no em dashes, no emojis, each reel has its scene count, each carousel has cover/content/cta slides, tone matches the franchise.

- [ ] **Step 4: Run the full test suite + typecheck**

Run:
```bash
npm test && npm run typecheck
```
Expected: all tests PASS, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add scripts/preview-argo-franchises.ts
git commit -m "feat(scripts): Argo franchise preview CLI (Fase A acceptance gate)"
```

---

## Definition of done (Fase A)

- `npm test` passes (json-utils, franchise config, franchise schema, voice prompt, composition).
- `npm run typecheck` is clean.
- `npm run preview:argo` generates 5 schema-valid Argo pieces whose copy reads in the new voice (tuteo, probabilistic, child-centered, no em dashes, no emojis), with reels as scenes and carousels as slides.
- No changes to `orchestrate.ts`, the DB schema, the `format` enum, `PostCard.tsx`, `/api`, or any rendering file. The existing Yacaré/Argo count-based path still works (verified by `npm run typecheck` and the untouched `index.ts` behavior).

## Handoff to Fase B (not in scope here)
Fase B wires this generator into a persisted run + Blotato: map `Franchise.blotatoTemplateId` + piece content to `blotato_create_visual` inputs, render before review, `blotato_create_post` to schedule, evolve the review panel, and add the Resend email digest. The franchise piece shape (`FranchisePieceInput`) is the stable contract between the two phases.
```
