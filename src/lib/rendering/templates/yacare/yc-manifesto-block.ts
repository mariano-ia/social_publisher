import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

export function ycManifestoBlock(props: YacareTemplateProps): string {
  const headlineA = props.title ?? "Diseñamos, construimos y escalamos productos B2B SaaS.";
  const headlineB = props.body_text ?? props.subtitle ?? "Sin equipos inflados. Sin proyectos eternos sin dirección. Just sharp execution de gente que se obsesiona por outcomes.";

  // Naively highlight "B2B SaaS" or whatever's in subtitle as accent
  const accentTerm = "B2B SaaS";
  const headlineAHtml = escapeHtml(headlineA).replace(
    accentTerm,
    `<span class="em">${accentTerm}</span>`,
  );

  const styles = `
    .glow-a { position: absolute; left: -200px; top: -100px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .glow-b { position: absolute; right: -150px; bottom: -200px; width: 600px; height: 600px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .block-a { font-family: var(--display); font-weight: 700; font-size: 96px; line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; max-width: 900px; }
    .block-a .em { color: var(--accent); }
    .divider { width: 48px; height: 2px; background: var(--accent); margin: 44px 0 36px; }
    .block-b { font-family: var(--body); font-size: 30px; font-weight: 400; line-height: 1.45; color: var(--text-dim); max-width: 820px; }
    .block-b strong { color: var(--text); font-weight: 600; }
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
        <div class="block-a">${headlineAHtml}</div>
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
