import { describe, it, expect } from "vitest";
import { composeFranchiseSystemPrompt, buildFranchiseUserPrompt } from "./compose-franchise";
import { ARGO_FRANCHISES, getArgoFranchises, ARGO_WEEKLY_FRANCHISES } from "@/lib/franchises/argo";

const weekly = getArgoFranchises(ARGO_WEEKLY_FRANCHISES);

describe("composeFranchiseSystemPrompt", () => {
  const prompt = composeFranchiseSystemPrompt({
    voicePrompt: "VOICE_MARKER",
    franchises: weekly,
    recentPosts: [{ title: "Algo viejo", topic: "tema viejo", created_at: "2026-05-01T00:00:00Z" }],
  });

  it("includes the brand voice prompt verbatim", () => {
    expect(prompt).toContain("VOICE_MARKER");
  });

  it("lists each franchise with its name, tone and brief", () => {
    for (const f of weekly) {
      expect(prompt).toContain(f.name);
      expect(prompt).toContain(f.tone);
      expect(prompt).toContain(f.brief.slice(0, 24));
    }
  });

  it("includes the anti-repeat history block", () => {
    expect(prompt).toContain("Algo viejo");
    expect(prompt.toLowerCase()).toContain("no repetir");
  });

  it("does not inject the voseo language directive", () => {
    expect(prompt.toLowerCase()).not.toContain("voseo cuando");
  });
});

describe("buildFranchiseUserPrompt", () => {
  const user = buildFranchiseUserPrompt(weekly);

  it("asks for one piece per franchise in order", () => {
    weekly.forEach((f) => expect(user).toContain(f.slug));
  });

  it("specifies scenes for reels and slides for carousels with unit counts", () => {
    const reel = weekly.find((f) => f.format === "reel")!;
    const carousel = weekly.find((f) => f.format === "carousel")!;
    expect(user).toContain(`${reel.units} scenes`);
    expect(user).toContain(`${carousel.units} slides`);
  });

  it("forbids emojis and demands JSON only", () => {
    expect(user.toLowerCase()).toContain("emojis");
    expect(user).toContain('"pieces"');
  });
});
