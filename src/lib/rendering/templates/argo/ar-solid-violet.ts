import { htmlShell, displayPillar, escapeHtml, type ArgoTemplateProps, AR_TOKENS } from "./_shared";

/**
 * Argo IG feed — Variante B (solid violet, no photo).
 * Used when the content doesn't need a photo and we can rely on typography + decorative shapes.
 * Based on frame 4:2 from Figma auto_Contenido_SMO.
 */
export function arSolidViolet(props: ArgoTemplateProps): string {
  const title = props.title ?? "";
  const pillar = displayPillar(props.pillar);
  const decoNum = props.subtitle ?? "12";

  const styles = `
    html, body { background: ${AR_TOKENS.violet}; color: #ffffff; }
    .frame { position: relative; height: 100%; display: grid; grid-template-rows: auto 1fr auto; padding: 72px 64px 56px; }
    .bar-top { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: ${AR_TOKENS.orange}; }

    .deco-circle-1 { position: absolute; right: -160px; top: -160px; width: 620px; height: 620px; border-radius: 50%; background: ${AR_TOKENS.violetLight}; opacity: 0.5; pointer-events: none; }
    .deco-circle-2 { position: absolute; left: -120px; bottom: 140px; width: 360px; height: 360px; border-radius: 50%; background: ${AR_TOKENS.violetDark}; opacity: 0.55; pointer-events: none; }

    .num-deco { position: absolute; left: -30px; top: 260px; font-family: ${AR_TOKENS.display}; font-weight: 900; font-size: 580px; line-height: 0.75; color: rgba(255,255,255,0.12); letter-spacing: -0.05em; pointer-events: none; user-select: none; }

    .header { display: flex; justify-content: flex-start; align-items: center; position: relative; z-index: 2; }
    .logo-pill { display: inline-flex; align-items: center; padding: 12px 22px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); border-radius: 999px; backdrop-filter: blur(6px); }
    .logo-pill .txt { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 18px; color: #ffffff; letter-spacing: -0.005em; }

    .middle { display: flex; flex-direction: column; justify-content: flex-end; position: relative; z-index: 2; padding-bottom: 40px; }
    .pillar-chip { display: inline-flex; align-items: center; padding: 10px 22px; background: ${AR_TOKENS.orange}; border-radius: 999px; align-self: flex-start; margin-bottom: 24px; }
    .pillar-chip .txt { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 14px; color: #ffffff; letter-spacing: 0.22em; text-transform: uppercase; }
    .title { font-family: ${AR_TOKENS.display}; font-weight: 800; font-size: 76px; line-height: 1.05; letter-spacing: -0.03em; color: #ffffff; max-width: 920px; }

    .footer { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.15); }
    .footer-url { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 18px; color: rgba(255,255,255,0.85); }
    .footer-dot { width: 14px; height: 14px; border-radius: 50%; background: ${AR_TOKENS.orange}; }
  `;

  const html = `
    <div class="frame">
      <div class="bar-top"></div>
      <div class="deco-circle-1"></div>
      <div class="deco-circle-2"></div>
      <div class="num-deco">${escapeHtml(decoNum)}</div>
      <div class="header">
        <div class="logo-pill"><span class="txt">Argo Method</span></div>
      </div>
      <div class="middle">
        <div class="pillar-chip"><span class="txt">${escapeHtml(pillar)}</span></div>
        <div class="title">${escapeHtml(title)}</div>
      </div>
      <div class="footer">
        <div class="footer-url">argomethod.com</div>
        <div class="footer-dot"></div>
      </div>
    </div>
  `;
  return htmlShell({ title: "ar-solid-violet", styles, body: html });
}
