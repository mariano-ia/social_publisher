import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

export function ycFaqCard(props: YacareTemplateProps): string {
  const question = props.title ?? "¿Pueden trabajar con nuestro equipo interno?";
  const answer = props.body_text ?? props.subtitle ?? "Sí. Nos integramos directo con founders, devs y product. Sin pisarse, sin reuniones de mil personas.";

  const styles = `
    .glow { position: absolute; left: -100px; top: 100px; width: 600px; height: 600px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .q-mark { font-family: var(--display); font-weight: 700; font-size: 360px; line-height: 0.7; color: var(--accent); margin-top: 60px; letter-spacing: -0.04em; }
    .question { font-family: var(--display); font-weight: 600; font-size: 92px; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin-top: 28px; max-width: 880px; }
    .divider { width: 64px; height: 3px; background: linear-gradient(90deg, var(--accent), transparent); margin-top: 36px; }
    .answer { font-family: var(--body); font-size: 28px; font-weight: 400; line-height: 1.5; color: var(--text-dim); margin-top: 28px; max-width: 820px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">FAQ</div>
      </div>
      <div class="q-mark">¿</div>
      <div class="question">${escapeHtml(question.replace(/^¿/, "").replace(/\?$/, ""))}</div>
      <div class="divider"></div>
      <div class="answer">${escapeHtml(answer)}</div>
      <div class="spacer"></div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>FAQ CARD</div>
        <div class="slug">YC · 03</div>
      </div>
    </div>
  `;
  return htmlShell({ title: "yc-faq-card", styles, body: html });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
