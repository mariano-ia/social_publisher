import { htmlShell, logoTag, type YacareTemplateProps } from "./_shared";

/**
 * FAQ card: big Q + question + answer. Adaptive sizes for both question
 * and answer so long content fits.
 */
export function ycFaqCard(props: YacareTemplateProps): string {
  const rawQuestion = (props.title ?? "¿Pueden trabajar con nuestro equipo interno?").trim();
  // Strip leading/trailing question marks so we can add them ourselves in the template
  const question = rawQuestion.replace(/^¿/, "").replace(/\?$/, "");
  const answer = (props.body_text ?? props.subtitle ?? "Sí. Nos integramos directo con founders, devs y product.").trim();

  const questionSize = question.length > 80 ? 56 : question.length > 50 ? 72 : 88;

  const styles = `
    .glow { position: absolute; left: -100px; top: 100px; width: 600px; height: 600px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
    .q-mark { font-family: var(--display); font-weight: 700; font-size: 260px; line-height: 0.7; color: var(--accent); letter-spacing: -0.04em; margin-bottom: 12px; }
    .question { font-family: var(--display); font-weight: 600; font-size: ${questionSize}px; line-height: 1; letter-spacing: -0.02em; text-transform: uppercase; max-width: 900px; }
    .divider { width: 64px; height: 3px; background: linear-gradient(90deg, var(--accent), transparent); margin-top: 28px; }
    .answer { font-family: var(--body); font-size: 26px; font-weight: 400; line-height: 1.5; color: var(--text-dim); margin-top: 24px; max-width: 820px; }
  `;

  const html = `
    <div class="frame">
      <div class="glow"></div>
      <div class="corner-shape"></div>
      <div class="corner-shape-inner"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">FAQ</div>
      </div>
      <div class="middle">
        <div class="q-mark">¿</div>
        <div class="question">${escapeHtml(question)}?</div>
        <div class="divider"></div>
        <div class="answer">${escapeHtml(answer)}</div>
      </div>
      <div class="footer">
        <div class="slug"><span class="dot"></span>FAQ CARD</div>
        <div class="slug">YC · 03</div>
      </div>
    </div>
  `;
  return htmlShell({ title: "yc-faq-card", styles, body: html });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
