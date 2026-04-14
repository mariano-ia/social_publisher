import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

export function ycContrarianTake(props: YacareTemplateProps): string {
  const title = props.title ?? "Dejá de contratar fábricas que diseñan pantallas.";
  const accent = props.subtitle ?? "product judgment";
  const intro = title.replace(new RegExp(`\\s*${escapeRegex(accent)}.*$`, "i"), "");

  const styles = `
    .glow { position: absolute; left: -200px; top: 200px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .headline { font-family: var(--display); font-weight: 700; font-size: 124px; line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; max-width: 920px; }
    .headline .small { font-size: 0.58em; font-weight: 500; color: rgba(255,255,255,0.78); display: block; margin-bottom: 12px; }
    .headline .accent { color: var(--accent); }
    .divider { width: 64px; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent-light)); margin-top: 48px; }
  `;

  const body = `
    <div class="frame">
      <div class="glow"></div>
      <div class="corner-shape"></div>
      <div class="corner-shape-inner"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Manifiesto</div>
      </div>
      <div class="middle">
        <div class="headline">
          ${intro ? `<span class="small">${escapeHtml(intro.trim())}</span>` : ""}
          Necesitás <span class="accent">${escapeHtml(accent)}</span>.
        </div>
        <div class="divider"></div>
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>CONTRARIAN TAKE</div>
        <div class="slug">YC · 01</div>
      </div>
    </div>
  `;

  return htmlShell({ title: "yc-contrarian-take", styles, body });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
