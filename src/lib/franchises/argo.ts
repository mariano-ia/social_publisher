import type { Franchise } from "./types";

/**
 * Blotato visual template ids (from blotato_list_visual_templates). Used in Fase B.
 */
const TEMPLATES = {
  aiStoryVideo: "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  whenXThenY: "/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1",
  tutorialCarousel: "/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1",
  imageSlideshowProminent: "/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1",
  igCarouselSlideshow: "53cfec04-2500-41cf-8cc1-ba670d2c341a",
} as const;

export const ARGO_FRANCHISES: Franchise[] = [
  {
    slug: "60-seconds-of-method",
    name: "60 Seconds of Method",
    pillar: "method",
    tone: "revealing",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.aiStoryVideo,
    units: 3,
    brief:
      "A micro educational nugget: explain one idea from the Argo method (a DISC axis, the motor, an archetype) applied to a concrete sports scene, in plain parent-friendly language. Revealing tone: state a non-obvious observation and make it clear. End by inviting the viewer to think differently, without selling.",
  },
  {
    slug: "letter-to-a-sports-parent",
    name: "Letter to a Sports Parent",
    pillar: "bond",
    tone: "warm",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.aiStoryVideo,
    units: 4,
    brief:
      "A short reflection addressed to a mom or dad about an everyday youth-sport scene (the kid who gets frustrated, who does not want to go to practice, who compares themselves). Warm, peer-to-peer, empathetic tone. Reframe the scene from understanding the child, never from scolding or pushing.",
  },
  {
    slug: "inside-the-mind",
    name: "Inside the Mind of...",
    pillar: "method",
    tone: "revealing",
    format: "carousel",
    platforms: ["instagram"],
    blotatoTemplateId: TEMPLATES.tutorialCarousel,
    units: 5,
    brief:
      "Explain an archetype or a trait (e.g. the kid who needs to know the why before doing) in parent-friendly language. Cover with the hook, content slides describing how they tend to behave and how to support them, and a close. Probabilistic language, no rigid labels.",
  },
  {
    slug: "myth-vs-fact",
    name: "Myth vs Fact",
    pillar: "myths",
    tone: "direct",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.whenXThenY,
    units: 3,
    brief:
      "Break a youth-sport myth (e.g. the shy kid is no good for team sports). Each scene contrasts the myth and the fact. Direct tone with a clear stance, but never aggressive or against the reader: question the belief, not the person who holds it.",
  },
  {
    slug: "the-small-shift",
    name: "The Small Shift",
    pillar: "bond",
    tone: "warm",
    format: "reel",
    platforms: ["instagram", "tiktok"],
    blotatoTemplateId: TEMPLATES.imageSlideshowProminent,
    units: 4,
    brief:
      "One concrete, small change in how the adult (parent or coach) talks to the kid, doable today. Warm and practical tone. One idea per piece, shown as a before and after of the phrase or gesture.",
  },
  {
    slug: "behind-the-odyssey",
    name: "Behind the Odyssey",
    pillar: "product",
    tone: "warm",
    format: "carousel",
    platforms: ["instagram"],
    blotatoTemplateId: TEMPLATES.igCarouselSlideshow,
    units: 5,
    brief:
      "Show what Argo is without sounding like a sales pitch: what the Odyssey experience is like for the kid and what the adult receives. Warm, curious tone. Focus on the bond and understanding, not performance. Use the glossary (Odyssey, Profile, accompanying adult).",
  },
];

/** The Monday-to-Friday weekly batch (product runs separately, biweekly). */
export const ARGO_WEEKLY_FRANCHISES: string[] = [
  "60-seconds-of-method",
  "letter-to-a-sports-parent",
  "inside-the-mind",
  "myth-vs-fact",
  "the-small-shift",
];

export function getArgoFranchises(slugs: string[]): Franchise[] {
  return slugs.map((slug) => {
    const f = ARGO_FRANCHISES.find((x) => x.slug === slug);
    if (!f) throw new Error(`Unknown Argo franchise: ${slug}`);
    return f;
  });
}
