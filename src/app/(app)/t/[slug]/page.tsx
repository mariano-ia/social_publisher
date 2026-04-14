import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTenantBySlug, getActiveVoiceVersion, listRunsByTenant, listVisualTemplates } from "@/lib/db/queries";
import { startRun } from "@/lib/rendering/orchestrate";

export const dynamic = "force-dynamic";

export default async function TenantHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const [voice, recentRuns, templates] = await Promise.all([
    getActiveVoiceVersion(tenant.id),
    listRunsByTenant(tenant.id, 8),
    listVisualTemplates(tenant.id),
  ]);

  async function handleGenerateBatch() {
    "use server";
    const t = await getTenantBySlug(slug);
    if (!t) throw new Error("tenant not found");
    const runId = await startRun({ tenant: t, mode: "batch" });
    redirect(`/t/${slug}/runs/${runId}`);
  }

  return (
    <div className="p-12 max-w-6xl">
      <div className="mb-12">
        <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
          Tenant
        </div>
        <h1 className="font-display text-6xl uppercase tracking-tight mb-2">{tenant.name}</h1>
        <p className="text-[var(--text-dim)]">
          {tenant.website_url && (
            <a href={tenant.website_url} target="_blank" rel="noopener" className="hover:text-[var(--accent)]">
              {tenant.website_url}
            </a>
          )}
          {" · "}
          <code className="text-xs">{tenant.slug}</code>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <form action={handleGenerateBatch} className="card p-8 lg:col-span-2 flex flex-col items-start gap-4">
          <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
            Generación rápida
          </div>
          <h2 className="font-display text-3xl uppercase">Generar tanda completa</h2>
          <p className="text-sm text-[var(--text-dim)]">
            {tenant.cadence.ig_feed} IG feed + {tenant.cadence.li_single} LI single +{" "}
            {tenant.cadence.li_carousel} LI carrusel × {tenant.cadence.carousel_slides} slides ={" "}
            {tenant.cadence.ig_feed + tenant.cadence.li_single + tenant.cadence.li_carousel} posts /{" "}
            {tenant.cadence.ig_feed +
              tenant.cadence.li_single +
              tenant.cadence.li_carousel * tenant.cadence.carousel_slides}{" "}
            imágenes.
          </p>
          {!voice && (
            <p className="text-sm text-[var(--warning)]">
              ⚠️ Sin brand voice activa. Configurá una antes de generar.
            </p>
          )}
          {templates.length === 0 && (
            <p className="text-sm text-[var(--warning)]">
              ⚠️ Sin templates visuales. Agregá al menos uno antes de generar.
            </p>
          )}
          <button type="submit" className="btn btn-primary mt-2" disabled={!voice || templates.length === 0}>
            Generar tanda
          </button>
        </form>

        <Link
          href={`/t/${slug}/generate?mode=idea`}
          className="card p-8 flex flex-col items-start gap-3 hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
            Otro modo
          </div>
          <h2 className="font-display text-2xl uppercase">Desde una idea</h2>
          <p className="text-sm text-[var(--text-dim)]">
            Tipea una idea y generá un solo post (IG, LI single o carrusel).
          </p>
          <span className="text-sm text-[var(--accent)] mt-2">Generar single →</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Link
          href={`/t/${slug}/voice`}
          className="card p-6 hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
            Brand voice
          </div>
          <div className="font-display text-2xl uppercase mb-1">
            {voice ? `v${voice.version}` : "Sin configurar"}
          </div>
          <div className="text-xs text-[var(--text-dim)]">
            {voice?.archetype ?? "—"}
            {voice?.system_prompt_override ? " · override activo" : ""}
          </div>
        </Link>

        <Link
          href={`/t/${slug}/templates`}
          className="card p-6 hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
            Templates visuales
          </div>
          <div className="font-display text-2xl uppercase mb-1">{templates.length}</div>
          <div className="text-xs text-[var(--text-dim)]">activos · {tenant.image_engine}</div>
        </Link>

        <Link
          href={`/t/${slug}/history`}
          className="card p-6 hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
            Historial
          </div>
          <div className="font-display text-2xl uppercase mb-1">{recentRuns.length}</div>
          <div className="text-xs text-[var(--text-dim)]">runs recientes</div>
        </Link>
      </div>

      {recentRuns.length > 0 && (
        <div>
          <h2 className="font-display text-2xl uppercase mb-4">Runs recientes</h2>
          <div className="card divide-y divide-[var(--border)]">
            {recentRuns.map((r) => (
              <Link
                key={r.id}
                href={`/t/${slug}/runs/${r.id}`}
                className="block p-4 hover:bg-[var(--bg-surface)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {r.mode === "batch" ? "Batch (8 posts)" : "Single (1 post)"}
                    </div>
                    <div className="text-xs text-[var(--text-faint)]">
                      {new Date(r.created_at).toLocaleString("es-AR")}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "var(--text-faint)" },
    generating: { label: "Generando…", color: "var(--accent)" },
    images_pending: { label: "Imágenes…", color: "var(--accent)" },
    ready_for_review: { label: "Listo", color: "var(--success)" },
    approved: { label: "Aprobado", color: "var(--success)" },
    exported: { label: "Exportado", color: "var(--accent-light)" },
    failed: { label: "Falló", color: "var(--danger)" },
    discarded: { label: "Descartado", color: "var(--text-faint)" },
  };
  const cfg = map[status] ?? { label: status, color: "var(--text-dim)" };
  return (
    <span
      className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full"
      style={{ color: cfg.color, border: `1px solid ${cfg.color}` }}
    >
      {cfg.label}
    </span>
  );
}
