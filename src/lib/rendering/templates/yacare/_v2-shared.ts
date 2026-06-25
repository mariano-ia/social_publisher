// ───────────────────────────────────────────────────────────────────────────
// Yacaré visual system v2 ("Product Studio")
// ───────────────────────────────────────────────────────────────────────────
//
// One graphic family, two volumes:
//   - "C" (loud)  → simple posts (1:1). Full purple bleed, Archivo Black, big
//                   short hooks. Templates: yc2-statement, yc2-stat, yc2-reframe.
//   - "D" (quiet) → carousels (4:5). Dark ink background, bordered panel,
//                   Space Grotesk. Templates: yc2-cover, yc2-content, yc2-cta.
//
// Shared DNA across both volumes (this is what makes them the same "party"):
//   - Logo wordmark "yacaré" in Archivo Black, lowercase.
//   - Metadata in Space Mono (footer, slide index, eyebrow, corner tag).
//   - Palette: ink #0d0a14, purple #7C3AED→#5B21B6, lavender #C4B5FD, and the
//     lime #D8FF3E as a shared accent (sticker/CTA in C, tick/eyebrow in D).
//   - Subtle film grain over everything.
//   - Footer: `yacaré.io` + a short mono slug. SMALL, and WITHOUT the lime dot
//     (explicit client decision — the lime lives elsewhere, never in the footer).
//
// All sizes are authored on the real 1080px canvas (not the brainstorm mockup
// scale). Headlines size adaptively to text length with a guaranteed minimum so
// copy never overflows and words are never split (`word-break: keep-all`).
//
// Replaces the legacy yc-* templates (yc-cover, yc-contrarian-take, …) which
// leaned on radial glows + outlined corner circles — both retired here.

import type { YacareTemplateProps } from "./_shared";

export type { YacareTemplateProps };

/** Brand tokens for the v2 system. Hex values are the single source of truth. */
export const YC2_TOKENS = {
  ink: "#0d0a14", // carousel background (near-black with a purple cast)
  purpleA: "#7C3AED", // simple-post gradient start
  purpleB: "#5B21B6", // simple-post gradient end
  accent: "#8A5EFF", // mid purple (numbers, small accents)
  lavender: "#C4B5FD", // light purple (gradient text top stop)
  lime: "#D8FF3E", // shared secondary accent
  blackBlock: "#11071f", // emphasis block / lime-on-dark chip text
  display: "'Archivo Black', 'Archivo', sans-serif", // loud headlines (C)
  displayQuiet: "'Space Grotesk', sans-serif", // restrained headlines (D)
  mono: "'Space Mono', monospace", // all metadata
};

/** Google Fonts import shared by every v2 template. */
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`;

/**
 * Subtle film grain as an inline SVG data URI. Painted on a `::after` overlay
 * above the artwork but below nothing interactive (these are static PNGs).
 */
export const GRAIN_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")";

/**
 * Base CSS shared by all v2 templates: reset, brand vars, the grain overlay,
 * the small dot-less footer, the logo wordmark, and the simple-post background
 * mix (hairline grid + sheen + vignette — the client-approved "A+B" treatment).
 */
export const YC2_BASE_CSS = `
${FONT_IMPORT}
:root {
  --ink: ${YC2_TOKENS.ink};
  --purple-a: ${YC2_TOKENS.purpleA};
  --purple-b: ${YC2_TOKENS.purpleB};
  --accent: ${YC2_TOKENS.accent};
  --lavender: ${YC2_TOKENS.lavender};
  --lime: ${YC2_TOKENS.lime};
  --display: ${YC2_TOKENS.display};
  --display-quiet: ${YC2_TOKENS.displayQuiet};
  --mono: ${YC2_TOKENS.mono};
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;
    /* Never split a word mid-glyph — if a hook is too long the font size drops instead. */
    word-break: keep-all; overflow-wrap: normal; hyphens: none; }
html, body { width: 100vw; height: 100vh; overflow: hidden; color: #fff; }

/* Grain overlay — every template adds class "grain" to its root frame. */
.grain::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 3;
  opacity: 0.5; background-image: ${GRAIN_DATA_URI}; }

/* Logo wordmark — shared across C and D. */
.yc-logo { font-family: var(--display); font-size: 46px; letter-spacing: -0.02em; color: #fff; }

/* Footer — SMALL, mono, NO lime dot. Shared across C and D. */
.yc-foot { position: relative; z-index: 2; display: flex; justify-content: space-between;
  align-items: flex-end; font-family: var(--mono); font-size: 24px; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.72); }
.yc-foot .slug { text-transform: uppercase; }

/* Corner metadata (top-right) — mono. */
.yc-meta { font-family: var(--mono); font-size: 26px; letter-spacing: 0.05em;
  color: rgba(255,255,255,0.6); }

/* ── C (loud, simple posts) ─────────────────────────────────────────────── */
/* Full purple bleed + the approved A+B background mix (hairline grid + sheen
   + vignette). The mix sits on z-index 1, content on 2, grain on 3. */
.c-frame { position: relative; height: 100%; padding: 80px; display: flex;
  flex-direction: column; background: linear-gradient(150deg, var(--purple-a) 0%, var(--purple-b) 100%);
  font-family: 'Archivo', sans-serif; }
.c-mix { position: absolute; inset: 0; z-index: 1; pointer-events: none; background:
  repeating-linear-gradient(0deg, transparent 0 118px, rgba(255,255,255,0.05) 118px 120px),
  radial-gradient(115% 90% at 18% 12%, rgba(255,255,255,0.12) 0%, transparent 46%),
  radial-gradient(100% 100% at 92% 104%, rgba(0,0,0,0.30) 0%, transparent 55%); }
.c-top { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; }
.c-mid { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.c-kicker { font-family: var(--mono); font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--lime); margin-bottom: 40px; }
.c-h { font-family: var(--display); line-height: 0.98; letter-spacing: -0.01em; text-transform: uppercase; }
.c-h .lime { color: var(--lime); }
.c-h .block { background: ${YC2_TOKENS.blackBlock}; padding: 0 0.18em; }

/* ── D (quiet, carousels) ───────────────────────────────────────────────── */
.d-frame { position: relative; height: 100%; padding: 72px; display: flex; flex-direction: column;
  background: var(--ink); font-family: var(--display-quiet); }
.d-top { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; }
.d-panel { position: relative; z-index: 2; flex: 1; margin-top: 44px; display: flex; flex-direction: column;
  border: 1px solid rgba(255,255,255,0.10); border-radius: 28px; padding: 60px 56px;
  background: linear-gradient(180deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0) 55%); }
.d-eyebrow { font-family: var(--mono); font-size: 22px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--lime); margin-bottom: 36px; }
.d-h { font-family: var(--display-quiet); font-weight: 600; line-height: 1.04; letter-spacing: -0.02em; color: #fff; }
.d-h .grad { background: linear-gradient(90deg, var(--lavender), var(--accent));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.d-foot-pad { margin-top: 40px; }
`;

/** Wrap a template body in the full HTML document with the shared base CSS. */
export function htmlShell2(opts: { title: string; styles: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${opts.title}</title>
<style>${YC2_BASE_CSS}${opts.styles}</style>
</head><body>${opts.body}</body></html>`;
}

/** HTML-escape a possibly-null string for safe interpolation. */
export function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Pick a font size from length thresholds so long copy shrinks instead of
 * overflowing. `steps` is ordered largest-first: `[maxChars, px]`. The last
 * entry is the floor used for anything longer.
 */
export function adaptiveSize(text: string, steps: Array<[number, number]>): number {
  const len = (text ?? "").trim().length;
  for (const [maxChars, px] of steps) {
    if (len <= maxChars) return px;
  }
  return steps[steps.length - 1][1];
}

/** The shared logo wordmark markup. */
export function logoWordmark(): string {
  return `<span class="yc-logo">yacaré</span>`;
}

/** The shared, dot-less footer. `slug` is a short mono label (e.g. "MVPs", "FIN"). */
export function footer(slug: string, opts?: { domain?: string }): string {
  return `<div class="yc-foot"><span>${escapeHtml(opts?.domain ?? "yacaré.io")}</span><span class="slug">${escapeHtml(slug)}</span></div>`;
}

/**
 * Automatic lime accent for loud headlines. When the hook is two-or-more
 * sentences (the brand's signature "X. Y." contrast), the LAST sentence is
 * limed; a single sentence is left plain. Keeps the emphasis on-brand without
 * the generator having to mark up which words to accent.
 */
export function emphasizeLastSentence(text: string | null | undefined): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (parts.length < 2) return escapeHtml(t);
  const last = parts.pop() as string;
  return `${escapeHtml(parts.join(" "))} <span class="lime">${escapeHtml(last)}</span>`;
}

/** Wrap the last word of a headline in the lavender→accent gradient (quiet D). */
export function gradLastWord(text: string | null | undefined): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const words = t.split(/\s+/);
  if (words.length < 2) return `<span class="grad">${escapeHtml(t)}</span>`;
  const last = words.pop() as string;
  return `${escapeHtml(words.join(" "))} <span class="grad">${escapeHtml(last)}</span>`;
}

/**
 * Map a pillar slug to the short mono eyebrow word shown on carousels and the
 * footer slug on simples. Falls back to a cleaned-up version of the slug.
 */
export function pillarLabel(pillar?: string | null): string {
  if (!pillar) return "Producto";
  const map: Record<string, string> = {
    mvps_honestos: "Producto",
    discovery_delivery: "Discovery",
    ia_criterio: "IA",
    ux_b2b: "UX · B2B",
    antes_de_construir: "Producto",
    producto_vs_features: "Producto",
  };
  return map[pillar] ?? pillar.replace(/_/g, " ");
}
