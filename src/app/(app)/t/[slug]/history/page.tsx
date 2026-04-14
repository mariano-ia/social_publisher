import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, listRunsByTenant } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const runs = await listRunsByTenant(tenant.id, 50);

  return (
    <div className="p-12 max-w-5xl">
      <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
        {tenant.name} · Historial
      </div>
      <h1 className="font-display text-5xl uppercase tracking-tight mb-8">Runs</h1>

      <div className="card divide-y divide-[var(--border)]">
        {runs.map((r) => (
          <Link
            key={r.id}
            href={`/t/${slug}/runs/${r.id}`}
            className="block p-5 hover:bg-[var(--bg-surface)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {r.mode === "batch" ? "Batch (8 posts)" : "Single (1 post)"}
                </div>
                <div className="text-xs text-[var(--text-faint)] mt-1">
                  {new Date(r.created_at).toLocaleString("es-AR")} · <code>{r.id.slice(0, 8)}</code>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full text-[var(--text-dim)]">
                {r.status}
              </span>
            </div>
          </Link>
        ))}
        {runs.length === 0 && (
          <div className="p-8 text-center text-[var(--text-faint)]">Todavía no hay runs.</div>
        )}
      </div>
    </div>
  );
}
