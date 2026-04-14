import Link from "next/link";
import { listTenants } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenants = await listTenants();

  return (
    <div className="p-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="font-display text-6xl uppercase tracking-tight mb-2">Tenants</h1>
        <p className="text-[var(--text-dim)]">Elegí un tenant para generar contenido o crear uno nuevo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tenants.map((t) => (
          <Link
            key={t.id}
            href={`/t/${t.slug}`}
            className="card p-8 hover:border-[var(--accent)] transition-colors"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-3xl uppercase tracking-tight mb-1">{t.name}</h2>
                <code className="text-xs text-[var(--text-faint)]">{t.slug}</code>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-dim)]">
                {t.image_engine === "argo_photo_panel" ? "photo+panel" : "html→png"}
              </span>
            </div>
            <div className="text-sm text-[var(--text-dim)]">
              {t.cadence.ig_feed} IG feed · {t.cadence.li_single} LI single · {t.cadence.li_carousel} LI carrusel
            </div>
          </Link>
        ))}

        <Link
          href="/tenants/new"
          className="card border-dashed p-8 flex items-center justify-center text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors min-h-[180px]"
        >
          + Crear nuevo tenant
        </Link>
      </div>
    </div>
  );
}
