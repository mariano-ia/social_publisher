import { notFound, redirect } from "next/navigation";
import { getTenantBySlug, createManualIdea } from "@/lib/db/queries";
import { startRun } from "@/lib/rendering/orchestrate";
import type { PostFormat } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function GeneratePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const isIdea = sp.mode === "idea";

  async function generateBatch() {
    "use server";
    const t = await getTenantBySlug(slug);
    if (!t) throw new Error("not found");
    const runId = await startRun({ tenant: t, mode: "batch" });
    redirect(`/t/${slug}/runs/${runId}`);
  }

  async function generateFromIdea(formData: FormData) {
    "use server";
    const t = await getTenantBySlug(slug);
    if (!t) throw new Error("not found");
    const ideaText = String(formData.get("idea_text") ?? "").trim();
    const targetFormat = String(formData.get("target_format") ?? "ig_feed") as PostFormat;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!ideaText) throw new Error("La idea no puede estar vacía");

    const idea = await createManualIdea({
      tenant_id: t.id,
      target_format: targetFormat,
      idea_text: ideaText,
      notes,
    });

    const runId = await startRun({
      tenant: t,
      mode: "single_idea",
      manualIdea: { id: idea.id, text: ideaText, format: targetFormat, notes },
    });
    redirect(`/t/${slug}/runs/${runId}`);
  }

  return (
    <div className="p-12 max-w-3xl">
      <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
        {tenant.name} · Generar
      </div>
      <h1 className="font-display text-5xl uppercase tracking-tight mb-8">
        {isIdea ? "Desde una idea" : "Tanda nueva"}
      </h1>

      {!isIdea ? (
        <div className="card p-8">
          <p className="text-[var(--text-dim)] mb-6">
            Vas a generar la tanda batch ({tenant.cadence.ig_feed} IG feed +{" "}
            {tenant.cadence.li_single} LI single + {tenant.cadence.li_carousel} LI carrusel) usando la
            voz activa y el historial de los últimos 60 días para evitar repetición.
          </p>
          <form action={generateBatch}>
            <button type="submit" className="btn btn-primary">
              Confirmar y generar
            </button>
          </form>
        </div>
      ) : (
        <form action={generateFromIdea} className="card p-8 flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
              Tu idea
            </span>
            <textarea
              name="idea_text"
              rows={5}
              autoFocus
              required
              placeholder="Ej: Un post sobre por qué la mayoría de MVPs fallan en discovery, no en delivery."
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
              Formato target
            </span>
            <select name="target_format" defaultValue="ig_feed">
              <option value="ig_feed">Instagram feed (1:1)</option>
              <option value="li_single">LinkedIn single (3:2)</option>
              <option value="li_carousel">LinkedIn carrusel (5 slides)</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
              Notas adicionales (opcional)
            </span>
            <input
              type="text"
              name="notes"
              placeholder="Tono específico, ángulo a tomar, etc."
            />
          </label>

          <button type="submit" className="btn btn-primary self-start">
            Generar 1 post
          </button>
        </form>
      )}
    </div>
  );
}
