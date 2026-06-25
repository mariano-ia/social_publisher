import {
  htmlShell2,
  logoWordmark,
  footer,
  adaptiveSize,
  pillarLabel,
  escapeHtml,
  type YacareTemplateProps,
} from "./_v2-shared";

/**
 * yc2-stat — simple post (1:1), "loud" volume.
 *
 * One big number with a single short mono label. Secondary template — used
 * when the idea is genuinely numeric (most Yacaré copy is conceptual, so this
 * rotates in less often than yc2-statement / yc2-reframe).
 *
 * Props:
 * - title     → the number/stat (e.g. "6 hs", "3 preguntas")
 * - subtitle  → the small label above (e.g. "Por semana")
 * - body_text → optional one-line descriptor under the number
 * - pillar    → footer slug
 */
export function yc2Stat(props: YacareTemplateProps): string {
  const stat = (props.title ?? "—").trim();
  const label = (props.subtitle ?? "").trim();
  const descriptor = (props.body_text ?? "").trim();
  const slug = pillarLabel(props.pillar);

  const size = adaptiveSize(stat, [
    [3, 300],
    [5, 260],
    [8, 210],
    [14, 150],
    [40, 110],
  ]);

  const styles = `
    .stat-label { font-family: var(--mono); font-size: 34px; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--lime); margin-bottom: 36px; }
    .stat-value { font-family: var(--display); font-size: ${size}px; line-height: 0.82; letter-spacing: -0.04em; color: #fff; }
    .stat-desc { font-family: 'Archivo', sans-serif; font-weight: 600; font-size: 34px; line-height: 1.3;
      color: rgba(255,255,255,0.85); margin-top: 36px; max-width: 90%; }
  `;

  const body = `
    <div class="c-frame grain">
      <div class="c-mix"></div>
      <div class="c-top">${logoWordmark()}<span class="yc-meta">IG · LI</span></div>
      <div class="c-mid">
        ${label ? `<div class="stat-label">${escapeHtml(label)}</div>` : ""}
        <div class="stat-value">${escapeHtml(stat)}</div>
        ${descriptor ? `<div class="stat-desc">${escapeHtml(descriptor)}</div>` : ""}
      </div>
      ${footer(slug)}
    </div>
  `;

  return htmlShell2({ title: "yc2-stat", styles, body });
}
