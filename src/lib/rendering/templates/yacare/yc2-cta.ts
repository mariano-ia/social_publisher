import {
  htmlShell2,
  logoWordmark,
  footer,
  adaptiveSize,
  escapeHtml,
  type YacareTemplateProps,
} from "./_v2-shared";

/**
 * yc2-cta — carousel closing slide (4:5), "quiet" volume. The takeaway, framed
 * as an invitation (advisor tone), with a lime handle button. Never finger-
 * pointing — closes on our criterion and an open door.
 *
 * Props (read from props.slide first):
 * - slide.title / title → the closing line / takeaway (required)
 * - cta                 → optional button label (defaults to "yacaré.io →")
 * - total_slides        → footer index
 */
export function yc2Cta(props: YacareTemplateProps): string {
  const line = (props.slide?.title ?? props.title ?? "").trim();
  const ctaLabel = (props.cta ?? "yacaré.io →").trim();
  const total = props.total_slides ?? 5;

  const size = adaptiveSize(line, [
    [40, 76],
    [80, 60],
    [200, 50],
  ]);

  const styles = `
    .cta-h { font-family: var(--display-quiet); font-weight: 600; font-size: ${size}px; line-height: 1.08;
      letter-spacing: -0.02em; }
    .cta-btn { align-self: flex-start; margin-top: 44px; background: var(--lime); color: ${"#11071f"};
      font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 28px; padding: 18px 30px; border-radius: 14px; }
    .d-panel { justify-content: center; }
  `;

  const body = `
    <div class="d-frame grain">
      <div class="d-top">${logoWordmark()}<span class="yc-meta">${String(total).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></div>
      <div class="d-panel">
        <div class="d-eyebrow">El punto</div>
        <div class="cta-h">${escapeHtml(line)}</div>
        <div class="cta-btn">${escapeHtml(ctaLabel)}</div>
      </div>
      <div class="d-foot-pad">${footer("FIN")}</div>
    </div>
  `;

  return htmlShell2({ title: "yc2-cta", styles, body });
}
