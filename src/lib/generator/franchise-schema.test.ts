import { describe, it, expect } from "vitest";
import { buildFranchiseBatchSchema } from "./franchise-schema";
import type { Franchise } from "@/lib/franchises/types";

const reel: Franchise = {
  slug: "r", name: "R", pillar: "metodo", tone: "revelador", format: "reel",
  platforms: ["instagram"], blotatoTemplateId: "t", units: 2, brief: "x".repeat(30),
};
const carousel: Franchise = {
  slug: "c", name: "C", pillar: "vinculo", tone: "calido", format: "carousel",
  platforms: ["instagram"], blotatoTemplateId: "t", units: 3, brief: "x".repeat(30),
};

function reelPiece() {
  return {
    franchise_slug: "r", format: "reel", title: "Hook", caption: "Caption largo",
    hashtags: ["#a"], cta: "Segui a Argo",
    scenes: [
      { index: 1, script: "uno", image_prompt: "img uno" },
      { index: 2, script: "dos", image_prompt: "img dos" },
    ],
  };
}
function carouselPiece() {
  return {
    franchise_slug: "c", format: "carousel", title: "Hook", caption: "Caption",
    hashtags: ["#b"], cta: null,
    slides: [
      { index: 1, kind: "cover", title: "T", body: null },
      { index: 2, kind: "content", title: "T2", body: "b" },
      { index: 3, kind: "cta", title: "T3", body: "b" },
    ],
  };
}

describe("buildFranchiseBatchSchema", () => {
  const schema = buildFranchiseBatchSchema([reel, carousel]);

  it("accepts a valid batch (one piece per franchise, right order)", () => {
    const r = schema.safeParse({ run_summary: "ok", pieces: [reelPiece(), carouselPiece()] });
    expect(r.success).toBe(true);
  });

  it("rejects a reel missing scenes", () => {
    const bad = reelPiece();
    delete (bad as Record<string, unknown>).scenes;
    const r = schema.safeParse({ pieces: [bad, carouselPiece()] });
    expect(r.success).toBe(false);
  });

  it("rejects a reel with the wrong scene count", () => {
    const bad = reelPiece();
    bad.scenes = [{ index: 1, script: "uno", image_prompt: "img" }];
    const r = schema.safeParse({ pieces: [bad, carouselPiece()] });
    expect(r.success).toBe(false);
  });

  it("rejects a carousel missing slides", () => {
    const bad = carouselPiece();
    delete (bad as Record<string, unknown>).slides;
    const r = schema.safeParse({ pieces: [reelPiece(), bad] });
    expect(r.success).toBe(false);
  });

  it("rejects a piece whose franchise_slug is not in the batch", () => {
    const bad = reelPiece();
    bad.franchise_slug = "ghost";
    const r = schema.safeParse({ pieces: [bad, carouselPiece()] });
    expect(r.success).toBe(false);
  });

  it("rejects a wrong piece count", () => {
    const r = schema.safeParse({ pieces: [reelPiece()] });
    expect(r.success).toBe(false);
  });
});
