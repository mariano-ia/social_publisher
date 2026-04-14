import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTenantBySlug, getActiveVoiceVersion, listRunsByTenant, listVisualTemplates } from "@/lib/db/queries";
import { startRun } from "@/lib/rendering/orchestrate";
import { Icon } from "@/components/Icons";
import { cadenceHumanDescription, engineLabel, statusLabel, archetypeLabel } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function TenantHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const [voice, recentRuns, templates] = await Promise.all([
    getActiveVoiceVersion(tenant.id),
    listRunsByTenant(tenant.id, 6),
    listVisualTemplates(tenant.id),
  ]);

  async function handleGenerateBatch() {
    "use server";
    const t = await getTenantBySlug(slug);
    if (!t) throw new Error("tenant not found");
    const runId = await startRun({ tenant: t, mode: "batch" });
    redirect(`/t/${slug}/runs/${runId}`);
  }

  const canGenerate = !!voice && templates.length > 0;

  return (
    <div className="p-12 max-w-6xl animate-in">
      {/* Hero */}
      <div className="mb-12">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold inline-flex items-center gap-2 mb-4"
        >
          ← Cuentas
        </Link>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-display text-6xl uppercase tracking-tight leading-none mb-2">
              {tenant.name}
            </h1>
            {tenant.website_url && (
              <a
                href={tenant.website_url}
                target="_blank"
                rel="noopener"
                className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)]"
              >
                {tenant.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
          <div className="chip">{engineLabel(tenant.image_engine)}</div>
        </div>
      </div>

      {/* Primary actions: Main CTA + Post Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Main CTA */}
        <form action={handleGenerateBatch} className="lg:col-span-3">
          <div className="card card-hover p-10 flex flex-col gap-5 h-full relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: "radial-gradient(circle at 100% 0%, var(--accent-glow) 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="chip mb-5">
                <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                Acción principal
              </div>
              <h2 className="font-display text-4xl uppercase tracking-tight mb-3">
                Generar contenido
              </h2>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed max-w-lg mb-2">
                Creamos un batch completo listo para publicar: copy con tu voz, visuales con tu
                paleta, hashtags y CTAs por cada pieza.
              </p>
              <p className="text-xs text-[var(--text-faint)] leading-relaxed max-w-lg">
                {cadenceHumanDescription(tenant.cadence)}
              </p>
            </div>

            {!canGenerate && (
              <div className="relative rounded-xl bg-[var(--bg-surface)] border border-[var(--warning)] border-opacity-40 p-4 text-xs text-[var(--warning)]">
                {!voice && <div>⚠ Configurá la voz de la cuenta antes de generar.</div>}
                {templates.length === 0 && <div>⚠ Todavía no hay plantillas visuales activas.</div>}
              </div>
            )}

            <div className="relative flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={!canGenerate}
                className="btn btn-primary btn-lg"
              >
                <Icon.Sparkles size={18} />
                Generar contenido
              </button>
              <span className="text-xs text-[var(--text-faint)]">Tarda 3–5 min</span>
            </div>
          </div>
        </form>

        {/* Post Generator */}
        <Link
          href={`/t/${slug}/generate?mode=idea`}
          className="card card-hover p-8 flex flex-col gap-4 lg:col-span-2 group"
        >
          <div className="chip mb-2">Otro modo</div>
          <h2 className="font-display text-2xl uppercase tracking-tight">Post generator</h2>
          <p className="text-sm text-[var(--text-dim)] leading-relaxed">
            ¿Tenés una idea puntual? Tipeala y generamos un post específico en el formato que quieras.
          </p>
          <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-[var(--accent)] group-hover:gap-3 transition-all">
            <Icon.Wand size={16} />
            Abrir post generator
          </div>
        </Link>
      </div>

      {/* Voice link card — compact, single column */}
      <Link
        href={`/t/${slug}/voice`}
        className="card card-hover p-5 mb-12 flex items-center gap-4 group"
      >
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors flex-shrink-0">
          <Icon.Mic size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-faint)] font-semibold mb-0.5">
            Voz y tono
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="text-sm font-semibold text-[var(--text)]">
              {voice ? `Versión ${voice.version}` : "Sin configurar"}
            </div>
            {voice && (
              <div className="text-xs text-[var(--text-dim)]">
                {voice.system_prompt_override ? "Prompt custom activo" : archetypeLabel(voice.archetype)}
              </div>
            )}
          </div>
        </div>
        <Icon.ChevronRight size={18} />
      </Link>

      {/* Recent runs */}
      {recentRuns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl uppercase tracking-tight">Ejecuciones recientes</h2>
            <Link
              href={`/t/${slug}/history`}
              className="text-sm font-semibold text-[var(--accent)] hover:opacity-80"
            >
              Ver historial completo →
            </Link>
          </div>
          <div className="card divide-y divide-[var(--border)] overflow-hidden">
            {recentRuns.map((r) => {
              const status = statusLabel(r.status);
              return (
                <Link
                  key={r.id}
                  href={`/t/${slug}/runs/${r.id}`}
                  className="block p-5 hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--text)]">
                        {r.mode === "batch" ? "Contenido generado" : "Post individual"}
                      </div>
                      <div className="text-xs text-[var(--text-faint)] mt-0.5">
                        {new Date(r.created_at).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <StatusBadge status={status.label} color={status.color} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  const colorVar =
    color === "success"
      ? "var(--success)"
      : color === "danger"
        ? "var(--danger)"
        : color === "warning"
          ? "var(--warning)"
          : color === "accent"
            ? "var(--accent)"
            : "var(--text-dim)";
  return (
    <span
      className="text-[10px] uppercase tracking-[0.14em] font-semibold py-1 px-2.5 rounded-full whitespace-nowrap"
      style={{ color: colorVar, border: `1px solid ${colorVar}` }}
    >
      {status}
    </span>
  );
}
