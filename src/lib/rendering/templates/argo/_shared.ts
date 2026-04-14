// Shared Argo tokens extracted from Figma `auto_Contenido_SMO`.
// Real palette used on production Argo Method content.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const AR_TOKENS = {
  // Backgrounds
  lavenderLight: "#E9E5F5", // IG feed top area — pale lavender
  lavenderMid: "#DBD4EE",   // gradient mid
  violet: "#8558B5",         // solid violet variant B + footer
  violetDark: "#6A3F96",     // darker footer
  violetLight: "#9A73C6",    // highlights on violet

  // Content backgrounds
  contentLight: "#F5F3F8",   // carousel content slides (very pale warm)
  contentLightAlt: "#EDEBF1", // slight variant for texture

  // Accent
  orange: "#F5681E",          // brand accent
  orangeLight: "#FF8A3D",

  // Text
  textDark: "#1A1A1F",
  textMid: "#4A4452",
  textFaint: "rgba(26,26,31,0.55)",

  // Fonts
  display: "'Inter', -apple-system, sans-serif", // Argo usa Inter Bold para todo
  body: "'Inter', -apple-system, sans-serif",
};

let _cachedLogoDataUrl: string | null = null;
export function getArgoLogoDataUrl(): string {
  if (_cachedLogoDataUrl) return _cachedLogoDataUrl;
  // For now there's no argo logo svg in public/brand/argo — use a text fallback
  // via an empty string, templates will show "Argo Method" as text directly.
  try {
    const buf = readFileSync(join(process.cwd(), "public/brand/argo/logo.svg"));
    _cachedLogoDataUrl = `data:image/svg+xml;base64,${buf.toString("base64")}`;
  } catch {
    _cachedLogoDataUrl = "";
  }
  return _cachedLogoDataUrl;
}

export interface ArgoTemplateProps {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  body_text?: string;
  pillar?: string;
  pillar_display?: string; // Human-readable pillar name for the chip (e.g. "CIENCIA & MÉTODO")
  cta_url?: string;        // e.g. argomethod.com
  cta_text?: string;       // e.g. "Iniciar prueba gratuita"
  // Carousel context
  slide?: {
    index: number;
    kind: "cover" | "content" | "cta";
    title?: string;
    body?: string;
  };
  total_slides?: number;
  // Pre-rendered photo URL from gpt-image-1 (for IG feed / LI single / carousel cover)
  photo_url?: string;
}

export function htmlShell(opts: { title: string; styles: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${opts.title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
html, body { width: 100vw; height: 100vh; overflow: hidden; font-family: 'Inter', -apple-system, sans-serif; }
${opts.styles}
</style>
</head><body>${opts.body}</body></html>`;
}

/**
 * Map pillar slug from the content generator to a human-readable display
 * string used inside the orange chip.
 */
export function displayPillar(pillarSlug?: string): string {
  if (!pillarSlug) return "ARGO METHOD";
  const map: Record<string, string> = {
    ciencia_metodologia: "CIENCIA & MÉTODO",
    educacion_deportiva: "PARA ENTRENADORES",
    producto: "PRODUCTO",
  };
  return map[pillarSlug] ?? pillarSlug.toUpperCase().replace(/_/g, " ");
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
