import { describe, it, expect } from "vitest";
import { ARGO_V2_SYSTEM_PROMPT } from "./argo-v2";

describe("ARGO_V2_SYSTEM_PROMPT", () => {
  it("states the positioning line", () => {
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("understanding");
  });

  it("names the three tone registers", () => {
    for (const t of ["warm", "revealing", "direct"]) {
      expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain(t);
    }
  });

  it("includes the glossary and the blacklist", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("Odyssey");
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("accompanying adult");
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("talent");
  });

  it("is written in English", () => {
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("english");
  });

  it("pins the real site domain so the model does not invent one", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("argomethod.com");
  });

  it("contains no em dashes", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).not.toContain("—");
  });
});
