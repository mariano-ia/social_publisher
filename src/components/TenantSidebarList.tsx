"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface InitialTenant {
  id: string;
  slug: string;
  name: string;
}

interface StatusEntry {
  slug: string;
  activeStatus: string | null;
  recentlyFinished: boolean;
}

/**
 * Tenant list in the sidebar with live status indicators.
 * Polls /api/tenants/status every 5s to show:
 *  - spinner while a tenant has an active run (generating / images_pending)
 *  - brief check pulse after a run just finished (<90s ago)
 *  - plain dot otherwise
 */
export function TenantSidebarList({ initialTenants }: { initialTenants: InitialTenant[] }) {
  const [statuses, setStatuses] = useState<Record<string, StatusEntry>>({});

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch("/api/tenants/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { tenants: StatusEntry[] };
        if (!alive) return;
        const map: Record<string, StatusEntry> = {};
        for (const t of data.tenants) map[t.slug] = t;
        setStatuses(map);
      } catch {
        /* network hiccup, will retry next tick */
      }
    }

    poll(); // fire immediately on mount
    const i = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, []);

  return (
    <div className="flex flex-col gap-0.5">
      {initialTenants.map((t) => {
        const st = statuses[t.slug];
        const active = !!st?.activeStatus;
        const justFinished = !!st?.recentlyFinished;
        return (
          <Link
            key={t.id}
            href={`/t/${t.slug}`}
            className="text-sm py-2.5 px-3 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-3 transition-colors"
          >
            <StatusDot active={active} justFinished={justFinished} />
            <span className="truncate flex-1">{t.name}</span>
            {active && (
              <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-light)] font-semibold">
                {st?.activeStatus === "generating" ? "copy" : "render"}
              </span>
            )}
          </Link>
        );
      })}
      {initialTenants.length === 0 && (
        <span className="text-xs text-[var(--text-faint)] px-3 py-2">Todavía no hay cuentas.</span>
      )}
    </div>
  );
}

function StatusDot({ active, justFinished }: { active: boolean; justFinished: boolean }) {
  if (active) {
    return (
      <span className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
        <svg
          className="animate-spin"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          style={{ color: "var(--accent)" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (justFinished) {
    return (
      <span className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "var(--success)", opacity: 0.4 }}
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--success)" }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />;
}
