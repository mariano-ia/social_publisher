import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

export function ycProcessStep(props: YacareTemplateProps): string {
  // Title is the step name (e.g. "Understand"). subtitle is body text.
  const stepName = props.title ?? "Understand";
  const stepNumber = (props.slide?.index ?? 1).toString().padStart(2, "0");
  const totalSteps = "04";
  const body = props.body_text ?? props.subtitle ?? "Antes que exista un solo pixel, mapeamos usuarios, problema y dirección.";

  const styles = `
    .glow { position: absolute; right: -250px; bottom: -100px; width: 700px; height: 700px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%); pointer-events: none; }
    .step-row { display: flex; align-items: baseline; gap: 36px; margin-bottom: 24px; }
    .step-num { font-family: var(--display); font-weight: 600; font-size: 56px; color: var(--accent); letter-spacing: 0.04em; line-height: 1; }
    .step-bar { flex: 1; height: 1px; background: linear-gradient(90deg, var(--accent), transparent); }
    .title { font-family: var(--display); font-weight: 700; font-size: 196px; line-height: 0.88; letter-spacing: -0.02em; text-transform: uppercase; }
    .body { font-family: var(--body); font-size: 32px; font-weight: 400; line-height: 1.45; color: var(--text-dim); margin-top: 56px; max-width: 820px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">Método · ${stepNumber} de ${totalSteps}</div>
      </div>
      <div class="spacer"></div>
      <div class="step-row">
        <div class="step-num">${stepNumber}</div>
        <div class="step-bar"></div>
      </div>
      <div class="title">${escapeHtml(stepName)}</div>
      <div class="body">${escapeHtml(body)}</div>
      <div class="spacer"></div>
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
