import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

export function ycProcessStep(props: YacareTemplateProps): string {
  // Title is the step name (e.g. "Understand"). subtitle is body text.
  const stepName = props.title ?? "Understand";
  const stepNumber = (props.slide?.index ?? 1).toString().padStart(2, "0");
  const totalSteps = "04";
  const body = props.body_text ?? props.subtitle ?? "Antes que exista un solo pixel, mapeamos usuarios, problema y dirección.";

  const styles = `
    .glow { position: absolute; right: -250px; bottom: -100px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%); pointer-events: none; }
    .step-chip { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; background: rgba(138,94,255,0.12); border: 1px solid rgba(138,94,255,0.4); border-radius: 999px; align-self: flex-start; margin-bottom: 28px; }
    .step-chip .num { font-family: var(--supporting); font-weight: 600; font-size: 14px; color: var(--accent); letter-spacing: 0.08em; }
    .step-chip .label { font-family: var(--supporting); font-weight: 500; font-size: 12px; color: var(--text-dim); letter-spacing: 0.2em; text-transform: uppercase; }
    .title { font-family: var(--display); font-weight: 700; font-size: 196px; line-height: 0.88; letter-spacing: -0.02em; text-transform: uppercase; }
    .body { font-family: var(--body); font-size: 30px; font-weight: 400; line-height: 1.45; color: var(--text-dim); margin-top: 48px; max-width: 820px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="corner-shape"></div>
      <div class="corner-shape-inner"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Método</div>
      </div>
      <div class="middle">
        <div class="step-chip">
          <span class="num">${stepNumber}</span>
          <span class="label">de ${totalSteps}</span>
        </div>
        <div class="title">${escapeHtml(stepName)}</div>
        <div class="body">${escapeHtml(body)}</div>
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>PROCESS STEP</div>
        <div class="slug">YC · 02</div>
      </div>
    </div>
  `;

  return htmlShell({ title: "yc-process-step", styles, body: html });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
