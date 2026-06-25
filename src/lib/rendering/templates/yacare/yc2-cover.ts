import {
  htmlShell2,
  logoWordmark,
  footer,
  gradLastWord,
  adaptiveSize,
  pillarLabel,
  escapeHtml,
  type YacareTemplateProps,
} from "./_v2-shared";

/**
 * yc2-cover — carousel cover (4:5), "quiet" volume.
 *
 * Dark bordered panel. Mono eyebrow (just the pillar word, e.g. "Producto" —
 * the literal word "Carrusel" was dropped per client). Headline with the last
 * word in a lavender→purple gradient, plus a teaser list of the slides that
 * follow.
 *
 * Props:
 * - title        → cover headline (required)
 * - pillar       → eyebrow word
 * - slide_titles → titles of the content slides (rendered as a teaser, max 3)
 * - total_slides → used for the "01 / NN" index
 */
export function yc2Cover(props: YacareTemplateProps): string {
  const headline = (props.title ?? "").trim();
  const eyebrow = pillarLabel(props.pillar);
  const total = props.total_slides ?? 5;
  const teasers = (props.slide_titles ?? []).filter((t) => t && t.trim().length > 0).slice(0, 3);

  const size = adaptiveSize(headline, [
    [30, 108],
    [55, 90],
    [90, 72],
    [200, 58],
  ]);

  const styles = `
    .d-h { font-size: ${size}px; }
    .teaser { margin-top: 40px; display: flex; flex-direction: column; gap: 16px; }
    .teaser .it { display: flex; gap: 18px; font-family: var(--display-quiet); font-size: 30px;
      font-weight: 500; color: rgba(255,255,255,0.82); line-height: 1.25; }
    .teaser .it .n { font-family: var(--mono); font-size: 24px; color: var(--accent); min-width: 40px; }
  `;

  const teaserHtml = teasers.length
    ? `<div class="teaser">${teasers
        .map(
          (t, i) =>
            `<div class="it"><span class="n">${String(i + 1).padStart(2, "0")}</span><span>${escapeHtml(t)}</span></div>`,
        )
        .join("")}</div>`
    : "";

  const body = `
    <div class="d-frame grain">
      <div class="d-top">${logoWordmark()}<span class="yc-meta">01 / ${String(total).padStart(2, "0")}</span></div>
      <div class="d-panel">
        <div class="d-eyebrow">${escapeHtml(eyebrow)}</div>
        <div class="d-h">${gradLastWord(headline)}</div>
        ${teaserHtml}
      </div>
      <div class="d-foot-pad">${footer("Deslizá →")}</div>
    </div>
  `;

  return htmlShell2({ title: "yc2-cover", styles, body });
}
