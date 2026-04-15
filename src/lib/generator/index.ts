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

interface GenerateBatchInput {
  systemPrompt: string;
  cadence: Cadence;
  manualIdea?: { text: string; format: PostFormat; notes?: string };
}

const SingleIdeaResponseSchema = z.object({
  run_summary: z.string().optional(),
  posts: z.array(GeneratedPostSchema).length(1),
});

const BATCH_USER_PROMPT = (cadence: Cadence) => {
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

DISTRIBUCIÓN OBLIGATORIA (${total} posts en total):
${lines.join("\n")}

Para cada post:
1. Elegí el pilar de contenido apropiado (debe coincidir con uno de los pilares definidos arriba).
2. Escribí un \`topic\` corto y atómico (1 oración) que describa el ángulo único del post — esto se usa para anti-repetición.
3. Escribí \`title\` (hook), \`copy\` (cuerpo completo listo para publicar), \`hashtags\` (array), \`cta\`.
4. Elegí \`visual_template_slug\` de la lista de templates disponibles para ese formato — el slug debe matchear semánticamente con el contenido.
5. Llená \`visual_variables\` siguiendo ESTRICTAMENTE estas reglas por campo:
   - \`title\` (REQUERIDO): el texto principal que va EN LA IMAGEN. **Máximo 8 palabras, idealmente 3-6.** Es un HOOK visual, no una oración explicativa. Ejemplos buenos: "Product judgment > velocity", "El roadmap es una hipótesis", "Shape". Ejemplos malos: "Agregar features sin medir retention es tapar agujeros" (demasiado largo, va en body_text).
   - \`subtitle\` (OPCIONAL): frase corta de contexto (máx 12 palabras).
   - \`body_text\` (OPCIONAL): texto de soporte (máx 30 palabras) para bloque de body. Si el título ya dice todo, dejá este campo vacío.
   - \`accent\`, \`pillar\`, \`scene_hint\`: metadata opcional.

   IMPORTANTE: El \`copy\` del post (nivel post) es el caption largo que acompaña la imagen en IG/LI. Pero \`visual_variables.title\` es el texto EN LA IMAGEN y tiene que ser corto.
6. Para carruseles (ig_carousel o li_carousel), llená \`slides[]\` con exactamente ${cadence.carousel_slides} slides en el orden: cover → ${Array(cadence.carousel_slides - 2).fill("content").join(" → ")} → cta. Cada slide tiene \`{index, kind, title, body, visual_hint}\`. **slides[].title sigue la misma regla: máximo 8 palabras, hook visual.** El texto largo va en slides[].body. \`index\` empieza en 1 (no en 0).

REGLA DE VARIEDAD DE ESTILOS (OBLIGATORIA):
**Cuando tengas múltiples posts del mismo formato, DEBEN usar visual_template_slug DIFERENTES.** Ejemplo: si hay 2 posts ig_feed, el primero usa un slug y el segundo usa OTRO. Nunca el mismo slug dos veces en el mismo formato. Esto asegura variedad visual en cada tanda.

REGLA DE ESCAPE: si tu copy contiene comillas dobles, escapalas con backslash (\\"). Si contiene saltos de línea dentro de strings, usá \\n en lugar de newlines literales.

REGLA DURA: respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks, sin texto antes o después) con este shape:

{
  "run_summary": "string corto sobre el ángulo general del batch",
  "posts": [ ...${total} posts respetando la distribución de arriba ]
}`;
};

const SINGLE_IDEA_USER_PROMPT = (input: NonNullable<GenerateBatchInput["manualIdea"]>) => `Generá UN SOLO post de formato \`${input.format}\` basado en la siguiente idea del usuario:

"""
${input.text}
"""

${input.notes ? `Notas adicionales: ${input.notes}` : ""}

Mantené todo el contexto de marca, voz y reglas. ${input.format === "li_carousel" || input.format === "ig_carousel" ? "Como es carrusel, llená slides[] con 4 slides (cover → content → content → cta)." : ""}

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
  // For batch mode, validate against the exact cadence expected by this tenant.
  // For single mode, any 1-post response is valid.
  const schema = isSingle ? SingleIdeaResponseSchema : buildBatchSchema(input.cadence);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system:
          input.systemPrompt +
          (attempt > 0
            ? `\n\nIMPORTANTE: Tu respuesta anterior tuvo este error de validación: ${String(lastError)}. Corregilo.`
            : ""),
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");

      const json = extractJson(text);
      const parsed = schema.parse(json);
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
