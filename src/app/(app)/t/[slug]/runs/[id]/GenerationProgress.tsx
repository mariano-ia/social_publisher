"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const COPY_MESSAGES = [
  "Leyendo la voz de tu marca…",
  "Revisando qué publicaste en los últimos 60 días…",
  "Buscando ángulos que nadie está contando…",
  "Escribiendo los hooks…",
  "Afinando el tono…",
  "Puliendo los hashtags…",
  "Claude está pensando más de lo normal, aguantá…",
];

const IMAGES_MESSAGES = [
  "Eligiendo la mejor paleta para cada pieza…",
  "Renderizando los tipos grandes…",
  "Componiendo las fotos con los paneles…",
  "Pintando los decorativos…",
  "Ajustando contraste de los títulos…",
  "Últimos retoques…",
];

const PENDING_MESSAGES = [
  "Todo en su lugar, arrancamos…",
  "Encolando tu tanda…",
];

interface Props {
  status: string;
  startedAt: string;
  assetsDone: number;
  assetsExpected: number;
  postSlots: Array<{ order: number; done: boolean; partial: boolean }>;
}

export function GenerationProgress({ status, startedAt, assetsDone, assetsExpected, postSlots }: Props) {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );

  // Poll the server every 3s for status updates
  useEffect(() => {
    const i = setInterval(() => {
      router.refresh();
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 3000);
    return () => clearInterval(i);
  }, [router, startedAt]);

  // Rotate playful messages every 2.8s
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2800);
    return () => clearInterval(i);
  }, []);

  // Progress percentage: weight the phases
  // - generating (Claude copy): 0-30%
  // - images_pending: 30-95% proportional to assetsDone/expected
  // - the rest is buffer for final touches
  let pct = 5;
  if (status === "pending") pct = 2;
  else if (status === "generating") pct = 15 + Math.min(elapsed * 0.2, 15);
  else if (status === "images_pending") {
    const ratio = assetsExpected > 0 ? assetsDone / assetsExpected : 0;
    pct = 30 + ratio * 65;
  } else if (status === "ready_for_review") pct = 100;

  const pool =
    status === "generating"
      ? COPY_MESSAGES
      : status === "images_pending"
        ? IMAGES_MESSAGES
        : PENDING_MESSAGES;
  const message = pool[tick % pool.length];

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
  };

  return (
    <div className="card p-10 mb-8 relative overflow-hidden animate-in">
      {/* Gradient background shimmer */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0%, var(--accent-glow) 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 rounded-full bg-[var(--accent)] pulse-accent" />
            <div className="absolute inset-0 rounded-full bg-[var(--accent)]" />
          </div>
          <div className="chip">En proceso</div>
          <div className="ml-auto text-xs text-[var(--text-faint)] tabular-nums">
            {fmtTime(elapsed)} transcurridos
          </div>
        </div>

        <h2 className="font-display text-3xl uppercase tracking-tight mb-2">Generando tu contenido</h2>
        <p
          key={message}
          className="text-[var(--text-muted)] text-lg mb-8 animate-in transition-opacity"
        >
          {message}
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-dim)] mb-2 font-semibold">
            <span>Progreso</span>
            <span className="tabular-nums text-[var(--accent)]">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 bg-[var(--bg-surface-2)] rounded-full overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] transition-[width] duration-[2800ms] ease-out"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute inset-0 shimmer opacity-40"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Detail: assets counter + per-slot markers */}
        {status === "images_pending" && (
          <div className="flex items-center gap-4 mt-6 text-xs">
            <div className="text-[var(--text-muted)] font-semibold tabular-nums">
              {assetsDone} / {assetsExpected} imágenes
            </div>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              {postSlots.map((slot) => (
                <div
                  key={slot.order}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums transition-colors ${
                    slot.done
                      ? "bg-[var(--accent)] text-white"
                      : slot.partial
                        ? "bg-[var(--accent-glow-strong)] text-[var(--accent-light)] pulse-accent"
                        : "bg-[var(--bg-surface)] text-[var(--text-faint)]"
                  }`}
                  title={`Post ${slot.order}`}
                >
                  {slot.order}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
