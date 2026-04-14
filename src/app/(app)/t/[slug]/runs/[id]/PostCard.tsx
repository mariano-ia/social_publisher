"use client";

import { useState, useTransition } from "react";
import type { GeneratedPost, GeneratedAsset, VisualTemplate } from "@/lib/db/types";
import { approvePost, rejectPost, changeTemplate } from "./actions";

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

  const isCarousel = post.format === "li_carousel";
  const slides = assets.filter((a) => a.kind === "slide").sort((a, b) => (a.slide_index ?? 0) - (b.slide_index ?? 0));
  const single = assets.find((a) => a.kind === "single");

  const currentAsset = isCarousel ? slides[currentSlide] : single;

  return (
    <div
      className={`card overflow-hidden flex flex-col ${
        status === "approved"
          ? "border-[var(--success)]"
          : status === "rejected"
            ? "border-[var(--danger)] opacity-60"
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
          <div className="text-[var(--text-faint)] text-sm">sin imagen</div>
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

        <p className="text-xs text-[var(--text-dim)] line-clamp-3">{post.copy}</p>

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
