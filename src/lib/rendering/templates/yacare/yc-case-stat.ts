import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

/**
 * Case stat slide — used inside PYME case-study carousels to show a single
 * meaningful number on its own (the "before" and the "after").
 *
 * Props usage:
 * - title       → the big number/stat ("6 hs/sem", "36 min/sem", "$2.4M anual")
 * - subtitle    → the small label above ("ANTES", "DESPUÉS", "AHORRO ANUAL")
 * - body_text   → one-line descriptor ("clasificando facturas manualmente")
 * - pillar      → small tag top-right
 *
 * Two natural uses in a 5-slide carousel:
 *   slide 2 (problem)  → ANTES + big number of pain
 *   slide 4 (result)   → DESPUÉS + big number of gain
 */
export function ycCaseStat(props: YacareTemplateProps): string {
  const stat = (props.title ?? props.slide?.title ?? "—").trim();
  const label = (props.subtitle ?? "ANTES").trim();
  const descriptor = (props.body_text ?? props.slide?.body ?? "").trim();
  const tag = (props.pillar ?? "case").toString().replace(/_/g, " ");

  // Adaptive sizing — short stats ("6 hs") render bigger than long ones ("$2.4M anual").
  const len = stat.length;
  const statSize = len <= 6 ? 280 : len <= 10 ? 220 : len <= 16 ? 168 : 128;

  // "ANTES" vs "DESPUÉS" — use a subtle accent shift so they read differently when
  // they live next to each other in the carousel without changing the brand palette.
  const isAfter = /despu|after|result|ahorro|gana/i.test(label);
  const labelColor = isAfter ? "var(--accent-light)" : "var(--text-dim)";
  const statGradient = isAfter
    ? "linear-gradient(180deg, #ffffff 0%, var(--accent-light) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.72) 100%)";

  const styles = `
    .glow { position: absolute; right: -250px; bottom: -100px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%); pointer-events: none; }
    .ring { position: absolute; left: -180px; top: 50%; transform: translateY(-50%); width: 520px; height: 520px; border-radius: 50%; border: 1px solid rgba(138,94,255,0.18); pointer-events: none; }
    .ring-inner { position: absolute; left: -80px; top: 50%; transform: translateY(-50%); width: 320px; height: 320px; border-radius: 50%; border: 1px solid rgba(138,94,255,0.12); pointer-events: none; }

    .stat-label { font-family: var(--supporting); font-weight: 600; font-size: 16px; color: ${labelColor}; letter-spacing: 0.32em; text-transform: uppercase; margin-bottom: 28px; display: flex; align-items: center; gap: 14px; }
    .stat-label::before { content: ""; width: 28px; height: 1px; background: currentColor; opacity: 0.6; }

    .stat-value { font-family: var(--display); font-weight: 700; font-size: ${statSize}px; line-height: 0.88; letter-spacing: -0.035em; background: ${statGradient}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; max-width: 100%; }

    .descriptor { font-family: var(--body); font-size: 26px; font-weight: 400; line-height: 1.4; color: var(--text-dim); margin-top: 40px; max-width: 820px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="ring"></div>
      <div class="ring-inner"></div>
      <div class="corner-shape"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">${escapeHtml(tag)}</div>
      </div>
      <div class="middle">
        <div class="stat-label">${escapeHtml(label)}</div>
        <div class="stat-value">${escapeHtml(stat)}</div>
        ${descriptor ? `<div class="descriptor">${escapeHtml(descriptor)}</div>` : ""}
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>CASE STAT</div>
        <div class="slug">YC · STAT</div>
      </div>
    </div>
  `;

  return htmlShell({ title: "yc-case-stat", styles, body: html });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
