import { describe, it, expect } from "vitest";
import { ARGO_FRANCHISES, ARGO_WEEKLY_FRANCHISES } from "./argo";

describe("ARGO_FRANCHISES", () => {
  it("defines exactly 6 franchises", () => {
    expect(ARGO_FRANCHISES).toHaveLength(6);
  });

  it("has unique slugs", () => {
    const slugs = ARGO_FRANCHISES.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every franchise has valid pillar, tone, format and units > 0", () => {
    for (const f of ARGO_FRANCHISES) {
      expect(["bond", "method", "myths", "product"]).toContain(f.pillar);
      expect(["warm", "revealing", "direct"]).toContain(f.tone);
      expect(["reel", "carousel"]).toContain(f.format);
      expect(f.units).toBeGreaterThan(0);
      expect(f.platforms.length).toBeGreaterThan(0);
      expect(f.brief.length).toBeGreaterThan(20);
    }
  });

  it("briefs and names contain no em dashes", () => {
    for (const f of ARGO_FRANCHISES) {
      expect(f.brief).not.toContain("—");
      expect(f.name).not.toContain("—");
    }
  });
});

describe("ARGO_WEEKLY_FRANCHISES", () => {
  it("has 5 entries that all exist in ARGO_FRANCHISES", () => {
    expect(ARGO_WEEKLY_FRANCHISES).toHaveLength(5);
    const known = new Set(ARGO_FRANCHISES.map((f) => f.slug));
    for (const slug of ARGO_WEEKLY_FRANCHISES) {
      expect(known.has(slug)).toBe(true);
    }
  });

  it("uses the expected English slugs", () => {
    expect(ARGO_WEEKLY_FRANCHISES).toEqual([
      "60-seconds-of-method",
      "letter-to-a-sports-parent",
      "inside-the-mind",
      "myth-vs-fact",
      "the-small-shift",
    ]);
  });
});
