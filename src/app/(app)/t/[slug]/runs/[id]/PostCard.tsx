"use client";

import { useState, useTransition } from "react";
import type { GeneratedPost, GeneratedAsset, VisualTemplate } from "@/lib/db/types";
import { approvePost, rejectPost, changeTemplate, retryRender } from "./actions";

interface Props {
  post: GeneratedPost;
  assets: GeneratedAsset[];
  availableTemplates: VisualTemplate[];
}

export function PostCard({ post, assets, availableTemplates }: Props) {
  const [pending, startTransition] = useTransition();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [status, setStatus] = useState(post.status);
  const [currentTemplate, setCurrentTemplate] = useState(post.visual_template_slug ?? "");
  const [copiedFlash, setCopiedFlash] = useState(false);

  const isCarousel = post.format === "li_carousel";
  const slides = assets
    .filter((a) => a.kind === "slide")
    .sort((a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0));
  const single = assets.find((a) => a.kind === "single");

  const currentAsset = isCarousel ? slides[currentSlide] : single;
  const imageFailed = status === "image_failed" || assets.length === 0;

  const copyText = buildCopyText(post);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 1500);
    } catch {
      // Fallback: select the textarea
      const ta = document.getElementById(`copy-${post.id}`) as HTMLTextAreaElement | null;
      if (ta) {
        ta.select();
        document.execCommand("copy");
        setCopiedFlash(true);
        setTimeout(() => setCopiedFlash(false), 1500);
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!currentAsset) return;
    const slug = (post.topic ?? post.title ?? "post")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const suffix = isCarousel
      ? `-slide-${String(currentAsset.slide_index ?? currentSlide + 1).padStart(2, "0")}`
      : "";
    const filename = `${post.format}-${slug}${suffix}.png`;
    try {
      const res = await fetch(currentAsset.public_url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      console.error("download failed", e);
      // Fallback: open in new tab so user can right-click save
      window.open(currentAsset.public_url, "_blank");
    }
  };

  const handleDownloadAllSlides = async () => {
    // For carousels: download each slide sequentially (browser handles 5 downloads)
    const slug = (post.topic ?? post.title ?? "post")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    for (const asset of slides) {
      try {
        const res = await fetch(asset.public_url);
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = `${post.format}-${slug}-slide-${String(asset.slide_index ?? 0).padStart(2, "0")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objUrl);
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error("slide download failed", e);
      }
    }
  };

  return (
    <div
      className={`card overflow-hidden flex flex-col ${
        status === "approved"
          ? "border-[var(--success)]"
          : status === "rejected"
            ? "border-[var(--danger)] opacity-60"
            : imageFailed
              ? "border-[var(--warning)]"
              : ""
      }`}
    >
      <div className="relative bg-black aspect-square flex items-center justify-center overflow-hidden">
        {currentAsset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentAsset.public_url}
            alt={post.title ?? ""}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center px-4">
            <div className="text-[var(--text-faint)] text-xs uppercase tracking-widest mb-3">
              {imageFailed ? "imagen falló" : "sin imagen"}
            </div>
            <button
              onClick={() => {
                startTransition(async () => {
                  await retryRender(post.id);
                });
              }}
              disabled={pending}
              className="btn btn-secondary text-xs"
            >
              {pending ? "Reintentando…" : "↻ Regenerar imagen"}
            </button>
          </div>
        )}

        {isCarousel && slides.length > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full ${i === currentSlide ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-dim)]">
            {post.format}
          </span>
          {post.pillar && (
            <span className="text-[10px] uppercase tracking-widest font-semibold py-1 px-2 rounded-full text-[var(--accent)]">
              {post.pillar}
            </span>
          )}
        </div>

        {post.title && <h3 className="font-display text-xl uppercase leading-tight">{post.title}</h3>}

        <details className="text-xs text-[var(--text-dim)]">
          <summary className="cursor-pointer text-[var(--accent)] font-semibold uppercase tracking-widest text-[10px] mb-2 select-none">
            Ver copy completo
          </summary>
          <textarea
            id={`copy-${post.id}`}
            readOnly
            value={copyText}
            className="w-full mt-2 font-mono text-[11px] leading-relaxed"
            rows={Math.min(18, copyText.split("\n").length + 2)}
            onFocus={(e) => e.target.select()}
          />
        </details>

        <button onClick={handleCopy} className="btn btn-secondary text-xs">
          {copiedFlash ? "✓ Copiado" : "📋 Copiar texto (título + copy + CTA + hashtags)"}
        </button>

        {currentAsset && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadImage}
              className="btn btn-secondary text-xs flex-1"
              title={isCarousel ? `Descarga el slide ${currentSlide + 1} actual` : "Descarga la imagen"}
            >
              ⬇ Descargar {isCarousel ? `slide ${currentSlide + 1}` : "imagen"}
            </button>
            {isCarousel && slides.length > 1 && (
              <button
                onClick={handleDownloadAllSlides}
                className="btn btn-secondary text-xs"
                title="Descarga los 5 slides uno por uno"
              >
                ⬇ Todos
              </button>
            )}
          </div>
        )}

        {availableTemplates.length > 0 && (
          <select
            value={currentTemplate}
            onChange={(e) => {
              const slug = e.target.value;
              setCurrentTemplate(slug);
              startTransition(async () => {
                await changeTemplate(post.id, slug);
              });
            }}
            disabled={pending}
            className="text-xs"
          >
            {availableTemplates.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.slug}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2 mt-auto pt-2">
          <button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await approvePost(post.id);
                setStatus("approved");
              });
            }}
            className={`btn flex-1 ${status === "approved" ? "btn-primary" : "btn-secondary"}`}
          >
            {status === "approved" ? "✓ Aprobado" : "Aprobar"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await rejectPost(post.id);
                setStatus("rejected");
              });
            }}
            className="btn btn-secondary"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function buildCopyText(post: GeneratedPost): string {
  const parts: string[] = [];
  if (post.title) parts.push(post.title);
  if (post.copy) {
    parts.push("");
    parts.push(post.copy);
  }
  if (post.cta) {
    parts.push("");
    parts.push(post.cta);
  }
  if (post.hashtags && post.hashtags.length > 0) {
    parts.push("");
    parts.push(post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  }
  return parts.join("\n");
}
