import OpenAI from "openai";
import { createServerClient, ASSETS_BUCKET } from "@/lib/db/supabase";
import type { PostFormat, SlideKind } from "@/lib/db/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Argo photo generation prompts. These ask gpt-image-1 for PHOTOS ONLY — no
 * text, no panels, no UI. The HTML template composites the panel + chip +
 * headline over the photo afterwards, so the AI never has to render text
 * (which it does poorly).
 *
 * The style direction targets documentary / editorial photography with natural
 * imperfections — NOT hyper-polished studio AI aesthetic.
 *
 * IMPORTANT: Avoid age-specific descriptors ("niños", "jóvenes de X años")
 * which trigger OpenAI's moderation safety system. We use "estudiantes",
 * "atletas amateurs", "jugadores" as neutral terms.
 */
const STYLE_BASE_PHOTO_ONLY = `Fotografía editorial documental en color, estilo reportaje deportivo.

CONTEXTO: escenas de entrenamiento y actividad deportiva en instituciones educativas o clubes amateurs. Los sujetos son atletas amateurs y sus entrenadores, en un contexto formal deportivo de club o escuela. La escena ocurre en espacios deportivos reales — cancha, gimnasio, pista, campo de entrenamiento.

ENFOQUE NARRATIVO: interacción profesional entre entrenador y atleta durante una actividad deportiva. Gestos naturales de enseñanza, demostración técnica, conversación sobre una jugada, análisis de movimiento. El momento capturado es una situación de aprendizaje deportivo real, no una pose ni un retrato.

ESTÉTICA: Sports Illustrated feature photography, fotoperiodismo deportivo, editorial documentary. Calidad de autor, no stock photo, no corporate image, no "AI polished" aesthetic.

CÁMARA Y LENTE: 35mm o 50mm a f/1.8-2.8. Profundidad de campo natural con bokeh suave orgánico. Composición con regla de tercios — el sujeto principal NO va centrado, sino desplazado al primer o segundo tercio del cuadro. Enfoque puede estar en las manos, en el equipamiento, en un objeto del entorno, no siempre en el rostro.

LUZ: natural, de ambiente deportivo real. Luz difusa de gimnasio, luz lateral de exterior, hora dorada de entrenamiento de tarde. Sombras naturales. NO iluminación uniforme de estudio. Acepta zonas un poco oscuras o luces un poco quemadas si corresponde al momento.

IMPERFECCIÓN REAL: grano sutil tipo 35mm film, ligero desenfoque de movimiento en zonas no principales, detalles ambientales que no son perfectos (una botella de agua en el piso, una toalla, una línea de cancha desgastada). La imagen tiene que sentirse tomada en el momento, no producida en estudio.

COLOR: rendering natural con tonos cálidos sutiles. NO saturación aumentada, NO look Instagram filter, NO HDR. Aspecto similar a papel fotográfico impreso de revista deportiva.

COMPOSICIÓN: elementos en los bordes pueden recortarse naturalmente — no todo tiene que estar perfectamente encuadrado. Dejar "aire negativo" (zonas más lisas, fondo difuminado, piso, pared) donde el texto HTML se va a superponer después.

PROHIBIDO ABSOLUTO:
- NADA de texto visible en la imagen (ni palabras, ni letras, ni logos, ni números, ni carteles)
- NADA de elementos gráficos tipo UI (chips, pills, botones, cajas, overlays)
- NADA de logos o marcas deportivas reales inventadas
- NO iconos, ni gráficos decorativos, ni ilustraciones
- NO marcos, ni bordes, ni frames alrededor de la imagen
- NO escenas competitivas agresivas o físicas (sin tackles duros, sin contacto violento)

La imagen es SOLO la fotografía editorial. Toda la UI se agrega después en código.`;

const PHOTO_FRAMING_SINGLE_IG = `FRAMING: formato cuadrado 1:1. Sujetos principales en la mitad inferior del frame para dejar aire negativo arriba donde irá el header. Composición con mucho "breathing room" alrededor.`;

const PHOTO_FRAMING_SINGLE_LI = `FRAMING: formato horizontal 3:2. Sujetos desplazados hacia la izquierda del frame con el 30% derecho relativamente vacío (paisaje deportivo, fondo difuminado) para que el panel HTML se pueda superponer a la derecha.`;

const PHOTO_FRAMING_CAROUSEL_COVER = `FRAMING: formato vertical 4:5. Composición que tenga el sujeto principal en el tercio superior del frame, dejando los dos tercios inferiores con "breathing room" (fondo difuminado, paisaje deportivo, piso, grass). Ese espacio inferior se cubrirá con un overlay oscuro y el titular HTML superpuesto.`;

const PILLAR_CONTEXT: Record<string, string> = {
  ciencia_metodologia:
    "Escena de conversación profesional 1:1 entre entrenador y atleta amateur. Momento de análisis técnico o explicación de un concepto. Tono serio y profesional.",
  educacion_deportiva:
    "Grupo de atletas amateurs en sesión de entrenamiento con el coach guiando la actividad. Demostración técnica, corrección de postura, momento didáctico. Energía controlada.",
  producto:
    "Entrenador observando un tablet o cuaderno técnico junto a un atleta amateur. Momento de revisión de resultados, análisis de performance, lectura de información.",
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

/**
 * Generates a photo-only image (no text, no UI) for an Argo single post.
 * The HTML template then composites the panel + headline over it.
 */
export async function renderArgoSinglePhoto(input: RenderArgoSingleInput): Promise<{
  publicUrl: string;
  storagePath: string;
  promptUsed: string;
  width: number;
  height: number;
}> {
  const dims = FORMAT_DIMENSIONS[input.format];
  const pillarHint = input.pillar ? PILLAR_CONTEXT[input.pillar] ?? "" : "";
  const framing = input.format === "ig_feed" ? PHOTO_FRAMING_SINGLE_IG : PHOTO_FRAMING_SINGLE_LI;

  const fullPrompt = `${STYLE_BASE_PHOTO_ONLY}

${framing}

${pillarHint ? `CONTEXTO DE ESCENA según el pilar de contenido: ${pillarHint}` : ""}
${input.scene_hint ? `DETALLES ADICIONALES DE LA ESCENA: ${input.scene_hint}` : ""}

RECORDATORIO FINAL: La imagen es SOLO FOTOGRAFÍA. Cero texto, cero UI, cero logos. El diseño gráfico se compone después en código HTML sobre esta foto.`;

  return await callGptImageAndUpload(fullPrompt, dims.size, input.tenantSlug, input.postId, "single");
}

/**
 * Legacy alias for renderArgoSingle — keeps the old name working for
 * orchestrator code that still calls it. Prefer renderArgoSinglePhoto.
 */
export const renderArgoSingle = renderArgoSinglePhoto;

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

/**
 * Generates a photo-only image for the COVER slide of an Argo carousel.
 * Only slide.kind === "cover" uses this — content and cta slides are pure
 * HTML→PNG and don't call gpt-image-1 at all.
 */
export async function renderArgoCarouselCoverPhoto(
  input: RenderArgoCarouselSlideInput,
): Promise<{ publicUrl: string; storagePath: string; promptUsed: string; width: number; height: number }> {
  const dims = FORMAT_DIMENSIONS.carousel_slide;
  const pillarHint = input.pillar ? PILLAR_CONTEXT[input.pillar] ?? "" : "";

  const fullPrompt = `${STYLE_BASE_PHOTO_ONLY}

${PHOTO_FRAMING_CAROUSEL_COVER}

${pillarHint ? `CONTEXTO DE ESCENA según el pilar de contenido: ${pillarHint}` : ""}
${input.scene_hint ? `DETALLES ADICIONALES DE LA ESCENA: ${input.scene_hint}` : ""}

RECORDATORIO FINAL: La imagen es SOLO FOTOGRAFÍA. Cero texto, cero UI, cero logos. El título del carrusel y los elementos gráficos se agregan después en HTML.`;

  return await callGptImageAndUpload(
    fullPrompt,
    dims.size,
    input.tenantSlug,
    input.postId,
    "slide",
    input.slideIndex,
  );
}

/**
 * Legacy alias. The old orchestrator called renderArgoCarouselSlide for every
 * slide. Now only the cover calls the photo pipeline — content/cta are HTML.
 */
export const renderArgoCarouselSlide = renderArgoCarouselCoverPhoto;

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
