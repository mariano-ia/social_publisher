import type { BrandVoiceVersion, Tenant, VisualTemplate } from "@/lib/db/types";

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  authority: "Experto, confiable, basado en datos. Voz educativa y precisa.",
  innovator: "Visionario, futuro, disruptivo. Voz que provoca curiosidad y cambia paradigmas.",
  friend: "Cálido, accesible, empático. Voz conversacional e inclusiva.",
  rebel: "Audaz, contrarian, irreverente. Voz directa y opinionada.",
  guide: "Sabio, paciente, metódico. Voz instruccional y de apoyo.",
};

const DIMENSION_LABELS: Record<string, [string, string]> = {
  formal_casual: ["Formal", "Casual"],
  serious_playful: ["Serio", "Playful"],
  technical_simple: ["Técnico", "Simple"],
  reserved_bold: ["Reservado", "Bold"],
};

interface RecentPostSummary {
  title: string | null;
  topic: string | null;
  pillar: string | null;
  format: string;
  created_at: string;
}

export interface ComposeContext {
  tenant: Tenant;
  voice: BrandVoiceVersion;
  recentPosts: RecentPostSummary[];
  templates: VisualTemplate[];
}

/**
 * Build the full system prompt for Claude. If the voice version has
 * `system_prompt_override` set, that string is used verbatim and the
 * structured form fields are ignored. Otherwise compose from form data.
 */
export function composeSystemPrompt(ctx: ComposeContext): string {
  const { tenant, voice, recentPosts, templates } = ctx;

  // Override path: use legacy/hand-written prompt verbatim
  if (voice.system_prompt_override && voice.system_prompt_override.trim().length > 0) {
    return [
      voice.system_prompt_override,
      "",
      buildHistorySection(recentPosts),
      "",
      buildTemplatesSection(templates, tenant),
    ].join("\n");
  }

  // Structured composition
  const sections: string[] = [];

  // 1. Identity
  sections.push(`# ${tenant.name} — Departamento de contenido`);
  sections.push("");
  sections.push(`Sos el departamento de contenido de ${tenant.name}.`);
  if (tenant.website_url) sections.push(`Sitio: ${tenant.website_url}`);
  if (voice.archetype) {
    sections.push(`Arquetipo: ${voice.archetype} — ${ARCHETYPE_DESCRIPTIONS[voice.archetype] ?? ""}`);
  }
  sections.push("");

  // 2. Voice dimensions
  if (voice.dimensions && Object.keys(voice.dimensions).length > 0) {
    sections.push("## Dimensiones de voz (1=A · 10=B)");
    for (const [key, value] of Object.entries(voice.dimensions)) {
      const labels = DIMENSION_LABELS[key];
      if (labels && typeof value === "number") {
        sections.push(`- ${labels[0]} ↔ ${labels[1]}: ${value}/10`);
      }
    }
    sections.push("");
  }

  // 3. Voice IS / IS NOT
  if (voice.voice_is.length > 0 || voice.voice_is_not.length > 0) {
    sections.push("## Carácter de la voz");
    if (voice.voice_is.length > 0) sections.push(`Nuestra voz ES: ${voice.voice_is.join(", ")}`);
    if (voice.voice_is_not.length > 0) sections.push(`Nuestra voz NO ES: ${voice.voice_is_not.join(", ")}`);
    sections.push("");
  }

  // 4. Vocabulary
  if (voice.vocabulary_use.length > 0 || voice.vocabulary_avoid.length > 0 || voice.signature_phrases.length > 0) {
    sections.push("## Vocabulario");
    if (voice.vocabulary_use.length > 0) sections.push(`Palabras a usar: ${voice.vocabulary_use.join(", ")}`);
    if (voice.vocabulary_avoid.length > 0) sections.push(`Palabras a evitar: ${voice.vocabulary_avoid.join(", ")}`);
    if (voice.signature_phrases.length > 0) sections.push(`Frases firma: ${voice.signature_phrases.join(" · ")}`);
    sections.push("");
  }

  // 5. Language rules
  if (voice.language_rules) {
    sections.push("## Reglas de idioma");
    sections.push(voice.language_rules);
    sections.push("");
  }

  // 6. Do's and Don'ts
  if (voice.dos.length > 0 || voice.donts.length > 0) {
    sections.push("## Reglas de escritura");
    if (voice.dos.length > 0) {
      sections.push("**DO:**");
      voice.dos.forEach((d) => sections.push(`- ${d}`));
    }
    if (voice.donts.length > 0) {
      sections.push("**DON'T:**");
      voice.donts.forEach((d) => sections.push(`- ${d}`));
    }
    sections.push("");
  }

  // 7. Pillars
  if (voice.pillars.length > 0) {
    sections.push("## Pilares de contenido");
    voice.pillars.forEach((p, i) => {
      const w = p.weight ? ` (peso ${p.weight})` : "";
      sections.push(`${i + 1}. **${p.name}**${w}${p.description ? ` — ${p.description}` : ""}`);
    });
    sections.push("");
  }

  // 8. Monthly themes
  if (voice.monthly_themes.length > 0) {
    sections.push("## Temas mensuales (rotar)");
    voice.monthly_themes.forEach((t) => sections.push(`- ${t}`));
    sections.push("");
  }

  // 9. Few-shot samples
  if (voice.sample_copy.length > 0) {
    sections.push("## Ejemplos del estilo correcto");
    voice.sample_copy.forEach((s) => {
      sections.push(`[${s.context}]`);
      sections.push(s.sample);
      sections.push("");
    });
  }

  // 10. History (anti-repeat) and templates
  sections.push(buildHistorySection(recentPosts));
  sections.push("");
  sections.push(buildTemplatesSection(templates, tenant));

  return sections.join("\n");
}

function buildHistorySection(recent: RecentPostSummary[]): string {
  if (recent.length === 0) {
    return "## Publicaciones recientes\n(Ninguna todavía. Esta es la primera tanda.)";
  }
  const lines = ["## Publicaciones recientes — NO REPETIR tema ni titular similar"];
  recent.forEach((p) => {
    const date = p.created_at.split("T")[0];
    lines.push(`- [${date}|${p.format}|${p.pillar ?? "—"}] "${p.title ?? "(sin título)"}" — tema: ${p.topic ?? "—"}`);
  });
  lines.push("");
  lines.push("REGLA DURA: no repetir el mismo tema, ángulo ni titular similar a los de esta lista.");
  return lines.join("\n");
}

function buildTemplatesSection(templates: VisualTemplate[], tenant: Tenant): string {
  if (templates.length === 0) {
    return "## Templates visuales disponibles\n(Sin templates configurados todavía.)";
  }
  const lines = ["## Templates visuales disponibles"];
  lines.push(
    "Para cada post, elegí un `visual_template_slug` de la siguiente lista que matchee semánticamente con el contenido del post.",
  );
  lines.push("Reglas: no repetir el mismo slug dos veces seguidas dentro del mismo formato.");
  lines.push("");
  // Group by format
  const byFormat = new Map<string, VisualTemplate[]>();
  templates.forEach((t) => {
    const arr = byFormat.get(t.format) ?? [];
    arr.push(t);
    byFormat.set(t.format, arr);
  });
  for (const [fmt, list] of byFormat) {
    lines.push(`### ${fmt}`);
    list.forEach((t) => {
      lines.push(`- \`${t.slug}\`${t.description ? ` — ${t.description}` : ""}`);
    });
    lines.push("");
  }
  lines.push(`Tenant: ${tenant.slug} · engine: ${tenant.image_engine}`);
  return lines.join("\n");
}
