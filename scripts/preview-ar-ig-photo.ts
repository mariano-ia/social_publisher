import { writeFileSync, mkdirSync } from "node:fs";
import { arIgPhoto } from "../src/lib/rendering/templates/argo/ar-ig-photo";

const OUT = "/tmp/social-publisher-mocks/argo";
mkdirSync(OUT, { recursive: true });

// Kids playing sports. loremflickr returns keyword-matched photos reliably.
const photos = {
  "ar-ig-photo-kid-1": {
    url: "https://loremflickr.com/1080/1080/kids,soccer?lock=7",
    title: "4 coaching mistakes that stall your young athletes",
  },
  "ar-ig-photo-kid-2": {
    url: "https://loremflickr.com/1080/1080/children,basketball?lock=12",
    title: "Every kid has a unique behavioral profile. Here's how to read it.",
  },
};

for (const [slug, { url, title }] of Object.entries(photos)) {
  const html = arIgPhoto({
    width: 1080,
    height: 1080,
    pillar: "ciencia_metodologia",
    title,
    photo_url: url,
  });
  writeFileSync(`${OUT}/${slug}.html`, html, "utf-8");
  console.log(`  + ${slug}.html`);
}

const index = `<!doctype html>
<html><head><meta charset="utf-8"><title>ar-ig-photo overlay preview</title>
<style>
  body { margin: 0; padding: 24px; background: #1a1a1a; font-family: -apple-system, sans-serif; color: #eee; }
  h1 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px; }
  p { font-size: 12px; color: #888; margin: 0 0 24px; max-width: 620px; line-height: 1.5; }
  .row { display: flex; gap: 24px; flex-wrap: wrap; }
  .card { background: #000; border-radius: 8px; overflow: hidden; width: 540px; }
  .wrap { width: 540px; height: 540px; overflow: hidden; }
  .wrap iframe { display: block; border: 0; width: 1080px; height: 1080px; transform: scale(0.5); transform-origin: 0 0; }
  .label { padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; }
</style></head>
<body>
  <h1>ar-ig-photo · v2</h1>
  <p>
    Photo stays in full color. The only dark area is a gradient fade at the
    top of the photo (for logo legibility). Headline sits in a solid lavender
    caption block below the photo — no overlap with the image. Kids photos,
    English copy. Violet footer stays.
  </p>
  <div class="row">
    <div class="card">
      <div class="wrap"><iframe src="ar-ig-photo-kid-1.html"></iframe></div>
      <div class="label">kid · soccer</div>
    </div>
    <div class="card">
      <div class="wrap"><iframe src="ar-ig-photo-kid-2.html"></iframe></div>
      <div class="label">kid · basketball</div>
    </div>
  </div>
</body></html>`;
writeFileSync(`${OUT}/preview.html`, index, "utf-8");
console.log(`\n✓ Abrir: file://${OUT}/preview.html`);
