import type { Franchise } from "@/lib/franchises/types";

export interface FranchiseRecentPost {
  title: string | null;
  topic: string | null;
  created_at: string;
}

export interface ComposeFranchiseContext {
  /** The brand voice system prompt (e.g. ARGO_V2_SYSTEM_PROMPT). */
  voicePrompt: string;
  /** The franchises that make up this batch, in publish order. */
  franchises: Franchise[];
  recentPosts: FranchiseRecentPost[];
}

export function composeFranchiseSystemPrompt(ctx: ComposeFranchiseContext): string {
  const sections: string[] = [ctx.voicePrompt, ""];

  sections.push("## Franchises in this batch");
  sections.push(
    "Generate exactly one piece per franchise, in this order. Respect each one's tone register and format.",
  );
  sections.push("");
  ctx.franchises.forEach((f, i) => {
    const units = f.format === "reel" ? `${f.units} scenes` : `${f.units} slides`;
    sections.push(
      `${i + 1}. [${f.slug}] "${f.name}" — pillar: ${f.pillar} · tone: ${f.tone} · format: ${f.format} (${units})`,
    );
    sections.push(`   Brief: ${f.brief}`);
  });
  sections.push("");

  sections.push(buildHistorySection(ctx.recentPosts));

  return sections.join("\n");
}

function buildHistorySection(recent: FranchiseRecentPost[]): string {
  if (recent.length === 0) {
    return "## Recent posts\n(None yet. This is the first batch.)";
  }
  const lines = ["## Recent posts — DO NOT REPEAT topic or similar headline"];
  recent.forEach((p) => {
    const date = p.created_at.split("T")[0];
    lines.push(`- [${date}] "${p.title ?? "(no title)"}" — topic: ${p.topic ?? "(none)"}`);
  });
  lines.push("");
  lines.push("HARD RULE: do not repeat the same topic, angle or a headline similar to those in this list.");
  return lines.join("\n");
}

export function buildFranchiseUserPrompt(franchises: Franchise[]): string {
  const lines: string[] = [];
  franchises.forEach((f, i) => {
    const shape =
      f.format === "reel"
        ? `${f.units} scenes (each scene: {index, script, image_prompt}); script is short on-screen text, image_prompt describes the background image`
        : `${f.units} slides (each slide: {index, kind, title, body}); order: cover, content..., cta`;
    lines.push(`${i + 1}. franchise_slug="${f.slug}" · format="${f.format}" · ${shape}`);
  });

  return `Generate the weekly batch now: one piece per franchise, following the voice, tone, pillar and no-repeat rules.

PROHIBITED: no field may contain emojis, icons or decorative unicode symbols. No exceptions.

PIECES TO GENERATE (in this order):
${lines.join("\n")}

For each piece:
1. title: the visual hook, short (max 8 words).
2. caption: the long text ready to publish on IG/TikTok (can span multiple lines, use \\n).
3. hashtags: array of relevant hashtags (no emojis).
4. cta: short call to action (can be null).
5. If format="reel": fill scenes[] with the stated count. If format="carousel": fill slides[] with the stated count in cover, content..., cta order.

ESCAPE RULE: escape double quotes with backslash and use \\n instead of literal line breaks inside strings.

HARD RULE: respond ONLY with valid JSON (no markdown, no backticks, no text before or after) with this shape:

{
  "run_summary": "short string describing the general angle of the batch",
  "pieces": [ ...one piece per franchise, in the order above ]
}`;
}
