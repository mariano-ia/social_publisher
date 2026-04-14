import Link from "next/link";
import { listTenants } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenants = await listTenants();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-8">
        <Link href="/" className="font-display text-2xl uppercase tracking-tight">
          Social Publisher
        </Link>

        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            className="text-sm py-2 px-3 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            Dashboard
          </Link>
          <Link
            href="/tenants/new"
            className="text-sm py-2 px-3 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            + Nuevo tenant
          </Link>
        </nav>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-3 px-3">
            Tenants
          </div>
          <div className="flex flex-col gap-1">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.slug}`}
                className="text-sm py-2 px-3 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                {t.name}
              </Link>
            ))}
            {tenants.length === 0 && (
              <span className="text-xs text-[var(--text-faint)] px-3">Sin tenants todavía</span>
            )}
          </div>
        </div>

        <div className="mt-auto text-[10px] text-[var(--text-faint)] px-3">v0.1.0 · MVP</div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
