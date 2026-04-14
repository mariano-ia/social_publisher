import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, listRunsByTenant } from "@/lib/db/queries";
import { statusLabel } from "@/lib/display";
import { Icon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ since?: string; status?: string; mode?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const allRuns = await listRunsByTenant(tenant.id, 100);

  // Filter client-side from the 100 most recent
  let runs = allRuns;
  if (sp.since) {
    const since = new Date(sp.since);
    runs = runs.filter((r) => new Date(r.created_at) >= since);
  }
  if (sp.status && sp.status !== "all") {
    runs = runs.filter((r) => r.status === sp.status);
  }
  if (sp.mode && sp.mode !== "all") {
    runs = runs.filter((r) => r.mode === sp.mode);
  }

  const sinceValue = sp.since ?? "";
  const statusValue = sp.status ?? "all";
  const modeValue = sp.mode ?? "all";

  return (
    <div className="p-12 max-w-5xl animate-in">
      <Link
        href={`/t/${slug}`}
        className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold"
      >
        ← {tenant.name}
      </Link>
      <h1 className="font-display text-5xl uppercase tracking-tight mt-3 mb-2">Historial</h1>
      <p className="text-[var(--text-dim)] mb-8">
        Todas las generaciones de esta cuenta. Los últimos 100 runs están disponibles.
      </p>

      {/* Filters */}
      <form
        method="get"
        className="card p-5 mb-6 flex flex-wrap items-end gap-4"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 flex items-center gap-1.5 uppercase tracking-[0.14em]">
            <Icon.Calendar size={12} />
            Desde
          </label>
          <input type="date" name="since" defaultValue={sinceValue} />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 uppercase tracking-[0.14em]">
            Estado
          </label>
          <select name="status" defaultValue={statusValue}>
            <option value="all">Todos</option>
            <option value="ready_for_review">Listo para revisar</option>
            <option value="approved">Aprobado</option>
            <option value="exported">Exportado</option>
            <option value="generating">Generando</option>
            <option value="images_pending">Renderizando</option>
            <option value="failed">Falló</option>
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 uppercase tracking-[0.14em]">
            Tipo
          </label>
          <select name="mode" defaultValue={modeValue}>
            <option value="all">Todos</option>
            <option value="batch">Tanda completa</option>
            <option value="single_idea">Post individual</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            <Icon.Filter size={14} />
            Filtrar
          </button>
          {(sinceValue || statusValue !== "all" || modeValue !== "all") && (
            <Link href={`/t/${slug}/history`} className="btn btn-ghost btn-sm">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="text-xs text-[var(--text-dim)] mb-3">
        {runs.length} {runs.length === 1 ? "resultado" : "resultados"}
      </div>

      <div className="card divide-y divide-[var(--border)] overflow-hidden">
        {runs.map((r) => {
          const status = statusLabel(r.status);
          const colorVar =
            status.color === "success"
              ? "var(--success)"
              : status.color === "danger"
                ? "var(--danger)"
                : status.color === "warning"
                  ? "var(--warning)"
                  : status.color === "accent"
                    ? "var(--accent)"
                    : "var(--text-dim)";
          return (
            <Link
              key={r.id}
              href={`/t/${slug}/runs/${r.id}`}
              className="block p-5 hover:bg-[var(--bg-surface)] transition-colors group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {r.mode === "batch" ? "Tanda completa" : "Post individual"}
                  </div>
                  <div className="text-xs text-[var(--text-faint)] mt-1">
                    {new Date(r.created_at).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · <code className="text-[10px]">{r.id.slice(0, 8)}</code>
                  </div>
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.14em] font-semibold py-1 px-2.5 rounded-full whitespace-nowrap"
                  style={{ color: colorVar, border: `1px solid ${colorVar}` }}
                >
                  {status.label}
                </span>
                <Icon.ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
        {runs.length === 0 && (
          <div className="p-12 text-center text-[var(--text-faint)]">
            Nada por acá. Ajustá los filtros o generá tu primera tanda.
          </div>
        )}
      </div>
    </div>
  );
}
