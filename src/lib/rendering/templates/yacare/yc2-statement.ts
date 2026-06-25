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
 * yc2-statement — simple post (1:1), "loud" volume.
 *
 * A single strong product idea as a short hook. The last sentence of a
 * two-part contrast ("Menos features. Más señales.") is auto-limed. Font size
 * adapts to length so it never overflows.
 *
 * Props:
 * - title    → the hook (required)
 * - subtitle → optional mono kicker, e.g. "Cómo lo pensamos"
 * - pillar   → maps to the footer slug
 */
export function yc2Statement(props: YacareTemplateProps): string {
  const hook = (props.title ?? "").trim();
  const kicker = (props.subtitle ?? "").trim();
  const slug = pillarLabel(props.pillar);

  const size = adaptiveSize(hook, [
    [16, 150],
    [30, 120],
    [52, 96],
    [80, 72],
    [200, 56],
  ]);

  const styles = `
    .c-h { font-size: ${size}px; }
    .c-kicker { margin-bottom: 28px; }
  `;

  const body = `
    <div class="c-frame grain">
      <div class="c-mix"></div>
      <div class="c-top">${logoWordmark()}<span class="yc-meta">IG · LI</span></div>
      <div class="c-mid">
        ${kicker ? `<div class="c-kicker">${escapeHtml(kicker)}</div>` : ""}
        <div class="c-h">${emphasizeLastSentence(hook)}</div>
      </div>
      ${footer(slug)}
    </div>
  `;

  return htmlShell2({ title: "yc2-statement", styles, body });
}
