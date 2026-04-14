import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { BatchResponseSchema, SingleIdeaResponseSchema, type BatchResponse } from "./schema";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 8000;

interface GenerateBatchInput {
  systemPrompt: string;
  cadence: { ig_feed: number; li_single: number; li_carousel: number; carousel_slides: number };
  manualIdea?: { text: string; format: "ig_feed" | "li_single" | "li_carousel"; notes?: string };
}

const BATCH_USER_PROMPT = (cadence: GenerateBatchInput["cadence"]) => `Generá ahora una tanda nueva de posts para esta marca, respetando voz, vocabulario, pilares y reglas de no-repetición.

DISTRIBUCIÓN OBLIGATORIA (8 posts en total):
- ${cadence.ig_feed} posts de Instagram feed (\`format: "ig_feed"\`)
- ${cadence.li_single} posts single de LinkedIn (\`format: "li_single"\`)
- ${cadence.li_carousel} carruseles de LinkedIn (\`format: "li_carousel"\`), cada uno con exactamente ${cadence.carousel_slides} slides en este orden: cover → content → content → content → cta

Para cada post:
1. Elegí el pilar de contenido apropiado (debe coincidir con uno de los pilares definidos arriba).
2. Escribí un \`topic\` corto y atómico (1 oración) que describa el ángulo único del post — esto se usa para anti-repetición.
3. Escribí \`title\` (hook), \`copy\` (cuerpo completo listo para publicar), \`hashtags\` (array), \`cta\`.
4. Elegí \`visual_template_slug\` de la lista de templates disponibles para ese formato — el slug debe matchear semánticamente con el contenido del post.
5. Llená \`visual_variables\` con los campos universales del formato: \`{title, subtitle, body_text, accent, pillar, scene_hint}\`. No todos son obligatorios.
6. Para carruseles, llená \`slides[]\` con exactamente 5 slides en el orden \`cover → content×3 → cta\`. Cada slide tiene \`{index, kind, title, body, visual_hint}\`. IMPORTANTE: \`index\` empieza en 1 (no en 0). Los valores esperados son 1, 2, 3, 4, 5 — uno por slide en ese orden exacto.

REGLA DURA: respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks, sin texto antes o después) con este shape:

{
  "run_summary": "string corto sobre el ángulo general del batch",
  "posts": [ ...8 posts respetando la distribución de arriba ]
}

Variedad: dentro de cada formato, no repitas el mismo \`visual_template_slug\` dos veces seguidas. Variá los pilares.`;

const SINGLE_IDEA_USER_PROMPT = (input: NonNullable<GenerateBatchInput["manualIdea"]>) => `Generá UN SOLO post de formato \`${input.format}\` basado en la siguiente idea del usuario:

"""
${input.text}
"""

${input.notes ? `Notas adicionales: ${input.notes}` : ""}

Mantené todo el contexto de marca, voz y reglas. ${input.format === "li_carousel" ? "Como es carrusel, llená slides[] con 5 slides (cover → content×3 → cta)." : ""}

Respondé ÚNICAMENTE con un JSON válido con este shape:
{
  "run_summary": "string corto",
  "posts": [ ...1 post solamente ]
}`;

interface CallResult<T> {
  parsed: T;
  retryCount: number;
}

export async function generateBatch(input: GenerateBatchInput): Promise<CallResult<BatchResponse>> {
  const userPrompt = input.manualIdea
    ? SINGLE_IDEA_USER_PROMPT(input.manualIdea)
    : BATCH_USER_PROMPT(input.cadence);

  const isSingle = !!input.manualIdea;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: input.systemPrompt + (attempt > 0 ? `\n\nIMPORTANTE: Tu respuesta anterior tuvo este error de validación: ${String(lastError)}. Corregilo.` : ""),
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");

      const json = extractJson(text);
      const schema = isSingle ? SingleIdeaResponseSchema : BatchResponseSchema;
      const parsed = schema.parse(json);
      return { parsed: parsed as BatchResponse, retryCount: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === 1) throw err;
    }
  }
  throw new Error("Unreachable");
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
