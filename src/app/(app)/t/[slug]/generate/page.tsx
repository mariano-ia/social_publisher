import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTenantBySlug, createManualIdea } from "@/lib/db/queries";
import { startRun } from "@/lib/rendering/orchestrate";
import type { PostFormat } from "@/lib/db/types";
import { Icon } from "@/components/Icons";

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
    <div className="p-12 max-w-3xl animate-in">
      <Link
        href={`/t/${slug}`}
        className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold"
      >
        ← {tenant.name}
      </Link>
      <div className="mt-3 mb-10">
        {!isIdea ? (
          <>
            <h1 className="font-display text-5xl uppercase tracking-tight mb-2">Tanda completa</h1>
            <p className="text-[var(--text-dim)]">
              Confirmá para generar la próxima tanda de contenido con la voz activa y sin repetir temas
              del historial reciente.
            </p>
          </>
        ) : (
          <>
            <div className="chip mb-3">
              <Icon.Wand size={12} />
              Post Generator
            </div>
            <h1 className="font-display text-5xl uppercase tracking-tight mb-2">
              Generar un post desde una idea
            </h1>
            <p className="text-[var(--text-dim)]">
              Tipea un ángulo, tema o pregunta. Generamos un post completo (copy + visual + hashtags)
              en el formato que elijas.
            </p>
          </>
        )}
      </div>

      {!isIdea ? (
        <form action={generateBatch} className="card p-8 flex flex-col gap-6">
          <div className="text-sm text-[var(--text-dim)]">
            <strong className="text-[var(--text)]">{tenant.cadence.ig_feed}</strong> posts de feed +{" "}
            <strong className="text-[var(--text)]">{tenant.cadence.li_single}</strong> posts de LinkedIn +{" "}
            <strong className="text-[var(--text)]">{tenant.cadence.li_carousel}</strong> carruseles de{" "}
            {tenant.cadence.carousel_slides} slides
          </div>
          <button type="submit" className="btn btn-primary btn-lg self-start">
            <Icon.Sparkles size={18} />
            Generar contenido
          </button>
        </form>
      ) : (
        <form action={generateFromIdea} className="card p-8 flex flex-col gap-6">
          <Field
            label="Tu idea"
            hint="Un párrafo corto describiendo el ángulo, la pregunta o el tema. Lo más específico, mejor."
          >
            <textarea
              name="idea_text"
              rows={5}
              autoFocus
              required
              placeholder="Ej: Un post sobre por qué la mayoría de MVPs fallan en discovery, no en delivery. Con un tono contrarian pero no agresivo."
            />
          </Field>

          <Field label="Formato target" hint="Dónde vas a publicar este post.">
            <select name="target_format" defaultValue="ig_feed">
              <option value="ig_feed">Instagram feed · cuadrado 1:1</option>
              <option value="li_single">LinkedIn single · horizontal 3:2</option>
              <option value="li_carousel">LinkedIn carrusel · 5 slides 4:5</option>
            </select>
          </Field>

          <Field label="Notas adicionales" hint="Opcional. Cualquier contexto extra para guiar el generador.">
            <input
              type="text"
              name="notes"
              placeholder="Ej: evitar mencionar competidores directamente"
            />
          </Field>

          <button type="submit" className="btn btn-primary btn-lg self-start">
            <Icon.Wand size={18} />
            Generar contenido
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <div>
        <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
        {hint && <div className="text-xs text-[var(--text-dim)] mt-0.5">{hint}</div>}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}
