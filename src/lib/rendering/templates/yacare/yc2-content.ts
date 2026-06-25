import {
  htmlShell2,
  logoWordmark,
  footer,
  adaptiveSize,
  escapeHtml,
  type YacareTemplateProps,
} from "./_v2-shared";

/**
 * yc2-content — carousel content slide (4:5), "quiet" volume. Used for the
 * middle slides (2…N-1). An oversized ghost index number behind a short title
 * and a supporting body line.
 *
 * Props (read from props.slide first, then top-level fallbacks):
 * - slide.index → ghost number + "NN / total"
 * - slide.title / title     → slide heading
 * - slide.body  / body_text → supporting line
 * - total_slides            → footer index denominator
 */
export function yc2Content(props: YacareTemplateProps): string {
  const index = props.slide?.index ?? 1;
  const title = (props.slide?.title ?? props.title ?? "").trim();
  const bodyText = (props.slide?.body ?? props.body_text ?? "").trim();
  const total = props.total_slides ?? 5;

  const titleSize = adaptiveSize(title, [
    [24, 72],
    [44, 60],
    [80, 48],
  ]);

  const styles = `
    .ghost-num { font-family: var(--display); font-size: 150px; line-height: 1; color: rgba(255,255,255,0.14); }
    .ct-title { font-family: var(--display-quiet); font-weight: 600; font-size: ${titleSize}px; line-height: 1.05;
      letter-spacing: -0.02em; margin-top: 8px; }
    .ct-body { font-family: var(--display-quiet); font-size: 32px; line-height: 1.4; color: rgba(255,255,255,0.6);
      margin-top: 28px; max-width: 94%; }
  `;

  const body = `
    <div class="d-frame grain">
      <div class="d-top">${logoWordmark()}<span class="yc-meta">${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></div>
      <div class="d-panel">
        <div class="ghost-num">${String(index - 1).padStart(2, "0")}</div>
        <div class="ct-title">${escapeHtml(title)}</div>
        ${bodyText ? `<div class="ct-body">${escapeHtml(bodyText)}</div>` : ""}
      </div>
      <div class="d-foot-pad">${footer("Deslizá →")}</div>
    </div>
  `;

  return htmlShell2({ title: "yc2-content", styles, body });
}
