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

  sections.push("## Franquicias de esta tanda");
  sections.push(
    "Genera exactamente una pieza por franquicia, en este orden. Respeta el registro de tono y el formato de cada una.",
  );
  sections.push("");
  ctx.franchises.forEach((f, i) => {
    const units = f.format === "reel" ? `${f.units} scenes` : `${f.units} slides`;
    sections.push(
      `${i + 1}. [${f.slug}] "${f.name}" — pilar: ${f.pillar} · tono: ${f.tone} · formato: ${f.format} (${units})`,
    );
    sections.push(`   Brief: ${f.brief}`);
  });
  sections.push("");

  sections.push(buildHistorySection(ctx.recentPosts));

  return sections.join("\n");
}

function buildHistorySection(recent: FranchiseRecentPost[]): string {
  if (recent.length === 0) {
    return "## Publicaciones recientes\n(Ninguna todavia. Esta es la primera tanda.)";
  }
  const lines = ["## Publicaciones recientes — NO REPETIR tema ni titular similar"];
  recent.forEach((p) => {
    const date = p.created_at.split("T")[0];
    lines.push(`- [${date}] "${p.title ?? "(sin titulo)"}" — tema: ${p.topic ?? "—"}`);
  });
  lines.push("");
  lines.push("REGLA DURA: no repitas el mismo tema, angulo ni titular similar a los de esta lista.");
  return lines.join("\n");
}

export function buildFranchiseUserPrompt(franchises: Franchise[]): string {
  const lines: string[] = [];
  franchises.forEach((f, i) => {
    const shape =
      f.format === "reel"
        ? `${f.units} scenes (cada scene: {index, script, image_prompt}); script es texto corto en pantalla, image_prompt describe la imagen de fondo`
        : `${f.units} slides (cada slide: {index, kind, title, body}); orden: cover, content..., cta`;
    lines.push(`${i + 1}. franchise_slug="${f.slug}" · format="${f.format}" · ${shape}`);
  });

  return `Genera ahora la tanda de esta semana: una pieza por franquicia, respetando voz, tono, pilar y reglas de no repeticion.

PROHIBIDO: ningun campo puede contener emojis, iconos ni simbolos unicode decorativos. Sin excepciones.

PIEZAS A GENERAR (en este orden):
${lines.join("\n")}

Para cada pieza:
1. title: el hook visual, corto (maximo 8 palabras).
2. caption: el texto largo listo para publicar en IG/TikTok (puede tener varias lineas, usa \\n).
3. hashtags: array de hashtags relevantes (sin emojis).
4. cta: llamado a la accion breve (puede ser null).
5. Si format="reel": llena scenes[] con la cantidad indicada. Si format="carousel": llena slides[] con la cantidad indicada y el orden cover, content..., cta.

REGLA DE ESCAPE: escapa comillas dobles con backslash y usa \\n en vez de saltos de linea literales dentro de strings.

REGLA DURA: responde UNICAMENTE con un JSON valido (sin markdown, sin backticks, sin texto antes o despues) con este shape:

{
  "run_summary": "string corto sobre el angulo general de la tanda",
  "pieces": [ ...una pieza por franquicia, en el orden de arriba ]
}`;
}
