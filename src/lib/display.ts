/**
 * Human-friendly display helpers. Everywhere the UI shows tech tokens
 * (image_engine slugs, status codes, format slugs), route them through here
 * to get the polished SaaS-facing labels.
 */

export function engineLabel(engine: string | null | undefined): string {
  if (!engine) return "Sin configurar";
  switch (engine) {
    case "argo_photo_panel":
      return "Foto editorial + overlay";
    case "html":
      return "HTML diseñado";
    default:
      return engine;
  }
}

export function formatLabel(format: string): string {
  switch (format) {
    case "ig_feed":
      return "Instagram Feed";
    case "ig_carousel":
      return "Instagram Carrusel";
    case "li_single":
      return "LinkedIn Post";
    case "li_carousel":
      return "LinkedIn Carrusel";
    case "li_carousel_slide":
      return "Slide de Carrusel";
    case "ig_carousel_slide":
      return "Slide de Carrusel";
    case "multi":
      return "Multi-formato";
    default:
      return format;
  }
}

export function formatPlatform(format: string): "instagram" | "linkedin" | "other" {
  if (format === "ig_feed" || format === "ig_carousel" || format === "ig_carousel_slide") return "instagram";
  if (format === "li_single" || format === "li_carousel" || format === "li_carousel_slide") return "linkedin";
  return "other";
}

/**
 * Returns true if the format is a carousel (any platform).
 */
export function isCarouselFormat(format: string): boolean {
  return format === "ig_carousel" || format === "li_carousel";
}

/**
 * Map a pillar slug to a human-readable label.
 * Works for both Argo's pillars (ciencia_metodologia, etc.) and Yacaré's
 * (anti-pattern, process, objection, reframe, manifesto) and any future
 * tenant. Generic fallback capitalizes and replaces separators.
 */
export function pillarLabel(pillarSlug: string | null | undefined): string {
  if (!pillarSlug) return "";
  const map: Record<string, string> = {
    // Argo
    ciencia_metodologia: "Ciencia y método",
    educacion_deportiva: "Educación deportiva",
    producto: "Producto",
    // Yacaré
    "anti-pattern": "Anti-pattern",
    process: "Proceso",
    objection: "Objeción",
    reframe: "Reframe",
    manifesto: "Manifiesto",
  };
  if (map[pillarSlug]) return map[pillarSlug];
  // Generic fallback: capitalize first letter, replace separators with spaces
  return pillarSlug
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function statusLabel(status: string): { label: string; color: "muted" | "accent" | "success" | "danger" | "warning" } {
  switch (status) {
    case "pending":
      return { label: "En cola", color: "muted" };
    case "generating":
      return { label: "Generando", color: "accent" };
    case "images_pending":
      return { label: "Renderizando", color: "accent" };
    case "ready_for_review":
      return { label: "Listo para revisar", color: "success" };
    case "approved":
      return { label: "Aprobado", color: "success" };
    case "exported":
      return { label: "Exportado", color: "accent" };
    case "failed":
      return { label: "Falló", color: "danger" };
    case "discarded":
      return { label: "Descartado", color: "muted" };
    case "draft":
      return { label: "Borrador", color: "muted" };
    case "rejected":
      return { label: "Rechazado", color: "danger" };
    case "image_failed":
      return { label: "Imagen pendiente", color: "warning" };
    case "published_externally":
      return { label: "Publicado", color: "success" };
    default:
      return { label: status, color: "muted" };
  }
}

export function cadenceHumanDescription(cadence: {
  ig_feed: number;
  li_single: number;
  li_carousel: number;
  ig_carousel?: number;
  carousel_slides: number;
}): string {
  const ig_carousel = cadence.ig_carousel ?? 0;
  const totalPosts = cadence.ig_feed + cadence.li_single + cadence.li_carousel + ig_carousel;
  const parts: string[] = [];
  if (cadence.ig_feed > 0) parts.push(`${cadence.ig_feed} posts de Instagram`);
  if (cadence.li_single > 0) parts.push(`${cadence.li_single} posts de LinkedIn`);
  if (cadence.li_carousel > 0)
    parts.push(`${cadence.li_carousel} ${cadence.li_carousel === 1 ? "carrusel" : "carruseles"} de LinkedIn`);
  if (ig_carousel > 0)
    parts.push(`${ig_carousel} ${ig_carousel === 1 ? "carrusel" : "carruseles"} de Instagram`);
  const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " y " + parts.slice(-1) : parts[0] ?? "";
  return `${totalPosts} publicaciones listas para publicar — ${list}. Los carruseles traen ${cadence.carousel_slides} slides cada uno.`;
}

export function archetypeLabel(archetype: string | null | undefined): string {
  if (!archetype) return "—";
  const map: Record<string, string> = {
    authority: "Authority · experto, preciso",
    innovator: "Innovator · visionario, disruptivo",
    friend: "Friend · cálido, accesible",
    rebel: "Rebel · audaz, contrarian",
    guide: "Guide · sabio, metódico",
  };
  return map[archetype] ?? archetype;
}
