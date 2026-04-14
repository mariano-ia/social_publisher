// Shared CSS variables and base styles for all Yacaré HTML templates.
// Real Yacaré tokens extracted from www.yacare.io main-BOvp8c7n.css.

import { readFileSync } from "node:fs";
import { join } from "node:path";

// Lazy-load the real Yacaré logo as a base64 data URL so templates don't
// depend on an HTTP server (puppeteer renders via setContent on about:blank).
let _cachedLogoDataUrl: string | null = null;
export function getYacareLogoDataUrl(): string {
  if (_cachedLogoDataUrl) return _cachedLogoDataUrl;
  try {
    const buf = readFileSync(join(process.cwd(), "public/brand/yacare/logo.svg"));
    _cachedLogoDataUrl = `data:image/svg+xml;base64,${buf.toString("base64")}`;
  } catch {
    // Fallback: tiny transparent SVG so the <img> doesn't break
    _cachedLogoDataUrl =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";
  }
  return _cachedLogoDataUrl;
}

export const YC_TOKENS = {
  bg: "#000000",
  surface: "#0a0a0a",
  text: "#ffffff",
  textDim: "rgba(255,255,255,0.55)",
  textStrike: "rgba(255,255,255,0.42)",
  textFaint: "rgba(255,255,255,0.32)",
  accent: "#8A5EFF",
  accentLight: "#BCA3FF",
  accentDark: "#6D28D9",
  accentGlow: "rgba(138,94,255,0.18)",
  display: "'Antonio', sans-serif",
  body: "'Figtree', -apple-system, sans-serif",
  supporting: "'Inter', -apple-system, sans-serif",
};

export const YC_BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
:root {
  --bg: ${YC_TOKENS.bg};
  --surface: ${YC_TOKENS.surface};
  --text: ${YC_TOKENS.text};
  --text-dim: ${YC_TOKENS.textDim};
  --text-strike: ${YC_TOKENS.textStrike};
  --text-faint: ${YC_TOKENS.textFaint};
  --accent: ${YC_TOKENS.accent};
  --accent-light: ${YC_TOKENS.accentLight};
  --accent-glow: ${YC_TOKENS.accentGlow};
  --display: ${YC_TOKENS.display};
  --body: ${YC_TOKENS.body};
  --supporting: ${YC_TOKENS.supporting};
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
html, body { width: 100vw; height: 100vh; overflow: hidden; background: var(--bg); color: var(--text); font-family: var(--body); }

/* Grid-based frame: header (auto) / middle (1fr, content centered) / footer (auto).
   This replaces the previous flex+spacer approach which did not reliably center. */
.frame {
  padding: 9% 9.5%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0;
  position: relative;
}
.header { display: flex; justify-content: space-between; align-items: center; }
.middle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}
.logo { height: 32px; width: auto; filter: invert(1) brightness(2); }
.tag { font-family: var(--body); font-size: 13px; font-weight: 600; letter-spacing: 0.22em; color: rgba(255,255,255,0.55); text-transform: uppercase; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 32px; }
.slug { display: flex; align-items: center; gap: 12px; font-family: var(--body); font-size: 13px; font-weight: 600; letter-spacing: 0.32em; color: rgba(255,255,255,0.55); text-transform: uppercase; }
.slug .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }

/* Decorative outlined circles in the bottom-right corner — shared visual motif
   across all Yacaré templates. Accent purple with low alpha. */
.corner-shape { position: absolute; right: -120px; bottom: -100px; width: 320px; height: 320px; border-radius: 50%; border: 2px solid rgba(138,94,255,0.38); pointer-events: none; }
.corner-shape-inner { position: absolute; right: -40px; bottom: -20px; width: 180px; height: 180px; border-radius: 50%; border: 1px solid rgba(138,94,255,0.22); pointer-events: none; }
`;

export interface YacareTemplateProps {
  width: number;
  height: number;
  title?: string | null;
  subtitle?: string | null;
  body_text?: string | null;
  cta?: string | null;
  pillar?: string | null;
  // Carousel slide context
  slide?: {
    index: number;
    kind: "cover" | "content" | "cta";
    title?: string | null;
    body?: string | null;
  };
  // Used by yc-cover: the list of slide titles that come next in the carousel.
  // Rendered as a teaser list in the cover to preview what's inside.
  slide_titles?: string[];
  // Used by yc-cover: total slides in the carousel (e.g. 5)
  total_slides?: number;
  logoDataUrl?: string; // optional inline logo (base64 data url) for offline rendering
}

export function htmlShell(opts: { title: string; styles: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${opts.title}</title>
<style>${YC_BASE_CSS}${opts.styles}</style>
</head><body>${opts.body}</body></html>`;
}

export function logoTag(props: YacareTemplateProps): string {
  const src = props.logoDataUrl ?? getYacareLogoDataUrl();
  return `<img class="logo" src="${src}" alt="yacaré">`;
}
