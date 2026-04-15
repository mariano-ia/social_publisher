import { htmlShell, displayPillar, escapeHtml, type ArgoTemplateProps, AR_TOKENS } from "./_shared";

/**
 * Argo IG feed WITH PHOTO.
 *
 * Layout:
 *  - Photo fills the whole frame in full color (no multiply, no tint).
 *  - A dark gradient fades in from the top edge — this is the ONLY dark
 *    area on the photo. Logo pill, pillar chip and headline all sit inside
 *    that top band, so the gradient is what makes the white text legible
 *    without touching the rest of the photo.
 *  - Orange bar at the very top (8px).
 *  - Violet footer bar at the very bottom (72px).
 */
export function arIgPhoto(props: ArgoTemplateProps): string {
  const title = props.title ?? "";
  const pillar = displayPillar(props.pillar);
  const photoUrl = props.photo_url;

  const photoBg = photoUrl
    ? `background-image: url('${photoUrl}'); background-size: cover; background-position: center center;`
    : `background: linear-gradient(180deg, #bcb0d8 0%, #8d7faa 50%, #4a4452 100%);`;

  const styles = `
    html, body { background: #000; color: ${AR_TOKENS.textDark}; }
    .frame { position: relative; height: 100%; ${photoBg} }

    /* Dark gradient at the BOTTOM of the photo — sits behind the headline
       so white text is legible, fading to fully transparent upward so the
       top and middle of the photo stay in full, untouched color. */
    .bottom-fade {
      position: absolute; bottom: 0; left: 0; right: 0; height: 62%;
      background: linear-gradient(
        180deg,
        rgba(12, 4, 28, 0) 0%,
        rgba(12, 4, 28, 0.18) 30%,
        rgba(12, 4, 28, 0.55) 58%,
        rgba(12, 4, 28, 0.85) 82%,
        rgba(12, 4, 28, 0.95) 100%
      );
      pointer-events: none;
    }

    /* Thin orange bar at the very top (brand) */
    .bar-top { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: ${AR_TOKENS.orange}; z-index: 20; }

    /* Logo pill top-left sits on the clean photo (no gradient up top). */
    .logo-pill {
      position: absolute; top: 52px; left: 56px;
      display: inline-flex; align-items: center;
      padding: 12px 26px;
      background: rgba(18, 10, 36, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.30);
      border-radius: 999px;
      backdrop-filter: blur(10px);
      z-index: 10;
    }
    .logo-pill .txt {
      font-family: ${AR_TOKENS.display};
      font-weight: 700; font-size: 22px;
      color: #ffffff;
      letter-spacing: -0.005em;
    }

    /* Content block: chip + headline pinned to bottom, sitting on the
       bottom-fade so white text reads cleanly. */
    .content {
      position: absolute;
      left: 56px;
      right: 56px;
      bottom: 116px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 24px;
      z-index: 10;
    }
    .pillar-chip {
      display: inline-flex; align-items: center;
      padding: 10px 22px;
      background: ${AR_TOKENS.orange};
      border-radius: 999px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    }
    .pillar-chip .txt {
      font-family: ${AR_TOKENS.display};
      font-weight: 700; font-size: 14px;
      color: #ffffff;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .headline {
      font-family: ${AR_TOKENS.display};
      font-weight: 800; font-size: 58px;
      line-height: 1.06;
      letter-spacing: -0.025em;
      color: #ffffff;
      max-width: 100%;
      text-shadow: 0 2px 24px rgba(0, 0, 0, 0.45);
    }

    /* Violet footer bar */
    .footer {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 72px;
      background: ${AR_TOKENS.violet};
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 56px;
      z-index: 10;
    }
    .footer-url { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 20px; color: rgba(255, 255, 255, 0.92); }
    .footer-dot { width: 16px; height: 16px; border-radius: 50%; background: ${AR_TOKENS.orange}; }
  `;

  const html = `
    <div class="frame">
      <div class="bottom-fade"></div>
      <div class="bar-top"></div>
      <div class="logo-pill"><span class="txt">Argo Method</span></div>
      <div class="content">
        <div class="pillar-chip"><span class="txt">${escapeHtml(pillar)}</span></div>
        <div class="headline">${escapeHtml(title)}</div>
      </div>
      <div class="footer">
        <div class="footer-url">argomethod.com</div>
        <div class="footer-dot"></div>
      </div>
    </div>
  `;
  return htmlShell({ title: "ar-ig-photo", styles, body: html });
}
