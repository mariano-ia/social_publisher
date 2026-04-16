import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getPost, getAssetsByPostIds } from "@/lib/db/queries";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/posts/:id/carousel-pdf
 *
 * Combines all carousel slide PNGs into a single PDF for LinkedIn upload.
 * Each slide becomes one page at the original pixel dimensions (1080x1350).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

  if (post.format !== "li_carousel" && post.format !== "ig_carousel") {
    return NextResponse.json({ error: "post is not a carousel" }, { status: 400 });
  }

  const assets = await getAssetsByPostIds([post.id]);
  const slides = assets
    .filter((a) => a.kind === "slide")
    .sort((a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0));

  if (slides.length === 0) {
    return NextResponse.json({ error: "no slides found" }, { status: 400 });
  }

  const pdf = await PDFDocument.create();

  for (const slide of slides) {
    const res = await fetch(slide.public_url);
    if (!res.ok) throw new Error(`Failed to fetch slide ${slide.slide_index}`);
    const pngBytes = new Uint8Array(await res.arrayBuffer());

    const pngImage = await pdf.embedPng(pngBytes);
    const width = slide.width ?? pngImage.width;
    const height = slide.height ?? pngImage.height;

    // Page size matches the image pixels (LinkedIn handles scaling)
    const page = pdf.addPage([width, height]);
    page.drawImage(pngImage, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await pdf.save();

  const slug = (post.topic ?? post.title ?? "carousel")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const filename = `${post.format}-${slug}.pdf`;

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
