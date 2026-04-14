import { htmlShell, displayPillar, escapeHtml, type ArgoTemplateProps, AR_TOKENS } from "./_shared";

/**
 * Argo IG feed WITH PHOTO (variant A from Figma frame 3:2).
 *
 * Layout:
 * - Full-frame photo as background (or placeholder gradient if no photo_url)
 * - Single multi-stop overlay gradient on top of the photo that fades from
 *   lavender (top, hides photo) → transparent (middle, photo visible) →
 *   dark (bottom, for text contrast). No hard edges.
 * - Logo pill absolute top-left
 * - Content block (chip + headline) absolute bottom, flex column with gap
 *   so chip and headline never collide regardless of headline line count.
 * - Violet footer bar absolute bottom
 * - Thin orange bar at the very top
 *
 * This template expects `photo_url` as a prop. No photo → gradient-only placeholder.
 */
export function arIgPhoto(props: ArgoTemplateProps): string {
  const title = props.title ?? "";
  const pillar = displayPillar(props.pillar);
  const photoUrl = props.photo_url;

  // Full-frame photo or a subtle placeholder gradient (so previews without
  // a real photo still look like the final output's layout).
  const frameBg = photoUrl
    ? `background-image: url('${photoUrl}'); background-size: cover; background-position: center center;`
    : `background: linear-gradient(180deg, #bcb0d8 0%, #8d7faa 50%, #4a4452 100%);`;

  const styles = `
    html, body { background: ${AR_TOKENS.lavenderLight}; color: ${AR_TOKENS.textDark}; }
    .frame { position: relative; height: 100%; ${frameBg} }

    /* Smooth overlay: thin lavender strip on top (just for the logo),
       photo fully visible in the middle (no overlay at all), gradient to
       dark only in the bottom third where the headline sits. The photo
       is the hero of the image — overlay only where strictly needed for
       contrast. */
    .overlay {
      position: absolute; inset: 0;
      background: linear-gradient(
        180deg,
        ${AR_TOKENS.lavenderLight} 0%,
        ${AR_TOKENS.lavenderLight} 10%,
        rgba(233, 229, 245, 0.75) 14%,
        rgba(233, 229, 245, 0) 22%,
        rgba(0, 0, 0, 0) 55%,
        rgba(0, 0, 0, 0.15) 65%,
        rgba(0, 0, 0, 0.55) 78%,
        rgba(0, 0, 0, 0.85) 92%,
        rgba(0, 0, 0, 0.92) 100%
      );
      pointer-events: none;
    }

    /* Thin orange bar top */
    .bar-top { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: ${AR_TOKENS.orange}; z-index: 20; }

    /* Logo pill top-left on the lavender area */
    .logo-pill { position: absolute; top: 52px; left: 56px; display: inline-flex; align-items: center; padding: 12px 26px; background: rgba(133, 88, 181, 0.18); border: 1px solid rgba(133, 88, 181, 0.38); border-radius: 999px; backdrop-filter: blur(4px); z-index: 10; }
    .logo-pill .txt { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 22px; color: ${AR_TOKENS.violet}; letter-spacing: -0.005em; }

    /* Content block pinned to bottom above the violet footer.
       Flex column + gap = chip and headline NEVER collide regardless of
       headline line count. */
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
    .pillar-chip { display: inline-flex; align-items: center; padding: 10px 22px; background: ${AR_TOKENS.orange}; border-radius: 999px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
    .pillar-chip .txt { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 14px; color: #ffffff; letter-spacing: 0.22em; text-transform: uppercase; }
    .headline { font-family: ${AR_TOKENS.display}; font-weight: 800; font-size: 66px; line-height: 1.1; letter-spacing: -0.025em; color: #ffffff; max-width: 100%; text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5); }

    /* Violet footer bar */
    .footer { position: absolute; bottom: 0; left: 0; right: 0; height: 72px; background: ${AR_TOKENS.violet}; display: flex; align-items: center; justify-content: space-between; padding: 0 56px; z-index: 10; }
    .footer-url { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 20px; color: rgba(255, 255, 255, 0.9); }
    .footer-dot { width: 16px; height: 16px; border-radius: 50%; background: ${AR_TOKENS.orange}; }
  `;

  const html = `
    <div class="frame">
      <div class="overlay"></div>
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
