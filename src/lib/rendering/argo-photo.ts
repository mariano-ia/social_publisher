import OpenAI from "openai";
import { createServerClient, ASSETS_BUCKET } from "@/lib/db/supabase";
import type { PostFormat, SlideKind } from "@/lib/db/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Argo photo generation prompts. These ask gpt-image-1 for PHOTOS ONLY — no
 * text, no panels, no UI. The HTML template (ar-ig-photo, etc.) composites
 * the panel + chip + headline over the photo afterwards, so the AI never
 * has to render text (which it does poorly).
 *
 * The style direction targets documentary / editorial photography with natural
 * imperfections — NOT hyper-polished studio AI aesthetic.
 */
const STYLE_BASE_PHOTO_ONLY = `Fotografía editorial documental en color, estilo reportaje deportivo. Reales, no staged.

SUJETOS: entrenadores deportivos (30-50 años) y jóvenes deportistas (6-16 años) en contexto deportivo real — cancha, gimnasio, pista, campo. Interacción auténtica, gestos naturales, expresiones genuinas. NO poses para cámara, NO miradas directas al lente salvo que la escena lo justifique.

ESTÉTICA DE REFERENCIA: Sports Illustrated feature, National Geographic candid, Annie Leibovitz documentary work. Fotografía de autor, no stock photo. NO aesthetic "AI perfecto" ni "corporate stock".

CÁMARA Y LENTE: 35mm o 50mm f/1.8-f/2.8. Profundidad de campo natural con bokeh suave (no artificial). Enfoque no siempre en el centro de la cara — puede estar en las manos, en la pelota, en un objeto. Composición con REGLA DE TERCIOS, NO sujetos perfectamente centrados.

LUZ: Natural, hora dorada o luz difusa interior real de gimnasio. Sombras reales. Acepta altas luces quemadas o sombras profundas cuando corresponda al momento. NO iluminación de estudio uniforme.

IMPERFECCIÓN CONTROLADA: Grano sutil de 35mm, ligero desenfoque en zonas no principales, imperfecciones naturales (una gota de sudor, una cara borrosa al fondo, una pelota desenfocada). La escena tiene que SENTIRSE tomada en el momento, no producida.

COLOR: Rendimiento de color natural, NO saturado. Tonos cálidos sutiles. NO look Instagram filter, NO HDR.

COMPOSICIÓN: Puede haber elementos en los bordes que se "cortan" naturalmente. NO composición perfecta de revista. Respetar la regla de tercios y dejar "aire negativo" donde el texto HTML se va a superponer después.

PROHIBIDO ABSOLUTO:
- NADA de texto en la imagen (ni palabras, ni letras, ni logos, ni números, ni subtítulos)
- NADA de elementos gráficos UI (ni chips, ni pills, ni botones, ni cajas de texto)
- NADA de logos o marcas inventadas
- NO iconos, veleros, anclas, timones, gráficos decorativos
- NO frames, bordes o marcos alrededor de la imagen
- La imagen es SOLO la fotografía. Toda la UI se agrega después en código.`;

const PHOTO_FRAMING_SINGLE_IG = `FRAMING: formato cuadrado 1:1. Sujetos principales en la mitad inferior del frame para dejar aire negativo arriba donde irá el header. Composición con mucho "breathing room" alrededor.`;

const PHOTO_FRAMING_SINGLE_LI = `FRAMING: formato horizontal 3:2. Sujetos desplazados hacia la izquierda del frame con el 30% derecho relativamente vacío (paisaje deportivo, fondo difuminado) para que el panel HTML se pueda superponer a la derecha.`;

const PHOTO_FRAMING_CAROUSEL_COVER = `FRAMING: formato vertical 4:5. Composición que tenga el sujeto principal en el tercio superior del frame, dejando los dos tercios inferiores con "breathing room" (fondo difuminado, paisaje deportivo, piso, grass). Ese espacio inferior se cubrirá con un overlay oscuro y el titular HTML superpuesto.`;

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
