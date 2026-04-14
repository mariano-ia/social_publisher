/**
 * Renders the Argo HTML templates (carousel content, carousel CTA, solid
 * violet IG variant) to /tmp/social-publisher-mocks/argo/*.html with
 * sample props. Run: npx tsx scripts/render-argo-previews.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { arCarouselContent } from "../src/lib/rendering/templates/argo/ar-carousel-content";
import { arCarouselCta } from "../src/lib/rendering/templates/argo/ar-carousel-cta";
import { arSolidViolet } from "../src/lib/rendering/templates/argo/ar-solid-violet";
import { arIgPhoto } from "../src/lib/rendering/templates/argo/ar-ig-photo";
import { arIgMinimal } from "../src/lib/rendering/templates/argo/ar-ig-minimal";

const OUT = "/tmp/social-publisher-mocks/argo";
mkdirSync(OUT, { recursive: true });

const CAROUSEL_W = 1080;
const CAROUSEL_H = 1080;

const renders: Record<string, string> = {
  "ar-carousel-content-02": arCarouselContent({
    width: CAROUSEL_W,
    height: CAROUSEL_H,
    pillar: "ciencia_metodologia",
    slide: {
      index: 2,
      kind: "content",
      title: "Cada niño tiene un perfil conductual único",
      body: "No es solo talento ni esfuerzo. La metodología DISC muestra que hay patrones que definen cómo un deportista aprende, compite y responde a la presión.",
    },
    total_slides: 5,
  }),
  "ar-carousel-content-03": arCarouselContent({
    width: CAROUSEL_W,
    height: CAROUSEL_H,
    pillar: "educacion_deportiva",
    slide: {
      index: 3,
      kind: "content",
      title: "Identificá el motor de rendimiento",
      body: "Observá si tu deportista trabaja mejor con presión, con calma o alternando ambos. Ese ritmo interno te dice más que cualquier test estandarizado.",
    },
    total_slides: 5,
  }),
  "ar-carousel-cta": arCarouselCta({
    width: CAROUSEL_W,
    height: CAROUSEL_H,
    slide: {
      index: 5,
      kind: "cta",
      title: "Conoce el perfil conductual de tus deportistas.",
      body: "14 días gratis. Sin tarjeta de crédito.",
    },
    total_slides: 5,
    cta_text: "Iniciar prueba gratuita",
  }),
  "ar-solid-violet": arSolidViolet({
    width: 1080,
    height: 1080,
    pillar: "ciencia_metodologia",
    title: "Hay 12 maneras de ser deportista. Ninguna es mejor que otra.",
    subtitle: "12",
  }),
  "ar-ig-photo": arIgPhoto({
    width: 1080,
    height: 1080,
    pillar: "educacion_deportiva",
    title: "El entrenador que entiende a su deportista gana más que el que solo lo presiona.",
    // No photo_url → placeholder gradient
  }),
  "ar-ig-minimal": arIgMinimal({
    width: 1080,
    height: 1080,
    pillar: "ciencia_metodologia",
    title: "El niño que parece distraído quizás necesita otro ritmo.",
    // No photo_url → placeholder
  }),
};

for (const [slug, html] of Object.entries(renders)) {
  writeFileSync(`${OUT}/${slug}.html`, html, "utf-8");
  console.log(`  + ${slug}.html`);
}
console.log(`\n✓ Wrote ${Object.keys(renders).length} Argo templates to ${OUT}`);
