import {
  htmlShell2,
  logoWordmark,
  footer,
  emphasizeLastSentence,
  adaptiveSize,
  pillarLabel,
  escapeHtml,
  type YacareTemplateProps,
} from "./_v2-shared";

/**
 * yc2-reframe — simple post (1:1), "loud" volume.
 *
 * SOFTENED reframe (advisor tone): we no longer strike through the reader's
 * belief. Instead a dim context line is followed by our take in bold — the
 * contrast points at *our* criterion, not at the reader's mistake. First
 * person preferred ("Cuando diseñamos…", "Para nosotros…").
 *
 * Props:
 * - subtitle → optional dim context line (the "before"), NOT struck
 * - title    → our take (required, bold, last sentence auto-limed)
 * - pillar   → footer slug
 */
export function yc2Reframe(props: YacareTemplateProps): string {
  const take = (props.title ?? "").trim();
  const context = (props.subtitle ?? "").trim();
  const slug = pillarLabel(props.pillar);

  const size = adaptiveSize(take, [
    [20, 120],
    [40, 96],
    [70, 72],
    [200, 56],
  ]);

  const styles = `
    .rf-context { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 40px; line-height: 1.15;
      text-transform: uppercase; color: rgba(255,255,255,0.5); max-width: 92%; }
    .rf-arrow { font-family: var(--mono); font-size: 44px; color: var(--lime); margin: 28px 0; }
    .c-h { font-size: ${size}px; }
  `;

  const body = `
    <div class="c-frame grain">
      <div class="c-mix"></div>
      <div class="c-top">${logoWordmark()}<span class="yc-meta">IG · LI</span></div>
      <div class="c-mid">
        ${context ? `<div class="rf-context">${escapeHtml(context)}</div><div class="rf-arrow">↓</div>` : ""}
        <div class="c-h">${emphasizeLastSentence(take)}</div>
      </div>
      ${footer(slug)}
    </div>
  `;

  return htmlShell2({ title: "yc2-reframe", styles, body });
}
