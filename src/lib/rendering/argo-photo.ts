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
 * Subjects: pre-teen student athletes at a school or club sports program,
 * explicitly mixed gender (boys AND girls), always supervised by coaches in
 * an educational context. Sports Illustrated documentary style.
 *
 * Moderation-safe phrasing: "young student-athletes at a school sports
 * program" reliably passes OpenAI moderation where "niños" or specific ages
 * sometimes trip it.
 */
const STYLE_BASE_PHOTO_ONLY = `Editorial documentary photography in full color, sports reportage style.

CONTEXT: training and sports activities inside schools or youth sports academies. The subjects are YOUNG STUDENT-ATHLETES (pre-teens, around 9 to 12 years old) together with their coaches, in a formal school or club sports setting. The scene takes place in real sports spaces — school gymnasium, athletic field, basketball court, soccer pitch, indoor training hall.

MIXED GENDER (MANDATORY): the athletes shown MUST include BOTH boys and girls together in the same frame whenever multiple subjects are present. Mixed-gender youth sports teams are the default. When the scene features only one athlete, alternate between a girl and a boy across different generations of this prompt. Never show an all-boys group.

NARRATIVE FOCUS: a professional interaction between a coach and one or more student-athletes during a training activity. Natural teaching gestures, technique demonstration, a short conversation about a play, movement analysis. The captured moment is a real learning situation, never a posed portrait.

AESTHETIC: Sports Illustrated feature photography, editorial photojournalism, documentary look. Author-level quality — never stock photo, never corporate imagery, never a "polished AI" aesthetic.

CAMERA AND LENS: 35mm or 50mm at f/1.8–2.8. Natural depth of field with soft organic bokeh. Rule-of-thirds composition — the main subject is NOT centered, it sits in the first or second third of the frame. Focus may rest on hands, on a piece of equipment, on an object in the surroundings — not always on the face.

LIGHT: natural, from a real sports environment. Diffused gym light, side light from an outdoor field, golden-hour afternoon training. Natural shadows. NO uniform studio lighting. Slightly shaded areas or slightly blown highlights are acceptable if they match the moment.

REAL IMPERFECTION: subtle 35mm film grain, light motion blur on secondary elements, imperfect environmental details (a water bottle on the floor, a towel, a worn court line). The image must feel captured in the moment, not produced in a studio.

COLOR: natural rendering with subtle warm tones. NO boosted saturation, NO Instagram-filter look, NO HDR. Like printed magazine paper from a sports publication.

COMPOSITION: elements at the edges may crop naturally — not everything needs to be perfectly framed. Leave "negative space" (smoother areas, blurred background, floor, wall) where the HTML text will be composited later.

STRICTLY FORBIDDEN:
- NO visible text in the image (no words, no letters, no logos, no numbers, no signs)
- NO UI graphic elements (chips, pills, buttons, boxes, overlays)
- NO real or fictional sports brand logos
- NO icons, decorative graphics or illustrations
- NO frames or borders around the image
- NO aggressive physical competition (no hard tackles, no violent contact)
- NO close-ups tightly framed on children's faces — always contextual, coach present or wider framing

The image is ONLY the editorial photograph. All UI is added later in code.`;

const PHOTO_FRAMING_SINGLE_IG = `FRAMING: 1:1 square format. Main subjects in the lower half of the frame so there is negative space up top for the header. Plenty of breathing room around the subjects.`;

const PHOTO_FRAMING_SINGLE_LI = `FRAMING: 3:2 horizontal format. Subjects shifted toward the left of the frame with the right 30% relatively empty (sports landscape, blurred background) so the HTML panel can overlay on the right.`;

const PHOTO_FRAMING_CAROUSEL_COVER = `FRAMING: 4:5 vertical format. Composition with the main subject in the upper third of the frame, leaving the bottom two thirds as breathing room (blurred background, sports landscape, floor, grass). That bottom area will be covered by a dark overlay with the HTML headline on top.`;

const PILLAR_CONTEXT: Record<string, string> = {
  ciencia_metodologia:
    "A focused 1-on-1 conversation between a coach and a young student-athlete. A moment of technical analysis or concept explanation. Professional, attentive tone. Alternate the athlete's gender across generations — girls and boys equally.",
  educacion_deportiva:
    "A mixed-gender group of young student-athletes (boys AND girls together) in a training session with the coach guiding the activity. Technique demonstration, posture correction, a teaching moment. Controlled energy.",
  producto:
    "A coach reviewing a tablet or technical notebook alongside a young student-athlete. A moment of results review, performance analysis, reading information. Alternate the athlete's gender across generations.",
};

const FORMAT_DIMENSIONS: Record<PostFormat | "carousel_slide", { size: "1024x1024" | "1024x1536" | "1536x1024"; aspect: string }> = {
  ig_feed: { size: "1024x1024", aspect: "cuadrado 1:1" },
  ig_carousel: { size: "1024x1536", aspect: "vertical 2:3" },
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

${pillarHint ? `SCENE CONTEXT based on the content pillar: ${pillarHint}` : ""}
${input.scene_hint ? `ADDITIONAL SCENE DETAILS: ${input.scene_hint}` : ""}

FINAL REMINDER: The image is ONLY the photograph. Zero text, zero UI, zero logos. Subjects are young pre-teen student-athletes (mixed gender: boys AND girls) with their coaches in a school or sports academy setting. Graphic design is composited later in HTML over this photo.`;

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

${pillarHint ? `SCENE CONTEXT based on the content pillar: ${pillarHint}` : ""}
${input.scene_hint ? `ADDITIONAL SCENE DETAILS: ${input.scene_hint}` : ""}

FINAL REMINDER: The image is ONLY the photograph. Zero text, zero UI, zero logos. Subjects are young pre-teen student-athletes (mixed gender: boys AND girls) with their coaches in a school or sports academy setting. The carousel title and graphic elements are added later in HTML.`;

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
