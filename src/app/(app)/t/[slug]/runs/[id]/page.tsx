import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTenantBySlug,
  getRun,
  getPostsByRun,
  getAssetsByPostIds,
  listVisualTemplatesForFormat,
} from "@/lib/db/queries";
import type { GeneratedPost, GeneratedAsset, VisualTemplate, Tenant } from "@/lib/db/types";
import { ReviewActions } from "./ReviewActions";
import { PostCard } from "./PostCard";
import { GenerationProgress } from "./GenerationProgress";

export const dynamic = "force-dynamic";

export default async function RunReviewPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const run = await getRun(id);
  if (!run || run.tenant_id !== tenant.id) notFound();

  const posts = await getPostsByRun(id);
  const assets = await getAssetsByPostIds(posts.map((p) => p.id));

  // Group assets by post
  const assetsByPost = new Map<string, GeneratedAsset[]>();
  assets.forEach((a) => {
    const arr = assetsByPost.get(a.post_id) ?? [];
    arr.push(a);
    assetsByPost.set(a.post_id, arr);
  });
  for (const arr of assetsByPost.values()) {
    arr.sort((a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0));
  }

  const templatesByFormat = new Map<string, VisualTemplate[]>();
  for (const fmt of ["ig_feed", "li_single", "li_carousel"] as const) {
    templatesByFormat.set(fmt, await listVisualTemplatesForFormat(tenant.id, fmt));
  }

  const isReady = run.status === "ready_for_review" || run.status === "approved" || run.status === "exported";
  const isGenerating = run.status === "generating" || run.status === "images_pending" || run.status === "pending";

  const postSlots = posts.map((p) => {
    const postAssets = assetsByPost.get(p.id) ?? [];
    const expected = p.format === "li_carousel" ? p.slides?.length ?? 5 : 1;
    const count = postAssets.length;
    return {
      order: p.slot_order ?? 0,
      done: count >= expected,
      partial: count > 0 && count < expected,
    };
  });

  return (
    <div className="p-12 max-w-7xl animate-in">
      <div className="flex items-center justify-between mb-8 gap-6 flex-wrap">
        <div>
          <Link
            href={`/t/${slug}`}
            className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold"
          >
            ← {tenant.name}
          </Link>
          <div className="chip mt-3 mb-3">
            <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
            {run.mode === "batch" ? "Generación completa" : "Post individual"}
          </div>
          <h1 className="font-display text-5xl uppercase tracking-tight">
            Contenido generado
          </h1>
          <div className="text-sm text-[var(--text-dim)] mt-2">
            {new Date(run.created_at).toLocaleString("es-AR", {
              day: "2-digit",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {posts.length} {posts.length === 1 ? "pieza" : "piezas"}
            {" · "}
            <code className="text-xs text-[var(--text-faint)]">{run.id.slice(0, 8)}</code>
          </div>
        </div>

        <ReviewActions runId={run.id} tenantSlug={slug} status={run.status} postCount={posts.length} />
      </div>

      {isGenerating && (
        <GenerationProgress
          status={run.status}
          startedAt={run.started_at}
          assetsDone={assets.length}
          assetsExpected={computeExpectedAssets(posts, tenant)}
          postSlots={postSlots}
        />
      )}

      {run.status === "failed" && (
        <div className="card p-8 mb-8 border-[var(--danger)]">
          <div className="font-display text-2xl uppercase mb-2 text-[var(--danger)]">La generación falló</div>
          <p className="text-sm text-[var(--text-dim)] mb-4">
            Algo en el pipeline devolvió un error. Acá está el detalle técnico:
          </p>
          <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap bg-[var(--bg-surface)] p-4 rounded-lg overflow-auto">
            {run.error}
          </pre>
        </div>
      )}

      {isReady && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p: GeneratedPost) => (
            <PostCard
              key={p.id}
              post={p}
              assets={assetsByPost.get(p.id) ?? []}
              availableTemplates={templatesByFormat.get(p.format) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function computeExpectedAssets(posts: GeneratedPost[], tenant: Tenant): number {
  let total = 0;
  for (const p of posts) {
    if (p.format === "li_carousel") total += tenant.cadence.carousel_slides;
    else total += 1;
  }
  return total || 1;
}
