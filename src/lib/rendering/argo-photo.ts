import OpenAI from "openai";
import { createServerClient, ASSETS_BUCKET } from "@/lib/db/supabase";
import type { PostFormat, SlideKind } from "@/lib/db/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const STYLE_BASE_SINGLE = `Diseño editorial split-layout para publicación de redes sociales. La imagen se divide verticalmente en dos mitades.

== MITAD IZQUIERDA (~50%): FOTOGRAFÍA EDITORIAL ==
SUJETOS: Personas reales — entrenadores deportivos (30-45 años) interactuando con jóvenes deportistas (6-16 años). Contexto deportivo real: cancha, gimnasio, pista, campo de entrenamiento. Interacción auténtica, natural, emocional.
LUZ: Natural, hora dorada o luz difusa de exterior.
TEXTO SOBRE LA FOTO: El título del post aparece como cita entre comillas, en blanco, tipografía Inter Bold, tamaño mediano, posicionado en el tercio inferior izquierdo de la foto. Sombra sutil para legibilidad sobre la imagen.

== MITAD DERECHA (~50%): PANEL INFORMATIVO OSCURO ==
Fondo sólido color #1D1D1F (negro casi puro).

JERARQUÍA VERTICAL DEL PANEL (de arriba hacia abajo, con espaciado generoso entre cada elemento):

1. MARCA: "Argo Method" en Inter, tamaño pequeño, color naranja/ámbar (#E8943A). Posición: esquina superior izquierda del panel.

2. CHIP DE CATEGORÍA: Pequeño badge pill-shaped (bordes redondeados completos) con fondo naranja/ámbar (#E8943A) y texto blanco en Inter Bold uppercase, tamaño MUY pequeño (ej: "SCIENCE & METHOD" o "COACHING" o "PRODUCT").
   IMPORTANTE: El chip debe tener MUCHO MARGEN INFERIOR separándolo del título. Mínimo 20px de espacio vacío entre el chip y el título. El chip NO debe tocar ni pegarse al texto del título.

3. TÍTULO: El mismo título del post, en Inter Bold, blanco, tamaño grande pero no gigante. Máximo 3-4 líneas. Alineado a la izquierda.
   IMPORTANTE: Debe haber espacio claro entre el chip de arriba y este título.

4. SUBTÍTULO: Una línea descriptiva corta en Inter Regular, color gris (#86868B), tamaño pequeño. Separado del título por un espacio visible.

5. CTA BUTTON: En la parte inferior del panel, un botón pill-shaped (bordes redondeados completos) con fondo púrpura degradado (#955FB5 a #b07dd4), ancho completo del panel (con márgenes laterales). Texto "argomethod.com" en Inter Medium, blanco, centrado.

ESPACIADO: Cada elemento tiene espacio generoso entre sí. Nada se toca. Nada se superpone. El panel debe respirar.

BORDE: Una línea fina naranja/ámbar (#E8943A) en el borde superior del panel oscuro, separando foto de panel.

PROHIBIDO: No incluir logos gráficos, escudos, marcas inventadas, iconos decorativos, veleros, anclas, timones, ilustraciones. Ninguna tipografía que no sea Inter. No poner elementos del panel sobre la fotografía ni viceversa.`;

const STYLE_BASE_CAROUSEL = `Diseño editorial vertical 4:5 (formato carrusel LinkedIn) para publicación de redes sociales. La imagen se divide HORIZONTALMENTE en dos zonas.

== MITAD SUPERIOR (~55%): FOTOGRAFÍA EDITORIAL ==
SUJETOS: Personas reales — entrenadores deportivos (30-45 años) interactuando con jóvenes deportistas (6-16 años). Contexto deportivo real: cancha, gimnasio, pista, campo de entrenamiento. Interacción auténtica, natural, emocional.
LUZ: Natural, hora dorada o luz difusa de exterior.

== MITAD INFERIOR (~45%): PANEL INFORMATIVO OSCURO ==
Fondo sólido color #1D1D1F (negro casi puro).

JERARQUÍA DEL PANEL (top a bottom, con espaciado generoso):

1. MARCA: "Argo Method" en Inter, tamaño pequeño, color naranja/ámbar (#E8943A). Esquina superior izquierda del panel.

2. CHIP DE CATEGORÍA: Badge pill con fondo #E8943A, texto blanco Inter Bold uppercase MUY pequeño. Mínimo 20px de margen inferior antes del título.

3. TÍTULO DEL SLIDE: Inter Bold blanco, tamaño grande, máximo 3 líneas, alineado a la izquierda.

4. BODY DEL SLIDE: Inter Regular gris (#86868B), 1-2 líneas, separado del título.

5. INDICADOR DE SLIDE: En el borde inferior derecho del panel, en Inter Medium gris pequeño, formato "01 / 05" o similar.

BORDE SUPERIOR del panel: Línea fina naranja/ámbar (#E8943A) horizontal separando foto de panel.

PROHIBIDO: No logos, no escudos, no marcas inventadas, no iconos decorativos, no veleros/anclas/timones. Solo Inter como tipografía.`;

const STYLE_CAROUSEL_CTA = `Variante CTA del carrusel: en lugar del body de texto, el panel inferior contiene un botón pill-shaped GRANDE con fondo púrpura degradado (#955FB5 a #b07dd4), ancho casi completo del panel, texto "argomethod.com" en Inter Medium blanco centrado. Sobre el botón, un título corto de cierre invitando a la acción.`;

const PILLAR_CONTEXT: Record<string, string> = {
  ciencia_metodologia:
    "Escena de interacción cercana 1:1 entre un entrenador y un deportista joven. Momento de conversación, conexión visual directa. Tono serio pero cálido.",
  educacion_deportiva:
    "Grupo de jóvenes deportistas entrenando con el entrenador guiando la actividad. Acción deportiva con presencia del adulto. Energía y movimiento.",
  producto:
    "Entrenador mirando un tablet o documento junto a un deportista joven. Momento de análisis o descubrimiento. Foco en el concepto de información que transforma.",
};

const FORMAT_DIMENSIONS: Record<PostFormat | "carousel_slide", { size: "1024x1024" | "1024x1536" | "1536x1024"; aspect: string }> = {
  ig_feed: { size: "1024x1024", aspect: "cuadrado 1:1" },
  li_single: { size: "1536x1024", aspect: "horizontal 3:2" },
  li_carousel: { size: "1024x1536", aspect: "vertical 2:3" },
  carousel_slide: { size: "1024x1536", aspect: "vertical 2:3" },
};

interface RenderArgoSingleInput {
  format: "ig_feed" | "li_single";
  title: string;
  subtitle?: string;
  pillar?: string;
  scene_hint?: string;
  tenantSlug: string;
  postId: string;
}

export async function renderArgoSingle(input: RenderArgoSingleInput): Promise<{
  publicUrl: string;
  storagePath: string;
  promptUsed: string;
  width: number;
  height: number;
}> {
  const dims = FORMAT_DIMENSIONS[input.format];
  const pillarHint = input.pillar ? PILLAR_CONTEXT[input.pillar] ?? "" : "";

  const fullPrompt = `${STYLE_BASE_SINGLE}

Formato: ${dims.aspect}.
Texto del título sobre la imagen: "${input.title}"
${input.subtitle ? `Subtítulo: "${input.subtitle}"` : ""}
${pillarHint ? `Contexto del pilar: ${pillarHint}` : ""}
${input.scene_hint ? `Indicaciones adicionales de escena: ${input.scene_hint}` : ""}`;

  return await callGptImageAndUpload(fullPrompt, dims.size, input.tenantSlug, input.postId, "single");
}

interface RenderArgoCarouselSlideInput {
  slideIndex: number;
  slideKind: SlideKind;
  slideTitle: string;
  slideBody?: string;
  pillar?: string;
  scene_hint?: string;
  tenantSlug: string;
  postId: string;
}

export async function renderArgoCarouselSlide(
  input: RenderArgoCarouselSlideInput,
): Promise<{ publicUrl: string; storagePath: string; promptUsed: string; width: number; height: number }> {
  const dims = FORMAT_DIMENSIONS.carousel_slide;
  const pillarHint = input.pillar ? PILLAR_CONTEXT[input.pillar] ?? "" : "";
  const ctaVariant = input.slideKind === "cta" ? `\n\n${STYLE_CAROUSEL_CTA}` : "";

  const fullPrompt = `${STYLE_BASE_CAROUSEL}${ctaVariant}

Formato: ${dims.aspect}.
Slide ${input.slideIndex} de 5 (${input.slideKind}).
Indicador de slide visible en el panel: "${String(input.slideIndex).padStart(2, "0")} / 05"
Título del slide: "${input.slideTitle}"
${input.slideBody ? `Body del slide: "${input.slideBody}"` : ""}
${pillarHint ? `Contexto del pilar para la fotografía: ${pillarHint}` : ""}
${input.scene_hint ? `Indicaciones adicionales: ${input.scene_hint}` : ""}`;

  return await callGptImageAndUpload(
    fullPrompt,
    dims.size,
    input.tenantSlug,
    input.postId,
    "slide",
    input.slideIndex,
  );
}

async function callGptImageAndUpload(
  prompt: string,
  size: "1024x1024" | "1024x1536" | "1536x1024",
  tenantSlug: string,
  postId: string,
  kind: "single" | "slide",
  slideIndex?: number,
): Promise<{ publicUrl: string; storagePath: string; promptUsed: string; width: number; height: number }> {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size,
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) throw new Error("gpt-image-1 returned no image data");

  const buffer = Buffer.from(imageData.b64_json, "base64");
  const filename =
    kind === "slide"
      ? `${tenantSlug}/${postId}/slide-${String(slideIndex).padStart(2, "0")}.png`
      : `${tenantSlug}/${postId}/single.png`;

  const sb = createServerClient();
  const { error: uploadError } = await sb.storage
    .from(ASSETS_BUCKET)
    .upload(filename, buffer, { contentType: "image/png", upsert: true });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: urlData } = sb.storage.from(ASSETS_BUCKET).getPublicUrl(filename);

  const [width, height] = size.split("x").map(Number);
  return {
    publicUrl: urlData.publicUrl,
    storagePath: filename,
    promptUsed: prompt,
    width,
    height,
  };
}
