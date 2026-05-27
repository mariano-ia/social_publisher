import type { Franchise } from "./types";

/**
 * Blotato visual template ids (from blotato_list_visual_templates). Used in Fase B.
 */
const TEMPLATES = {
  aiStoryVideo: "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  whenXThenY: "/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1",
  tutorialCarousel: "/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1",
  imageSlideshowProminent: "/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1",
  igCarouselSlideshow: "53cfec04-2500-41cf-8cc1-ba670d2c341a",
} as const;

export const ARGO_FRANCHISES: Franchise[] = [
  {
    slug: "60-segundos-metodo",
    name: "60 segundos de metodo",
    pillar: "metodo",
    tone: "revelador",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.aiStoryVideo,
    units: 3,
    brief:
      "Micro pildora educativa: explica en lenguaje de padres una idea del metodo Argo (un eje DISC, el motor, un arquetipo) aplicada a una escena deportiva concreta. Tono revelador: planteas una observacion poco obvia y la explicas claro. Termina invitando a pensar distinto, sin vender.",
  },
  {
    slug: "carta-papa-deportivo",
    name: "Carta a un papa deportivo",
    pillar: "vinculo",
    tone: "calido",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.aiStoryVideo,
    units: 4,
    brief:
      "Una reflexion breve dirigida a una madre o padre sobre una escena cotidiana del deporte infantil (el chico que se frustra, el que no quiere ir a entrenar, el que se compara). Tono calido, de igual a igual, empatico. Reencuadra la escena desde la comprension del chico, nunca desde el reto ni la exigencia.",
  },
  {
    slug: "como-funciona-mente",
    name: "Como funciona la mente de...",
    pillar: "metodo",
    tone: "revelador",
    format: "carousel",
    platforms: ["instagram"],
    blotatoTemplateId: TEMPLATES.tutorialCarousel,
    units: 5,
    brief:
      "Explica un arquetipo o un rasgo (ej: el chico que necesita saber el por que antes de hacer) en lenguaje de padres. Cover con el hook, slides de contenido que describen como tiende a comportarse y como acompanarlo, y un cierre. Lenguaje probabilistico, sin etiquetas rigidas.",
  },
  {
    slug: "mito-vs-dato",
    name: "Mito vs Dato",
    pillar: "mitos",
    tone: "directo",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.whenXThenY,
    units: 3,
    brief:
      "Derriba un mito del deporte infantil (ej: el chico timido no sirve para deportes de equipo). Cada escena contrapone el mito y el dato. Tono directo y con postura, pero nunca agresivo ni contra el lector: cuestiona la creencia, no a quien la sostiene.",
  },
  {
    slug: "el-gesto-que-cambia",
    name: "El gesto que cambia todo",
    pillar: "vinculo",
    tone: "calido",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.imageSlideshowProminent,
    units: 4,
    brief:
      "Un cambio concreto y pequeno en como el adulto (padre o entrenador) le habla al chico, accionable hoy mismo. Tono calido y practico. Una sola idea por pieza, mostrada con un antes y un despues de la frase o el gesto.",
  },
  {
    slug: "detras-de-la-odisea",
    name: "Detras de la Odisea",
    pillar: "producto",
    tone: "calido",
    format: "carousel",
    platforms: ["instagram"],
    blotatoTemplateId: TEMPLATES.igCarouselSlideshow,
    units: 5,
    brief:
      "Muestra que es Argo sin sonar a venta: como es la experiencia de la Odisea para el chico y que recibe el adulto. Tono calido y curioso. Foco en el vinculo y la comprension, no en el rendimiento. Usa el glosario (Odisea, Perfil, adulto acompanante).",
  },
];

/** The Monday-to-Friday weekly batch (producto runs separately, biweekly). */
export const ARGO_WEEKLY_FRANCHISES: string[] = [
  "60-segundos-metodo",
  "carta-papa-deportivo",
  "como-funciona-mente",
  "mito-vs-dato",
  "el-gesto-que-cambia",
];

export function getArgoFranchises(slugs: string[]): Franchise[] {
  return slugs.map((slug) => {
    const f = ARGO_FRANCHISES.find((x) => x.slug === slug);
    if (!f) throw new Error(`Unknown Argo franchise: ${slug}`);
    return f;
  });
}
