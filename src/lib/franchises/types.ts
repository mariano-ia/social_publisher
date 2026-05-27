export type ToneRegister = "calido" | "revelador" | "directo";
export type FranchiseFormat = "reel" | "carousel";
export type Platform = "instagram" | "tiktok";
export type FranchisePillar = "vinculo" | "metodo" | "mitos" | "producto";

/**
 * A named recurring content series. `blotatoTemplateId` is metadata consumed in
 * Fase B (publishing); Fase A only needs it to round-trip. `units` is the number
 * of scenes (reel) or slides (carousel) the generator must produce for a piece.
 */
export interface Franchise {
  slug: string;
  name: string;
  pillar: FranchisePillar;
  tone: ToneRegister;
  format: FranchiseFormat;
  platforms: Platform[];
  blotatoTemplateId: string;
  units: number;
  /** One-paragraph instruction to the LLM about this franchise's angle. */
  brief: string;
}
