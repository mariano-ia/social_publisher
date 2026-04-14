// Shared CSS variables and base styles for all Yacaré HTML templates.
// Real Yacaré tokens extracted from www.yacare.io main-BOvp8c7n.css.

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
.frame { padding: 9% 9.5%; height: 100%; display: flex; flex-direction: column; position: relative; }
.spacer { flex: 1; }
.header { display: flex; justify-content: space-between; align-items: center; }
.logo { height: 32px; width: auto; filter: invert(1) brightness(2); }
.tag { font-family: var(--body); font-size: 14px; font-weight: 600; letter-spacing: 0.22em; color: rgba(255,255,255,0.5); text-transform: uppercase; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 48px; }
.slug { display: flex; align-items: center; gap: 12px; font-family: var(--body); font-size: 14px; font-weight: 600; letter-spacing: 0.32em; color: rgba(255,255,255,0.5); text-transform: uppercase; }
.slug .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
`;

export interface YacareTemplateProps {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  body_text?: string;
  cta?: string;
  pillar?: string;
  // Carousel slide context
  slide?: {
    index: number;
    kind: "cover" | "content" | "cta";
    title?: string;
    body?: string;
  };
  logoDataUrl?: string; // optional inline logo (base64 data url) for offline rendering
}

export function htmlShell(opts: { title: string; styles: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${opts.title}</title>
<style>${YC_BASE_CSS}${opts.styles}</style>
</head><body>${opts.body}</body></html>`;
}

export function logoTag(props: YacareTemplateProps): string {
  if (props.logoDataUrl) return `<img class="logo" src="${props.logoDataUrl}" alt="yacaré">`;
  return `<img class="logo" src="/brand/yacare/logo.svg" alt="yacaré">`;
}
