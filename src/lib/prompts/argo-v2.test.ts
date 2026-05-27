import { describe, it, expect } from "vitest";
import { ARGO_V2_SYSTEM_PROMPT } from "./argo-v2";

describe("ARGO_V2_SYSTEM_PROMPT", () => {
  it("states the positioning line", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("comprensión");
  });

  it("declares tuteo and forbids voseo", () => {
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("tuteo");
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("voseo");
  });

  it("names the three tone registers", () => {
    for (const t of ["cálido", "revelador", "directo"]) {
      expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain(t);
    }
  });

  it("includes the glossary and the blacklist", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("Odisea");
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("adulto acompañante");
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("talento");
  });

  it("requires correct Spanish orthography (accents + ñ)", () => {
    expect(ARGO_V2_SYSTEM_PROMPT.toLowerCase()).toContain("ortografía");
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("ñ");
  });

  it("pins the real site domain so the model does not invent one", () => {
    expect(ARGO_V2_SYSTEM_PROMPT).toContain("argomethod.com");
  });

  it("contains no voseo verb forms and no em dashes", () => {
    const voseo = /\b(podés|querés|tenés|hacés|mirá|hacé|poné|dejá|sentí|vení)\b/i;
    expect(ARGO_V2_SYSTEM_PROMPT).not.toMatch(voseo);
    expect(ARGO_V2_SYSTEM_PROMPT).not.toContain("—");
  });
});
