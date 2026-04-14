/**
 * Renders the 5 Yacaré templates to /tmp/social-publisher-mocks/yacare/*.html
 * with sample props, so they can be screenshot by Chrome headless.
 * Run: npx tsx scripts/render-yacare-previews.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { ycContrarianTake } from "../src/lib/rendering/templates/yacare/yc-contrarian-take";
import { ycProcessStep } from "../src/lib/rendering/templates/yacare/yc-process-step";
import { ycFaqCard } from "../src/lib/rendering/templates/yacare/yc-faq-card";
import { ycReframe } from "../src/lib/rendering/templates/yacare/yc-reframe";
import { ycManifestoBlock } from "../src/lib/rendering/templates/yacare/yc-manifesto-block";
import { ycCover } from "../src/lib/rendering/templates/yacare/yc-cover";

const OUT = "/tmp/social-publisher-mocks/yacare";
mkdirSync(OUT, { recursive: true });

const W = 1080;
const H = 1080;

const renders: Record<string, string> = {
  "yc-contrarian-take": ycContrarianTake({
    width: W,
    height: H,
    title: "Dejá de contratar fábricas que diseñan pantallas. Necesitás product judgment.",
    subtitle: "product judgment",
  }),
  "yc-process-step": ycProcessStep({
    width: W,
    height: H,
    title: "Understand",
    body_text:
      "Antes que exista un solo pixel, mapeamos usuarios, problema y dirección. Sin atajos.",
    slide: { index: 1, kind: "content" },
  }),
  "yc-faq-card": ycFaqCard({
    width: W,
    height: H,
    title: "¿Pueden trabajar con nuestro equipo interno?",
    body_text:
      "Sí. Nos integramos directo con founders, devs y product. Sin pisarse, sin reuniones de mil personas.",
  }),
  "yc-reframe": ycReframe({
    width: W,
    height: H,
    subtitle: "Velocidad de aprendizaje > Horas facturables",
    title: "Equipos chicos > Equipos grandes",
  }),
  "yc-manifesto-block": ycManifestoBlock({
    width: W,
    height: H,
    title: "Diseñamos, construimos y escalamos productos B2B SaaS.",
    body_text:
      "Sin equipos inflados. Sin proyectos eternos sin dirección. Just sharp execution de gente que se obsesiona por outcomes.",
  }),
  "yc-cover": ycCover({
    width: W,
    height: H,
    title: "5 anti-patterns que matan productos B2B",
    subtitle: "Los errores más comunes que vemos en equipos de producto y cómo evitarlos.",
    pillar: "anti-pattern",
    slide_titles: [
      "Empezar por la UI antes que por el problema",
      "Confundir velocidad de shipping con velocidad de aprendizaje",
      "Equipos grandes para problemas que requieren claridad, no manos",
      "Discovery como checkbox, no como proceso",
    ],
    total_slides: 5,
  }),
};

for (const [slug, html] of Object.entries(renders)) {
  writeFileSync(`${OUT}/${slug}.html`, html, "utf-8");
  console.log(`  + ${slug}.html`);
}
console.log(`\n✓ Wrote ${Object.keys(renders).length} templates to ${OUT}`);
