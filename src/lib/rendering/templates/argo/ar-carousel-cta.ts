import { htmlShell, escapeHtml, type ArgoTemplateProps, AR_TOKENS } from "./_shared";

/**
 * Argo carousel CTA slide (slide 5, closing).
 * - Background: solid violet
 * - Decorative circles (top-right large, bottom-left medium)
 * - Top bar: thin orange stripe
 * - Header: "Argo Method" white + "05 / 05" right
 * - Big headline (white)
 * - Subtitle (white 75%)
 * - CTA pill button: white bg + violet text
 * - Bottom bar: thin orange stripe
 *
 * Based on frame 4:79 from Figma auto_Contenido_SMO.
 */
export function arCarouselCta(props: ArgoTemplateProps): string {
  const title = props.slide?.title ?? props.title ?? "Conoce el perfil conductual de tus deportistas.";
  const subtitle = props.slide?.body ?? props.subtitle ?? "14 días gratis. Sin tarjeta de crédito.";
  const ctaText = props.cta_text ?? "Iniciar prueba gratuita";
  const total = props.total_slides ?? 5;

  const styles = `
    html, body { background: ${AR_TOKENS.violet}; color: #ffffff; }
    .frame { position: relative; height: 100%; display: grid; grid-template-rows: auto 1fr auto; padding: 72px 64px 56px; }
    .bar-top { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: ${AR_TOKENS.orange}; }
    .bar-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: ${AR_TOKENS.orange}; }

    /* Decorative shapes */
    .deco-big { position: absolute; right: -180px; top: -180px; width: 680px; height: 680px; border-radius: 50%; background: ${AR_TOKENS.violetLight}; opacity: 0.55; pointer-events: none; }
    .deco-small { position: absolute; left: -100px; bottom: -80px; width: 380px; height: 380px; border-radius: 50%; background: ${AR_TOKENS.violetDark}; opacity: 0.55; pointer-events: none; }

    .header { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; }
    .brand { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 24px; color: #ffffff; letter-spacing: -0.01em; }
    .paginator { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 18px; color: rgba(255,255,255,0.6); letter-spacing: 0.05em; }

    .middle { display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 2; }
    .title { font-family: ${AR_TOKENS.display}; font-weight: 800; font-size: 96px; line-height: 1.02; letter-spacing: -0.03em; color: #ffffff; max-width: 900px; }
    .subtitle { font-family: ${AR_TOKENS.body}; font-weight: 400; font-size: 30px; line-height: 1.4; color: rgba(255,255,255,0.85); margin-top: 32px; max-width: 780px; }

    .cta-pill { display: inline-flex; align-items: center; gap: 14px; padding: 28px 56px; background: #ffffff; border-radius: 999px; align-self: flex-start; margin-top: 56px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); }
    .cta-pill .txt { font-family: ${AR_TOKENS.display}; font-weight: 600; font-size: 30px; color: ${AR_TOKENS.violet}; letter-spacing: -0.01em; }
    .cta-pill .arrow { font-size: 28px; color: ${AR_TOKENS.violet}; }

    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 48px; position: relative; z-index: 2; }
    .slot-id { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 14px; color: rgba(255,255,255,0.72); letter-spacing: 0.18em; text-transform: uppercase; }
  `;

  const html = `
    <div class="frame">
      <div class="bar-top"></div>
      <div class="deco-big"></div>
      <div class="deco-small"></div>
      <div class="header">
        <div class="brand">Argo Method</div>
        <div class="paginator">${String(total).padStart(2, "0")} / ${String(total).padStart(2, "0")}</div>
      </div>
      <div class="middle">
        <div class="title">${escapeHtml(title)}</div>
        <div class="subtitle">${escapeHtml(subtitle)}</div>
        <div class="cta-pill">
          <span class="txt">${escapeHtml(ctaText)}</span>
          <span class="arrow">→</span>
        </div>
      </div>
      <div class="footer">
        <div class="slot-id">argomethod.com</div>
        <div class="slot-id">AR · CTA</div>
      </div>
      <div class="bar-bottom"></div>
    </div>
  `;
  return htmlShell({ title: "ar-carousel-cta", styles, body: html });
}
