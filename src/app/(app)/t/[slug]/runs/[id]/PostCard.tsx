"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedPost, GeneratedAsset, VisualTemplate } from "@/lib/db/types";
import { approvePost, rejectPost, changeTemplate, retryRender } from "./actions";
import { Icon } from "@/components/Icons";
import { formatLabel, formatPlatform, pillarLabel, isCarouselFormat } from "@/lib/display";

interface Props {
  post: GeneratedPost;
  assets: GeneratedAsset[];
  availableTemplates: VisualTemplate[];
}

export function PostCard({ post, assets, availableTemplates }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [status, setStatus] = useState(post.status);
  const [currentTemplate, setCurrentTemplate] = useState(post.visual_template_slug ?? "");
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  const isCarousel = isCarouselFormat(post.format);
  const slides = assets
    .filter((a) => a.kind === "slide")
    .sort((a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0));
  const single = assets.find((a) => a.kind === "single");

  const currentAsset = isCarousel ? slides[currentSlide] : single;
  const imageFailed = status === "image_failed" || assets.length === 0;

  const platform = formatPlatform(post.format);
  const copyText = buildCopyText(post);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 1500);
    } catch {
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
    const slug = toSlug(post.topic ?? post.title ?? "post");
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
      window.open(currentAsset.public_url, "_blank");
    }
  };

  const handleDownloadAllSlides = async () => {
    const slug = toSlug(post.topic ?? post.title ?? "post");
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

  const handleChangeTemplate = (slug: string) => {
    setCurrentTemplate(slug);
    startTransition(async () => {
      await changeTemplate(post.id, slug);
      router.refresh();
    });
  };

  const handleRetryRender = () => {
    startTransition(async () => {
      await retryRender(post.id);
      router.refresh();
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      await approvePost(post.id);
      setStatus("approved");
      router.refresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectPost(post.id);
      setStatus("rejected");
      router.refresh();
    });
  };

  return (
    <div
      className={`card overflow-hidden flex flex-col group ${
        status === "approved"
          ? "border-[var(--success)]"
          : status === "rejected"
            ? "border-[var(--danger)] opacity-60"
            : imageFailed
              ? "border-[var(--warning)]"
              : ""
      }`}
    >
      {/* Image area */}
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
            <div className="text-[var(--text-faint)] text-xs uppercase tracking-[0.18em] mb-3 font-semibold">
              {imageFailed ? "Imagen pendiente" : "Generando…"}
            </div>
            <button
              onClick={handleRetryRender}
              disabled={pending}
              className="btn btn-secondary btn-sm"
            >
              <Icon.Refresh size={14} />
              {pending ? "Reintentando" : "Reintentar"}
            </button>
          </div>
        )}

        {/* Carousel dots */}
        {isCarousel && slides.length > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentSlide ? "bg-white w-6" : "bg-white/30 w-1.5"
                }`}
              />
            ))}
          </div>
        )}

        {/* Platform chip top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 py-1 px-2 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-[0.08em]">
          {platform === "instagram" && <Icon.Instagram size={12} />}
          {platform === "linkedin" && <Icon.LinkedIn size={12} />}
          {formatLabel(post.format)}
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Pillar chip */}
        {post.pillar && (
          <div className="flex">
            <span className="chip chip-accent">{pillarLabel(post.pillar)}</span>
          </div>
        )}

        {/* Title */}
        {post.title && (
          <h3 className="font-display text-xl uppercase leading-tight tracking-tight">
            {post.title}
          </h3>
        )}

        {/* Expand copy */}
        <button
          onClick={() => setShowCopy(!showCopy)}
          className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] text-left font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5"
        >
          <Icon.ChevronRight size={12} className={showCopy ? "rotate-90 transition-transform" : "transition-transform"} />
          Ver copy completo
        </button>
        {showCopy && (
          <textarea
            id={`copy-${post.id}`}
            readOnly
            value={copyText}
            rows={Math.min(14, copyText.split("\n").length + 2)}
            className="w-full font-mono text-[11px] leading-relaxed"
            onFocus={(e) => e.target.select()}
          />
        )}

        {/* Template switcher — pill segmented control */}
        {availableTemplates.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)] font-semibold mb-1.5">
              Estilo visual
            </div>
            <select
              value={currentTemplate}
              onChange={(e) => handleChangeTemplate(e.target.value)}
              disabled={pending}
              className="text-xs"
            >
              {availableTemplates.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.slug.replace(/^(yc|ar)-/, "").replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Spacer push actions to bottom */}
        <div className="flex-1" />

        {/* Action bar: icons with tooltips */}
        <div className="flex items-center gap-1 pt-3 border-t border-[var(--border)]">
          <IconAction
            icon={copiedFlash ? <Icon.Check size={16} /> : <Icon.Copy size={16} />}
            tooltip={copiedFlash ? "Copiado" : "Copiar texto completo"}
            onClick={handleCopy}
            disabled={pending}
            flash={copiedFlash}
          />
          {currentAsset && (
            <IconAction
              icon={<Icon.Download size={16} />}
              tooltip={isCarousel ? `Descargar slide ${currentSlide + 1}` : "Descargar imagen"}
              onClick={handleDownloadImage}
              disabled={pending}
            />
          )}
          {isCarousel && slides.length > 1 && (
            <IconAction
              icon={
                <span className="text-[9px] font-bold px-1 border border-current rounded">
                  ALL
                </span>
              }
              tooltip="Descargar los 5 slides"
              onClick={handleDownloadAllSlides}
              disabled={pending}
            />
          )}
          {imageFailed && currentAsset && (
            <IconAction
              icon={<Icon.Refresh size={16} />}
              tooltip="Regenerar imagen"
              onClick={handleRetryRender}
              disabled={pending}
            />
          )}

          <div className="flex-1" />

          <IconAction
            icon={<Icon.X size={16} />}
            tooltip="Rechazar"
            onClick={handleReject}
            disabled={pending}
            variant={status === "rejected" ? "danger-active" : "default"}
          />
          <IconAction
            icon={<Icon.Check size={16} />}
            tooltip="Aprobar"
            onClick={handleApprove}
            disabled={pending}
            variant={status === "approved" ? "success-active" : "default"}
          />
        </div>
      </div>
    </div>
  );
}

function IconAction({
  icon,
  tooltip,
  onClick,
  disabled,
  flash,
  variant = "default",
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  flash?: boolean;
  variant?: "default" | "success-active" | "danger-active";
}) {
  const classes =
    variant === "success-active"
      ? "bg-[var(--success)] text-white border-[var(--success)]"
      : variant === "danger-active"
        ? "bg-[var(--danger)] text-white border-[var(--danger)]"
        : flash
          ? "bg-[var(--success)] text-white border-[var(--success)]"
          : "bg-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] border-transparent hover:border-[var(--border)]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${classes} group/btn`}
      aria-label={tooltip}
    >
      {icon}
      {/* Tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text)] text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity shadow-lg z-10">
        {tooltip}
      </span>
    </button>
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

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
}
