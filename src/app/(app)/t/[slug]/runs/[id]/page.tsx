import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTenantBySlug,
  getRun,
  getPostsByRun,
  getAssetsByPostIds,
  listVisualTemplatesForFormat,
} from "@/lib/db/queries";
import type { GeneratedPost, GeneratedAsset, VisualTemplate } from "@/lib/db/types";
import { ReviewActions } from "./ReviewActions";
import { PostCard } from "./PostCard";

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
  // Sort slides by index
  for (const arr of assetsByPost.values()) {
    arr.sort((a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0));
  }

  // For the template selector, we need available templates per format
  const templatesByFormat = new Map<string, VisualTemplate[]>();
  for (const fmt of ["ig_feed", "li_single", "li_carousel"] as const) {
    templatesByFormat.set(fmt, await listVisualTemplatesForFormat(tenant.id, fmt));
  }

  const isReady = run.status === "ready_for_review" || run.status === "approved" || run.status === "exported";
  const isGenerating = run.status === "generating" || run.status === "images_pending" || run.status === "pending";

  return (
    <div className="p-12 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/t/${slug}`}
            className="text-xs uppercase tracking-widest text-[var(--text-faint)] hover:text-[var(--text)]"
          >
            ← {tenant.name}
          </Link>
          <h1 className="font-display text-5xl uppercase tracking-tight mt-2">
            Run · {run.mode === "batch" ? "Batch" : "Single"}
          </h1>
          <div className="text-sm text-[var(--text-dim)] mt-2">
            {new Date(run.created_at).toLocaleString("es-AR")} ·{" "}
            <code className="text-xs">{run.id.slice(0, 8)}</code>
          </div>
        </div>

        <ReviewActions runId={run.id} tenantSlug={slug} status={run.status} postCount={posts.length} />
      </div>

      {isGenerating && (
        <div className="card p-8 mb-8 text-center">
          <div className="font-display text-2xl uppercase mb-2">Generando…</div>
          <div className="text-sm text-[var(--text-dim)] mb-4">
            {run.status === "generating" && "Claude está escribiendo el copy."}
            {run.status === "images_pending" && "Renderizando imágenes."}
          </div>
          <AutoRefresh />
        </div>
      )}

      {run.status === "failed" && (
        <div className="card p-8 mb-8 border-[var(--danger)]">
          <div className="font-display text-2xl uppercase mb-2 text-[var(--danger)]">Falló</div>
          <pre className="text-xs text-[var(--text-dim)] whitespace-pre-wrap">{run.error}</pre>
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

function AutoRefresh() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `setTimeout(() => window.location.reload(), 3000);`,
      }}
    />
  );
}
