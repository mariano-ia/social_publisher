import { htmlShell, logoTag, type YacareTemplateProps, YC_TOKENS } from "./_shared";

/**
 * Cover slide template for Yacaré carousels. Violet background to contrast
 * with the dark content slides. Used for slide.kind === "cover" regardless
 * of which content-slide template the post was assigned.
 *
 * Props usage:
 * - title         → the big headline ("5 anti-patterns que matan productos B2B")
 * - subtitle      → the teaser ("Un reframe sobre cómo diseñar productos")
 * - pillar        → small tag on top-right (pillar name)
 * - slide_titles  → titles of the content slides that come next, rendered as
 *                   a "Lo que vas a ver" list to preview the carousel
 * - total_slides  → total slides in the carousel (default 5)
 */
export function ycCover(props: YacareTemplateProps): string {
  const title = props.title ?? "El método";
  const subtitle = props.subtitle ?? "Un reframe sobre cómo pensar productos.";
  const tag = (props.pillar ?? "carousel").toString().replace(/_/g, " ");
  const total = props.total_slides ?? 5;

  // Extract the "content" slide titles (skip cover at index 0 and cta at the end).
  // Show up to 4 bullets as a teaser.
  const teaserTitles = (props.slide_titles ?? [])
    .filter((t) => t && t.trim().length > 0)
    .slice(0, 4);

  const hasTeaser = teaserTitles.length > 0;

  const styles = `
    html, body { background: linear-gradient(165deg, ${YC_TOKENS.accent} 0%, ${YC_TOKENS.accentDark} 100%); }
    .frame { padding: 9% 9.5%; }
    .logo { filter: brightness(0) invert(1); opacity: 0.95; }
    .tag { color: rgba(255,255,255,0.75); }
    .glow-top { position: absolute; right: -200px; top: -250px; width: 750px; height: 750px; background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 60%); pointer-events: none; }
    .glow-bottom { position: absolute; left: -180px; bottom: -220px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(188,163,255,0.28) 0%, transparent 60%); pointer-events: none; }
    .shape { position: absolute; right: -120px; bottom: -80px; width: 360px; height: 360px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.12); }
    .cover-chip { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.28); border-radius: 999px; align-self: flex-start; margin-bottom: 28px; backdrop-filter: blur(6px); }
    .cover-chip .dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
    .cover-chip .txt { font-family: var(--supporting); font-weight: 600; font-size: 13px; color: #fff; letter-spacing: 0.22em; text-transform: uppercase; }
    .cover-title { font-family: var(--display); font-weight: 700; font-size: 112px; line-height: 0.92; letter-spacing: -0.025em; text-transform: uppercase; color: #ffffff; max-width: 880px; }
    .cover-subtitle { font-family: var(--body); font-size: 26px; font-weight: 400; line-height: 1.4; color: rgba(255,255,255,0.82); margin-top: 28px; max-width: 780px; }

    /* Teaser list ("Lo que vas a ver") fills the otherwise empty space */
    .teaser { margin-top: 40px; max-width: 820px; }
    .teaser-label { font-family: var(--supporting); font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
    .teaser-label::before { content: ""; width: 24px; height: 1px; background: rgba(255,255,255,0.5); }
    .teaser-list { display: flex; flex-direction: column; gap: 10px; }
    .teaser-item { display: flex; align-items: baseline; gap: 16px; font-family: var(--body); font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.92); line-height: 1.3; }
    .teaser-item .num { font-family: var(--supporting); font-weight: 600; font-size: 14px; color: rgba(255,255,255,0.55); min-width: 26px; letter-spacing: 0.05em; }

    .swipe-hint { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.85); font-family: var(--supporting); font-size: 14px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }
    .swipe-hint .arrow { font-size: 18px; display: inline-block; animation: nudge 1.6s ease-in-out infinite; }
    @keyframes nudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
    .slug { color: rgba(255,255,255,0.72); }
    .slug .dot { background: #fff; }
  `;

  const teaserHtml = hasTeaser
    ? `
      <div class="teaser">
        <div class="teaser-label">Lo que vas a ver</div>
        <div class="teaser-list">
          ${teaserTitles
            .map(
              (t, i) => `
            <div class="teaser-item">
              <span class="num">${String(i + 1).padStart(2, "0")}</span>
              <span>${escapeHtml(t)}</span>
            </div>`,
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  const html = `
    <div class="frame">
      <div class="glow-top"></div>
      <div class="glow-bottom"></div>
      <div class="shape"></div>
      <div class="header">
        ${logoTag(props)}
        <div class="tag">${escapeHtml(tag)}</div>
      </div>
      <div class="middle">
        <div class="cover-chip">
          <span class="dot"></span>
          <span class="txt">Carousel · 01 / ${String(total).padStart(2, "0")}</span>
        </div>
        <div class="cover-title">${escapeHtml(title)}</div>
        <div class="cover-subtitle">${escapeHtml(subtitle)}</div>
        ${teaserHtml}
      </div>
      <div class="footer">
        <div class="swipe-hint">
          <span>Desliza</span>
          <span class="arrow">→</span>
        </div>
        <div class="slug">YC · COVER</div>
      </div>
    </div>
  `;

  return htmlShell({ title: "yc-cover", styles, body: html });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
