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
      return "Instagram feed";
    case "li_single":
      return "LinkedIn single";
    case "li_carousel":
      return "LinkedIn carrusel";
    case "li_carousel_slide":
      return "Slide de carrusel";
    case "multi":
      return "Multi-formato";
    default:
      return format;
  }
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
  carousel_slides: number;
}): string {
  const totalPosts = cadence.ig_feed + cadence.li_single + cadence.li_carousel;
  return `${totalPosts} publicaciones listas para publicar — ${cadence.ig_feed} posts de feed, ${cadence.li_single} posts de LinkedIn y ${cadence.li_carousel} carruseles de ${cadence.carousel_slides} slides cada uno.`;
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
