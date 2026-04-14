import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

/**
 * Reframe: "X isn't really Y, it's actually Z" insight flip.
 * - title: the "new truth" (big, bold, white)
 * - subtitle: optional "old belief" (smaller, strikethrough)
 * - body_text: optional supporting sentence
 *
 * If only title is provided, render it standalone as a big statement.
 */
export function ycReframe(props: YacareTemplateProps): string {
  const after = (props.title ?? "Es el resultado.").trim();
  const before = (props.subtitle ?? "").trim();
  const body = (props.body_text ?? "").trim();

  const afterSize = after.length > 60 ? 84 : after.length > 35 ? 112 : 148;

  const styles = `
    .glow { position: absolute; right: -150px; top: 200px; width: 800px; height: 800px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .reframe-group { display: flex; flex-direction: column; gap: 18px; max-width: 920px; }
    .before { font-family: var(--supporting); font-weight: 500; font-size: 40px; line-height: 1.2; letter-spacing: -0.018em; color: var(--text-strike); text-decoration: line-through; text-decoration-color: var(--accent); text-decoration-thickness: 4px; }
    .connector { display: flex; align-items: center; gap: 20px; margin: 4px 0; }
    .connector .arrow { font-family: var(--supporting); font-size: 22px; color: var(--accent); font-weight: 600; }
    .connector .line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--accent), transparent); max-width: 320px; }
    .after { font-family: var(--display); font-weight: 700; font-size: ${afterSize}px; line-height: 0.92; letter-spacing: -0.025em; text-transform: uppercase; color: var(--text); }
    .body { font-family: var(--body); font-size: 26px; font-weight: 400; line-height: 1.45; color: var(--text-dim); margin-top: 32px; max-width: 780px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="corner-shape"></div>
      <div class="corner-shape-inner"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Reframe</div>
      </div>
      <div class="middle">
        <div class="reframe-group">
          ${
            before
              ? `<div class="before">${escapeHtml(before)}</div>
                 <div class="connector"><span class="arrow">→</span><span class="line"></span></div>`
              : ""
          }
          <div class="after">${escapeHtml(after)}</div>
          ${body ? `<div class="body">${escapeHtml(body)}</div>` : ""}
        </div>
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>REFRAME</div>
        <div class="slug">YC · 04</div>
      </div>
    </div>
  `;

  return htmlShell({ title: "yc-reframe", styles, body: html });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
