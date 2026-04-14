import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

/**
 * Bold contrarian-take. Renders whatever Claude sends as the headline —
 * no more opinionated "Necesitás X" structure. Font size adapts to title
 * length so long titles don't overflow.
 */
export function ycContrarianTake(props: YacareTemplateProps): string {
  const title = (props.title ?? "Dejá de contratar fábricas de pantallas.").trim();
  const body = (props.body_text ?? props.subtitle ?? "").trim();

  // Adaptive font size based on title length
  const charCount = title.length;
  const fontSize = charCount > 80 ? 72 : charCount > 50 ? 92 : charCount > 30 ? 112 : 132;

  const styles = `
    .glow { position: absolute; left: -200px; top: 200px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .headline { font-family: var(--display); font-weight: 700; font-size: ${fontSize}px; line-height: 0.94; letter-spacing: -0.025em; max-width: 900px; color: var(--text); text-transform: uppercase; }
    .headline .accent { color: var(--accent); }
    .body { font-family: var(--body); font-weight: 400; font-size: 26px; line-height: 1.45; color: var(--text-dim); max-width: 780px; margin-top: 28px; }
    .divider { width: 64px; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent-light)); margin-top: 40px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="corner-shape"></div>
      <div class="corner-shape-inner"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Contrarian</div>
      </div>
      <div class="middle">
        <div class="headline">${escapeHtml(title)}</div>
        ${body ? `<div class="body">${escapeHtml(body)}</div>` : ""}
        <div class="divider"></div>
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>CONTRARIAN TAKE</div>
        <div class="slug">YC · 01</div>
      </div>
    </div>
  `;

  return htmlShell({ title: "yc-contrarian-take", styles, body: html });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
