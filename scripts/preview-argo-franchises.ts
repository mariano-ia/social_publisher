import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { generateFranchiseBatch } from "@/lib/generator/franchise-generate";
import { ARGO_V2_SYSTEM_PROMPT } from "@/lib/prompts/argo-v2";
import { getArgoFranchises, ARGO_WEEKLY_FRANCHISES } from "@/lib/franchises/argo";

async function main() {
  const franchises = getArgoFranchises(ARGO_WEEKLY_FRANCHISES);
  console.log(`Generating ${franchises.length} pieces for Argo weekly plan...\n`);

  const { parsed, retryCount } = await generateFranchiseBatch({
    voicePrompt: ARGO_V2_SYSTEM_PROMPT,
    franchises,
    recentPosts: [],
  });

  console.log(`retryCount: ${retryCount}`);
  console.log(`run_summary: ${parsed.run_summary ?? "(none)"}\n`);
  for (const piece of parsed.pieces) {
    console.log("─".repeat(70));
    console.log(`[${piece.franchise_slug}] (${piece.format})  ${piece.title}`);
    console.log(`caption: ${piece.caption}`);
    console.log(`cta: ${piece.cta ?? "—"}  hashtags: ${piece.hashtags.join(" ")}`);
    if (piece.scenes) piece.scenes.forEach((s) => console.log(`  scene ${s.index}: ${s.script}  [img: ${s.image_prompt}]`));
    if (piece.slides) piece.slides.forEach((s) => console.log(`  slide ${s.index} (${s.kind}): ${s.title ?? ""} — ${s.body ?? ""}`));
  }
  console.log("─".repeat(70));
  console.log("\nFull JSON:\n");
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch((err) => {
  console.error("preview failed:", err);
  process.exit(1);
});
