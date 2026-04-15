import { NextResponse } from "next/server";
import JSZip from "jszip";
import {
  getRun,
  getPostsByRun,
  getAssetsByPostIds,
  bulkUpdatePostsStatus,
  updateRun,
} from "@/lib/db/queries";
import type { GeneratedPost, GeneratedAsset } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });

  const posts = await getPostsByRun(id);
  const approved = posts.filter((p) => p.status === "approved" || p.status === "exported");
  if (approved.length === 0) {
    return NextResponse.json({ error: "no approved posts to export" }, { status: 400 });
  }

  const assets = await getAssetsByPostIds(approved.map((p) => p.id));
  const assetsByPost = new Map<string, GeneratedAsset[]>();
  assets.forEach((a) => {
    const arr = assetsByPost.get(a.post_id) ?? [];
    arr.push(a);
    assetsByPost.set(a.post_id, arr);
  });

  const zip = new JSZip();
  zip.file(
    "README.txt",
    buildReadme({ runId: id, postCount: approved.length, createdAt: run.created_at }),
  );

  for (const post of approved) {
    const slot = String(post.slot_order ?? 0).padStart(2, "0");
    const slug = (post.topic ?? post.title ?? "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const folderName = `${slot}-${post.format}-${slug}`;
    const folder = zip.folder(folderName);
    if (!folder) continue;

    folder.file("copy.txt", buildCopyText(post));
    folder.file("meta.json", JSON.stringify(buildMeta(post), null, 2));

    const postAssets = (assetsByPost.get(post.id) ?? []).sort(
      (a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0),
    );
    for (const asset of postAssets) {
      const buf = await fetchAsBuffer(asset.public_url);
      if ((post.format === "li_carousel" || post.format === "ig_carousel") && asset.kind === "slide") {
        const idx = String(asset.slide_index ?? 0).padStart(2, "0");
        folder.file(`slide-${idx}.png`, buf);
      } else {
        folder.file("image.png", buf);
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "uint8array" });

  // Mark posts as exported + run as exported
  await bulkUpdatePostsStatus(
    approved.map((p) => p.id),
    "exported",
  );
  await updateRun(id, { status: "exported", exported_at: new Date().toISOString() });

  const filename = `${run.tenant_id.slice(0, 8)}-${id.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.zip`;

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function buildCopyText(post: GeneratedPost): string {
  const lines: string[] = [];
  if (post.title) lines.push(post.title);
  lines.push("");
  lines.push(post.copy);
  if (post.cta) {
    lines.push("");
    lines.push(post.cta);
  }
  if (post.hashtags.length > 0) {
    lines.push("");
    lines.push(post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  }
  return lines.join("\n");
}

function buildMeta(post: GeneratedPost) {
  return {
    id: post.id,
    format: post.format,
    pillar: post.pillar,
    topic: post.topic,
    visual_template: post.visual_template_slug,
    created_at: post.created_at,
    title: post.title,
  };
}

function buildReadme({ runId, postCount, createdAt }: { runId: string; postCount: number; createdAt: string }) {
  return `Social Publisher — Export
Run: ${runId}
Generado: ${createdAt}
Posts incluidos: ${postCount}

Cada carpeta es un post:
  - copy.txt    — copy completo listo para pegar en IG/LI (incluye hashtags + CTA)
  - meta.json   — metadata del post (formato, pillar, template usado)
  - image.png   — imagen del post (single)
  - slide-NN.png — slides numerados (carruseles)

Recordá marcar como "publicado externamente" en la app cuando ya hayas subido cada uno,
para que el sistema lo tenga en cuenta en el anti-repeat de la próxima generación.
`;
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
