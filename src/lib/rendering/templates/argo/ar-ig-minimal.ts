import { htmlShell, displayPillar, escapeHtml, type ArgoTemplateProps, AR_TOKENS } from "./_shared";

/**
 * Argo IG feed — Variante C "Minimalista claro" (frame 4:14 del Figma
 * auto_Contenido_SMO).
 *
 * Layout vertical limpio:
 * - Fondo blanco/casi-blanco
 * - Thin orange bar top
 * - Logo violeta top-left
 * - Foto editorial en un CONTENEDOR ROUNDED (no full-bleed), con círculos
 *   decorativos detrás
 * - Pillar chip naranja BAJO la foto
 * - Headline Inter Bold NEGRO grande, 3 líneas
 * - Footer minimal: línea naranja acento + "argomethod.com" gris
 *
 * Cuándo usarla: contenido más reflexivo/conceptual, o cuando la foto es un
 * producto/objeto en lugar de escena deportiva emocional. Mejor lecturabilidad
 * que la variante A porque el texto está en negro sobre blanco.
 */
export function arIgMinimal(props: ArgoTemplateProps): string {
  const title = props.title ?? "";
  const pillar = displayPillar(props.pillar);
  const photoUrl = props.photo_url;

  const photoBg = photoUrl
    ? `background-image: url('${photoUrl}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, rgba(133,88,181,0.12) 0%, rgba(133,88,181,0.06) 100%);`;

  const styles = `
    html, body { background: #FAFAFC; color: ${AR_TOKENS.textDark}; }
    .frame { position: relative; height: 100%; padding: 52px 56px 52px; display: flex; flex-direction: column; }

    .bar-top { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: ${AR_TOKENS.orange}; z-index: 20; }

    /* Header: logo in violet small text */
    .header { display: flex; align-items: center; margin-bottom: 28px; }
    .logo-text { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 22px; color: ${AR_TOKENS.violet}; letter-spacing: -0.005em; }

    /* Photo container with decorative circles behind */
    .photo-wrap { position: relative; width: 100%; aspect-ratio: 16 / 9; margin-bottom: 44px; }
    .deco-big { position: absolute; right: -40px; top: -30px; width: 460px; height: 460px; border-radius: 50%; background: rgba(133,88,181,0.10); pointer-events: none; }
    .deco-small { position: absolute; right: 60px; top: 30px; width: 280px; height: 280px; border-radius: 50%; background: rgba(245,104,30,0.08); pointer-events: none; }
    .photo { position: relative; width: 100%; height: 100%; border-radius: 24px; overflow: hidden; ${photoBg} box-shadow: 0 20px 60px rgba(26,26,31,0.08); }
    .photo-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 18px; color: rgba(133,88,181,0.4); letter-spacing: 0.12em; text-transform: uppercase; }

    /* Content block below the photo */
    .content { display: flex; flex-direction: column; align-items: flex-start; gap: 22px; flex: 1; }
    .pillar-chip { display: inline-flex; align-items: center; padding: 10px 22px; background: ${AR_TOKENS.orange}; border-radius: 999px; }
    .pillar-chip .txt { font-family: ${AR_TOKENS.display}; font-weight: 700; font-size: 14px; color: #ffffff; letter-spacing: 0.22em; text-transform: uppercase; }
    .headline { font-family: ${AR_TOKENS.display}; font-weight: 800; font-size: 74px; line-height: 1.05; letter-spacing: -0.028em; color: ${AR_TOKENS.textDark}; max-width: 100%; }

    /* Minimal footer with accent line */
    .footer { display: flex; align-items: center; gap: 24px; margin-top: auto; padding-top: 32px; }
    .accent-line { width: 80px; height: 4px; background: ${AR_TOKENS.orange}; border-radius: 2px; }
    .footer-url { font-family: ${AR_TOKENS.display}; font-weight: 500; font-size: 18px; color: ${AR_TOKENS.textFaint}; letter-spacing: 0.02em; }
  `;

  const html = `
    <div class="frame">
      <div class="bar-top"></div>
      <div class="header">
        <div class="logo-text">Argo Method</div>
      </div>
      <div class="photo-wrap">
        <div class="deco-big"></div>
        <div class="deco-small"></div>
        <div class="photo">
          ${photoUrl ? "" : '<div class="photo-placeholder">Foto / Ilustración</div>'}
        </div>
      </div>
      <div class="content">
        <div class="pillar-chip"><span class="txt">${escapeHtml(pillar)}</span></div>
        <div class="headline">${escapeHtml(title)}</div>
      </div>
      <div class="footer">
        <div class="accent-line"></div>
        <div class="footer-url">argomethod.com</div>
      </div>
    </div>
  `;
  return htmlShell({ title: "ar-ig-minimal", styles, body: html });
}
