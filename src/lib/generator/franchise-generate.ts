import Anthropic from "@anthropic-ai/sdk";
import type { Franchise } from "@/lib/franchises/types";
import {
  composeFranchiseSystemPrompt,
  buildFranchiseUserPrompt,
  type FranchiseRecentPost,
} from "@/lib/prompts/compose-franchise";
import { buildFranchiseBatchSchema, type FranchiseBatchResponse } from "./franchise-schema";
import { extractJson, stripEmojisDeep } from "./json-utils";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 8000;

// Lazy client so the module is import-safe before env is loaded. The CLI
// preview script loads .env.local AFTER imports are hoisted, so constructing
// the client at module load (like index.ts does for the Next runtime) would
// read an undefined ANTHROPIC_API_KEY. Reading it at call time avoids that.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface GenerateFranchiseBatchInput {
  voicePrompt: string;
  franchises: Franchise[];
  recentPosts: FranchiseRecentPost[];
}

export interface FranchiseCallResult {
  parsed: FranchiseBatchResponse;
  retryCount: number;
}

export async function generateFranchiseBatch(
  input: GenerateFranchiseBatchInput,
): Promise<FranchiseCallResult> {
  const systemPrompt = composeFranchiseSystemPrompt({
    voicePrompt: input.voicePrompt,
    franchises: input.franchises,
    recentPosts: input.recentPosts,
  });
  const userPrompt = buildFranchiseUserPrompt(input.franchises);
  const schema = buildFranchiseBatchSchema(input.franchises);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const retryNote =
        attempt > 0
          ? `\n\nIMPORTANTE: tu respuesta anterior fallo la validacion: ${String(lastError)}. Corrigela.`
          : "";
      const response = await getClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt + retryNote,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");

      const json = extractJson(text);
      const sanitized = stripEmojisDeep(json);
      const parsed = schema.parse(sanitized);
      return { parsed: parsed as FranchiseBatchResponse, retryCount: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === 1) throw err;
    }
  }
  throw new Error("Unreachable");
}
