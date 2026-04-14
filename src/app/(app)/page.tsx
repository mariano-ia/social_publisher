import Link from "next/link";
import { listTenants } from "@/lib/db/queries";
import { Icon } from "@/components/Icons";
import { engineLabel, cadenceHumanDescription } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenants = await listTenants();

  return (
    <div className="p-12 max-w-6xl animate-in">
      <div className="mb-14">
        <div className="chip mb-4">
          <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
          Tus cuentas
        </div>
        <h1 className="font-display text-6xl uppercase tracking-tight leading-none mb-3 text-gradient">
          Generá contenido
        </h1>
        <p className="text-[var(--text-dim)] text-lg max-w-xl">
          Elegí una cuenta para crear un batch de contenido o generar un post puntual. Cada cuenta
          tiene su propia voz, tono y sistema visual.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tenants.map((t) => (
          <Link
            key={t.id}
            href={`/t/${t.slug}`}
            className="card card-hover p-8 group"
          >
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-3xl uppercase tracking-tight mb-1 truncate">
                  {t.name}
                </h2>
                {t.website_url && (
                  <div className="text-xs text-[var(--text-faint)] truncate">
                    {t.website_url.replace(/^https?:\/\//, "")}
                  </div>
                )}
              </div>
              <div className="chip">{engineLabel(t.image_engine)}</div>
            </div>

            <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-6">
              {cadenceHumanDescription(t.cadence)}
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)] group-hover:gap-3 transition-all">
              Abrir cuenta
              <Icon.ChevronRight size={16} />
            </div>
          </Link>
        ))}

        <Link
          href="/tenants/new"
          className="card border-dashed p-8 flex flex-col items-center justify-center gap-3 text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors min-h-[220px] group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon.Plus size={20} />
          </div>
          <span className="text-sm font-semibold">Agregar cuenta</span>
          <span className="text-xs text-[var(--text-faint)]">Nuevo tenant · voz, tono, visuales</span>
        </Link>
      </div>
    </div>
  );
}
