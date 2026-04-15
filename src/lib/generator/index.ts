import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import {
  BatchResponseSchema,
  buildBatchSchema,
  GeneratedPostSchema,
  type BatchResponse,
} from "./schema";
import { z } from "zod";
import type { PostFormat, Cadence } from "@/lib/db/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 8000;

export type OutputLanguage = "es" | "en";

interface GenerateBatchInput {
  systemPrompt: string;
  cadence: Cadence;
  language: OutputLanguage;
  manualIdea?: { text: string; format: PostFormat; notes?: string };
}

const SingleIdeaResponseSchema = z.object({
  run_summary: z.string().optional(),
  posts: z.array(GeneratedPostSchema).length(1),
});

const BATCH_USER_PROMPT_ES = (cadence: Cadence) => {
  const total = cadence.ig_feed + cadence.li_single + cadence.li_carousel + cadence.ig_carousel;
  const lines: string[] = [];
  if (cadence.ig_feed > 0)
    lines.push(`- ${cadence.ig_feed} posts de **Instagram feed** (\`format: "ig_feed"\`)`);
  if (cadence.li_single > 0)
    lines.push(`- ${cadence.li_single} posts single de **LinkedIn** (\`format: "li_single"\`)`);
  if (cadence.li_carousel > 0)
    lines.push(
      `- ${cadence.li_carousel} ${cadence.li_carousel === 1 ? "carrusel" : "carruseles"} de **LinkedIn** (\`format: "li_carousel"\`), cada uno con exactamente ${cadence.carousel_slides} slides en orden: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta`,
    );
  if (cadence.ig_carousel > 0)
    lines.push(
      `- ${cadence.ig_carousel} ${cadence.ig_carousel === 1 ? "carrusel" : "carruseles"} de **Instagram** (\`format: "ig_carousel"\`), cada uno con exactamente ${cadence.carousel_slides} slides en orden: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta`,
    );

  return `Generá ahora una tanda nueva de posts para esta marca, respetando voz, vocabulario, pilares y reglas de no-repetición.

PROHIBIDO ABSOLUTO — EMOJIS Y SÍMBOLOS DECORATIVOS:
Ningún campo del JSON puede contener emojis, iconos, símbolos unicode decorativos ni caracteres pictográficos. Esto incluye title, copy, topic, cta, hashtags, visual_variables (title/subtitle/body_text), slides[].title, slides[].body, run_summary. Sin excepciones. El render runtime no tiene fuente de emojis y los rompe visualmente.

DISTRIBUCIÓN OBLIGATORIA (${total} posts en total):
${lines.join("\n")}

Para cada post:
1. Elegí el pilar de contenido apropiado (debe coincidir con uno de los pilares definidos arriba).
2. Escribí un \`topic\` corto y atómico (1 oración) que describa el ángulo único del post — esto se usa para anti-repetición.
3. Escribí \`title\` (hook), \`copy\` (cuerpo completo listo para publicar), \`hashtags\` (array), \`cta\`.
4. Elegí \`visual_template_slug\` de la lista de templates disponibles para ese formato — el slug debe matchear semánticamente con el contenido.
5. Llená \`visual_variables\` siguiendo ESTRICTAMENTE estas reglas por campo:
   - \`title\` (REQUERIDO): el texto principal que va EN LA IMAGEN. **Máximo 8 palabras, idealmente 3-6.** Es un HOOK visual, no una oración explicativa.
   - \`subtitle\` (OPCIONAL): frase corta de contexto (máx 12 palabras).
   - \`body_text\` (OPCIONAL): texto de soporte (máx 30 palabras) para bloque de body. Si el título ya dice todo, dejá este campo vacío.
   - \`accent\`, \`pillar\`, \`scene_hint\`: metadata opcional.

   IMPORTANTE: El \`copy\` del post (nivel post) es el caption largo que acompaña la imagen en IG/LI. Pero \`visual_variables.title\` es el texto EN LA IMAGEN y tiene que ser corto.
6. Para carruseles (ig_carousel o li_carousel), llená \`slides[]\` con exactamente ${cadence.carousel_slides} slides en el orden: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta. Cada slide tiene \`{index, kind, title, body, visual_hint}\`. **slides[].title sigue la misma regla: máximo 8 palabras, hook visual.** El texto largo va en slides[].body. \`index\` empieza en 1 (no en 0).

REGLA DE VARIEDAD DE ESTILOS (OBLIGATORIA):
**Cuando tengas múltiples posts del mismo formato, DEBEN usar visual_template_slug DIFERENTES.**

REGLA DE ESCAPE: si tu copy contiene comillas dobles, escapalas con backslash (\\"). Si contiene saltos de línea dentro de strings, usá \\n en lugar de newlines literales.

REGLA DURA: respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks, sin texto antes o después) con este shape:

{
  "run_summary": "string corto sobre el ángulo general del batch",
  "posts": [ ...${total} posts respetando la distribución de arriba ]
}`;
};

const BATCH_USER_PROMPT_EN = (cadence: Cadence) => {
  const total = cadence.ig_feed + cadence.li_single + cadence.li_carousel + cadence.ig_carousel;
  const lines: string[] = [];
  if (cadence.ig_feed > 0)
    lines.push(`- ${cadence.ig_feed} **Instagram feed** posts (\`format: "ig_feed"\`)`);
  if (cadence.li_single > 0)
    lines.push(`- ${cadence.li_single} single **LinkedIn** posts (\`format: "li_single"\`)`);
  if (cadence.li_carousel > 0)
    lines.push(
      `- ${cadence.li_carousel} **LinkedIn** ${cadence.li_carousel === 1 ? "carousel" : "carousels"} (\`format: "li_carousel"\`), each with exactly ${cadence.carousel_slides} slides in order: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta`,
    );
  if (cadence.ig_carousel > 0)
    lines.push(
      `- ${cadence.ig_carousel} **Instagram** ${cadence.ig_carousel === 1 ? "carousel" : "carousels"} (\`format: "ig_carousel"\`), each with exactly ${cadence.carousel_slides} slides in order: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta`,
    );

  return `Generate a new batch of posts for this brand now — in ENGLISH — following its voice, vocabulary, pillars and anti-repeat rules.

STRICTLY FORBIDDEN — NO EMOJIS OR DECORATIVE SYMBOLS:
No field of the JSON may contain emojis, icons, decorative unicode symbols or pictographic characters. This includes title, copy, topic, cta, hashtags, visual_variables (title/subtitle/body_text), slides[].title, slides[].body, run_summary. No exceptions. The runtime renderer has no emoji font and breaks them visually.

REQUIRED DISTRIBUTION (${total} posts total):
${lines.join("\n")}

For each post:
1. Pick the appropriate content pillar (must match one of the pillars defined above).
2. Write a short atomic \`topic\` (1 sentence) describing the unique angle of the post — used for anti-repeat.
3. Write \`title\` (hook), \`copy\` (full body, ready to publish), \`hashtags\` (array), \`cta\`.
4. Pick \`visual_template_slug\` from the list of templates available for that format — the slug must match semantically.
5. Fill \`visual_variables\` following these rules STRICTLY per field:
   - \`title\` (REQUIRED): the main text that goes ON the image. **Max 8 words, ideally 3-6.** It's a visual HOOK, not an explanatory sentence. Good: "Product judgment > velocity", "The roadmap is a hypothesis", "Shape". Bad: long full sentences (those belong in body_text).
   - \`subtitle\` (OPTIONAL): short context phrase (max 12 words).
   - \`body_text\` (OPTIONAL): supporting text (max 30 words) for a body block. If the title says it all, leave this empty.
   - \`accent\`, \`pillar\`, \`scene_hint\`: optional metadata.

   IMPORTANT: The post-level \`copy\` is the long caption that accompanies the image on IG/LI. But \`visual_variables.title\` is the text ON the image and must be short.
6. For carousels (ig_carousel or li_carousel), fill \`slides[]\` with exactly ${cadence.carousel_slides} slides in order: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta. Each slide has \`{index, kind, title, body, visual_hint}\`. **slides[].title follows the same rule: max 8 words, visual hook.** Long text belongs in slides[].body. \`index\` starts at 1 (not 0).

STYLE VARIETY RULE (MANDATORY):
**When you have multiple posts of the same format, they MUST use DIFFERENT visual_template_slug values.** Never repeat the same slug twice within the same format — ensures visual variety across the batch.

ESCAPE RULE: if your copy contains double quotes, escape them with backslash (\\"). If it contains line breaks inside strings, use \\n instead of literal newlines.

HARD RULE: respond with VALID JSON ONLY (no markdown, no backticks, no text before or after) with this shape:

{
  "run_summary": "short string about the overall angle of the batch",
  "posts": [ ...${total} posts following the distribution above ]
}

REMINDER: all copy, titles, hashtags, CTAs, slide text and topic descriptions must be in ENGLISH.`;
};

const SINGLE_IDEA_USER_PROMPT_ES = (input: NonNullable<GenerateBatchInput["manualIdea"]>) => `Generá UN SOLO post de formato \`${input.format}\` basado en la siguiente idea del usuario:

"""
${input.text}
"""

${input.notes ? `Notas adicionales: ${input.notes}` : ""}

Mantené todo el contexto de marca, voz y reglas. ${input.format === "li_carousel" || input.format === "ig_carousel" ? "Como es carrusel, llená slides[] con 4 slides (cover → content → content → cta)." : ""}

PROHIBIDO: ningún campo puede contener emojis, iconos ni símbolos unicode decorativos. Sin excepciones.

Respondé ÚNICAMENTE con un JSON válido con este shape:
{
  "run_summary": "string corto",
  "posts": [ ...1 post solamente ]
}`;

const SINGLE_IDEA_USER_PROMPT_EN = (input: NonNullable<GenerateBatchInput["manualIdea"]>) => `Generate ONE \`${input.format}\` post — in ENGLISH — based on the following user idea:

"""
${input.text}
"""

${input.notes ? `Additional notes: ${input.notes}` : ""}

Keep all brand context, voice and rules. ${input.format === "li_carousel" || input.format === "ig_carousel" ? "Since it's a carousel, fill slides[] with 4 slides (cover → content → content → cta)." : ""}

FORBIDDEN: no field may contain emojis, icons or decorative unicode symbols. No exceptions.

Respond with VALID JSON ONLY with this shape:
{
  "run_summary": "short string",
  "posts": [ ...1 post only ]
}

REMINDER: all output must be in ENGLISH.`;

const BATCH_USER_PROMPT = (cadence: Cadence, language: OutputLanguage) =>
  language === "en" ? BATCH_USER_PROMPT_EN(cadence) : BATCH_USER_PROMPT_ES(cadence);

const SINGLE_IDEA_USER_PROMPT = (
  input: NonNullable<GenerateBatchInput["manualIdea"]>,
  language: OutputLanguage,
) => (language === "en" ? SINGLE_IDEA_USER_PROMPT_EN(input) : SINGLE_IDEA_USER_PROMPT_ES(input));

interface CallResult<T> {
  parsed: T;
  retryCount: number;
}

export async function generateBatch(input: GenerateBatchInput): Promise<CallResult<BatchResponse>> {
  const userPrompt = input.manualIdea
    ? SINGLE_IDEA_USER_PROMPT(input.manualIdea, input.language)
    : BATCH_USER_PROMPT(input.cadence, input.language);

  const isSingle = !!input.manualIdea;
  // For batch mode, validate against the exact cadence expected by this tenant.
  // For single mode, any 1-post response is valid.
  const schema = isSingle ? SingleIdeaResponseSchema : buildBatchSchema(input.cadence);

  const retryNote =
    input.language === "en"
      ? (msg: string) => `\n\nIMPORTANT: your previous response failed validation: ${msg}. Fix it.`
      : (msg: string) => `\n\nIMPORTANTE: Tu respuesta anterior tuvo este error de validación: ${msg}. Corregilo.`;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: input.systemPrompt + (attempt > 0 ? retryNote(String(lastError)) : ""),
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");

      const json = extractJson(text);
      const sanitized = stripEmojisDeep(json);
      const parsed = schema.parse(sanitized);
      return { parsed: parsed as BatchResponse, retryCount: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === 1) throw err;
    }
  }
  throw new Error("Unreachable");
}

// Silence unused warning — kept for external imports.
void BatchResponseSchema;

/**
 * Strip emojis and decorative unicode pictographs from any string field,
 * recursively. The runtime puppeteer uses @sparticuz/chromium-min which
 * ships without an emoji font — any emoji Claude emits otherwise renders
 * as a "tofu" placeholder box (a vertical black pill with the unicode
 * name inside). This is a belt-and-suspenders safety net on top of the
 * explicit "no emojis" rule in the user prompt.
 */
const EMOJI_RE = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

function stripEmojisDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(EMOJI_RE, "").replace(/[ \t]{2,}/g, " ").trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripEmojisDeep);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripEmojisDeep(v);
    }
    return out;
  }
  return value;
}

/**
 * Parse Claude's response as JSON, with escalating recovery strategies:
 *   1. Direct JSON.parse after stripping markdown fences.
 *   2. Slice from first `{` to last `}` and parse again.
 *   3. Run jsonrepair on the slice — fixes unescaped quotes, missing
 *      commas, trailing commas, single quotes, raw newlines inside
 *      strings, etc. These are the common LLM JSON failure modes.
 */
function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Attempt 1: straight parse
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }

  // Attempt 2: slice from first { to last }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Claude response did not contain JSON");
  }
  const sliced = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(sliced);
  } catch {
    /* fall through */
  }

  // Attempt 3: repair common LLM JSON mistakes
  try {
    const repaired = jsonrepair(sliced);
    return JSON.parse(repaired);
  } catch (err) {
    throw new Error(
      `Unable to parse Claude response as JSON even after repair: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
