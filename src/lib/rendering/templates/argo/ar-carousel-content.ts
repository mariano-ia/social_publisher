import { htmlShell, displayPillar, escapeHtml, type ArgoTemplateProps, AR_TOKENS } from "./_shared";

/**
 * Argo carousel CONTENT slide (slides 2, 3, 4).
 * - Background: pale/light cream
 * - Top bar: thin orange stripe
 * - Header: "Argo Method" purple + paginator right
 * - Giant decorative number on the left (slide index)
 * - Thin orange accent line
 * - Slide title in Inter Bold
 * - Body copy in Inter Regular
 * - Bottom bar: thin orange stripe
 *
 * Based on frames 4:52 / 4:61 / 4:70 from Figma auto_Contenido_SMO.
 */
export function arCarouselContent(props: ArgoTemplateProps): string {
  const title = props.slide?.title ?? props.title ?? "";
  const body = props.slide?.body ?? props.body_text ?? "";
  const slideIdx = props.slide?.index ?? 2;
  const total = props.total_slides ?? 5;

  const styles = `
    html, body { background: ${AR_TOKENS.contentLight}; color: ${AR_TOKENS.textDark}; }
    .frame { position: relative; height: 100%; display: grid; grid-template-rows: auto 1fr auto; padding: 72px 64px 56px; }
    .bar-top { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: ${AR_TOKENS.orange}; }
    .bar-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: ${AR_TOKENS.orange}; }
    .header { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; }
    .brand { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 24px; color: ${AR_TOKENS.violet}; letter-spacing: -0.01em; }
    .paginator { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 18px; color: ${AR_TOKENS.textFaint}; letter-spacing: 0.05em; }

    .num-deco { position: absolute; left: -60px; top: 50%; transform: translateY(-50%); font-family: ${AR_TOKENS.display}; font-weight: 900; font-size: 820px; line-height: 0.75; color: rgba(133,88,181,0.07); letter-spacing: -0.08em; pointer-events: none; user-select: none; }

    .middle { display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1; padding-left: 20px; }
    .accent-line { width: 80px; height: 5px; background: ${AR_TOKENS.orange}; margin-bottom: 28px; }
    .title { font-family: ${AR_TOKENS.display}; font-weight: 800; font-size: 72px; line-height: 1.05; letter-spacing: -0.025em; color: ${AR_TOKENS.textDark}; max-width: 900px; }
    .body { font-family: ${AR_TOKENS.body}; font-weight: 400; font-size: 28px; line-height: 1.45; color: ${AR_TOKENS.textMid}; margin-top: 32px; max-width: 880px; }

    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 40px; position: relative; z-index: 2; }
    .slot-id { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 13px; color: ${AR_TOKENS.textFaint}; letter-spacing: 0.18em; text-transform: uppercase; }
  `;

  const html = `
    <div class="frame">
      <div class="bar-top"></div>
      <div class="num-deco">${String(slideIdx).padStart(2, "0")}</div>
      <div class="header">
        <div class="brand">Argo Method</div>
        <div class="paginator">${String(slideIdx).padStart(2, "0")} / ${String(total).padStart(2, "0")}</div>
      </div>
      <div class="middle">
        <div class="accent-line"></div>
        <div class="title">${escapeHtml(title)}</div>
        <div class="body">${escapeHtml(body)}</div>
      </div>
      <div class="footer">
        <div class="slot-id">${displayPillar(props.pillar)}</div>
        <div class="slot-id">argomethod.com</div>
      </div>
      <div class="bar-bottom"></div>
    </div>
  `;
  return htmlShell({ title: "ar-carousel-content", styles, body: html });
}
