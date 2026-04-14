import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, listVisualTemplates } from "@/lib/db/queries";
import { engineLabel, formatLabel } from "@/lib/display";
import { Icon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const templates = await listVisualTemplates(tenant.id);

  return (
    <div className="p-12 max-w-5xl animate-in">
      <Link
        href={`/t/${slug}`}
        className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold"
      >
        ← {tenant.name}
      </Link>
      <h1 className="font-display text-5xl uppercase tracking-tight mt-3 mb-2">Plantillas visuales</h1>
      <p className="text-[var(--text-dim)] mb-8 max-w-lg">
        Las plantillas que el generador puede elegir para cada pieza. Cada una es una variación visual
        con su propio layout y tono.
      </p>

      <div className="card divide-y divide-[var(--border)] overflow-hidden">
        {templates.map((t) => (
          <div key={t.id} className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-semibold">{t.slug}</code>
                {!t.is_active && <span className="chip text-[var(--text-faint)]">inactivo</span>}
              </div>
              {t.description && (
                <div className="text-xs text-[var(--text-dim)] mt-1 leading-relaxed">{t.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="chip">{formatLabel(t.format)}</span>
              <span className="chip">{engineLabel(t.engine)}</span>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="p-12 text-center text-[var(--text-faint)]">
            Todavía no hay plantillas configuradas para esta cuenta.
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--text-faint)] mt-4 flex items-center gap-2">
        <Icon.Image size={12} />
        Las plantillas se definen en código. Para preview en vivo, abrí{" "}
        <a href="/preview/templates" className="text-[var(--accent)] hover:opacity-80">
          /preview/templates
        </a>
        .
      </p>
    </div>
  );
}
