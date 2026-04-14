import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

/**
 * Manifesto block: long-form statement with mixed weights. The title becomes
 * the bold top block, the body becomes the regular-weight supporting block.
 * No hardcoded "B2B SaaS" accent — let the content be whatever it is.
 */
export function ycManifestoBlock(props: YacareTemplateProps): string {
  const headlineA = (props.title ?? "Diseñamos, construimos y escalamos productos B2B SaaS.").trim();
  const headlineB = (props.body_text ?? props.subtitle ?? "Sin equipos inflados. Sin proyectos eternos sin dirección.").trim();

  // Adaptive size for the hero block
  const aSize = headlineA.length > 100 ? 56 : headlineA.length > 70 ? 72 : headlineA.length > 40 ? 88 : 104;

  const styles = `
    .glow-a { position: absolute; left: -200px; top: -100px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .glow-b { position: absolute; right: -150px; bottom: -200px; width: 600px; height: 600px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .block-a { font-family: var(--display); font-weight: 700; font-size: ${aSize}px; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; max-width: 920px; color: var(--text); }
    .divider { width: 48px; height: 2px; background: var(--accent); margin: 36px 0 30px; }
    .block-b { font-family: var(--body); font-size: 28px; font-weight: 400; line-height: 1.45; color: var(--text-dim); max-width: 820px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow-a"></div>
      <div class="glow-b"></div>
      <div class="corner-shape"></div>
      <div class="corner-shape-inner"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Manifiesto</div>
      </div>
      <div class="middle">
        <div class="block-a">${escapeHtml(headlineA)}</div>
        <div class="divider"></div>
        <div class="block-b">${escapeHtml(headlineB)}</div>
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>MANIFESTO BLOCK</div>
        <div class="slug">YC · 05</div>
      </div>
    </div>
  `;
  return htmlShell({ title: "yc-manifesto-block", styles, body: html });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
