import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

export function ycReframe(props: YacareTemplateProps): string {
  const before = props.subtitle ?? "La interfaz no es el punto de partida.";
  const after = props.title ?? "Es el resultado.";

  const styles = `
    .glow { position: absolute; right: -150px; top: 200px; width: 800px; height: 800px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .before { font-family: var(--supporting); font-weight: 500; font-size: 48px; line-height: 1.18; letter-spacing: -0.018em; color: var(--text-strike); text-decoration: line-through; text-decoration-color: var(--accent); text-decoration-thickness: 4px; max-width: 920px; }
    .connector { display: flex; align-items: center; gap: 24px; margin: 40px 0 32px; }
    .connector .arrow { font-family: var(--supporting); font-size: 22px; color: var(--accent); font-weight: 600; }
    .connector .line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--accent), transparent); max-width: 420px; }
    .after { font-family: var(--display); font-weight: 700; font-size: 168px; line-height: 0.92; letter-spacing: -0.025em; text-transform: uppercase; color: var(--text); max-width: 920px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Reframe</div>
      </div>
      <div class="spacer"></div>
      <div class="before">${escapeHtml(before)}</div>
      <div class="connector"><span class="arrow">→</span><span class="line"></span></div>
      <div class="after">${escapeHtml(after)}</div>
      <div class="spacer"></div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>REFRAME</div>
        <div class="slug">YC · 04</div>
      </div>
    </div>
  `;
  return htmlShell({ title: "yc-reframe", styles, body: html });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
