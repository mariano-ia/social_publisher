import { jsonrepair } from "jsonrepair";

/**
 * Strip emojis and decorative unicode pictographs from any string field,
 * recursively. The runtime renderer ships without an emoji font, so any
 * emoji renders as a "tofu" box. Belt-and-suspenders on top of the explicit
 * "no emojis" rule in the user prompt.
 */
const EMOJI_RE = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

export function stripEmojisDeep(value: unknown): unknown {
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
 * Parse an LLM response as JSON, with escalating recovery:
 *   1. Direct JSON.parse after stripping markdown fences.
 *   2. Slice from first `{` to last `}` and parse again.
 *   3. Run jsonrepair on the slice (unescaped quotes, missing/trailing commas,
 *      single quotes, raw newlines inside strings, etc.).
 */
export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("LLM response did not contain JSON");
  }
  const sliced = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(sliced);
  } catch {
    /* fall through */
  }

  try {
    const repaired = jsonrepair(sliced);
    return JSON.parse(repaired);
  } catch (err) {
    throw new Error(
      `Unable to parse LLM response as JSON even after repair: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
