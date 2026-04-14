import { notFound } from "next/navigation";
import { getTenantBySlug, listVisualTemplates } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const templates = await listVisualTemplates(tenant.id);

  return (
    <div className="p-12 max-w-5xl">
      <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
        {tenant.name} · Templates visuales
      </div>
      <h1 className="font-display text-5xl uppercase tracking-tight mb-2">Templates</h1>
      <p className="text-[var(--text-dim)] mb-8 text-sm">
        Read-only en el MVP. Los templates HTML viven en{" "}
        <code className="text-xs">src/lib/rendering/templates/</code>. Para preview real, abrí{" "}
        <a href="/preview/templates" className="text-[var(--accent)]">/preview/templates</a>.
      </p>

      <div className="card divide-y divide-[var(--border)]">
        {templates.map((t) => (
          <div key={t.id} className="p-5 flex items-center justify-between">
            <div>
              <code className="text-sm">{t.slug}</code>
              {t.description && (
                <div className="text-xs text-[var(--text-dim)] mt-1">{t.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-dim)]">
                {t.format}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-dim)]">
                {t.engine}
              </span>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="p-8 text-center text-[var(--text-faint)]">Sin templates configurados.</div>
        )}
      </div>
    </div>
  );
}
