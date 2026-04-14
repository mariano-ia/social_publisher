import Link from "next/link";
import { listTenants } from "@/lib/db/queries";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenants = await listTenants();

  return (
    <div className="min-h-screen flex">
      <aside className="w-72 border-r border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-8">
        <Link href="/" className="block">
          <Logo size="md" />
        </Link>

        <nav className="flex flex-col gap-1">
          <NavLink href="/" icon={<Icon.Grid size={16} />} label="Dashboard" />
          <NavLink href="/tenants/new" icon={<Icon.Plus size={16} />} label="Nueva cuenta" />
        </nav>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)] font-semibold mb-3 px-3">
            Cuentas
          </div>
          <div className="flex flex-col gap-0.5">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.slug}`}
                className="text-sm py-2.5 px-3 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-3 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span className="truncate">{t.name}</span>
              </Link>
            ))}
            {tenants.length === 0 && (
              <span className="text-xs text-[var(--text-faint)] px-3 py-2">Todavía no hay cuentas.</span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--border)]">
          <div className="text-[10px] text-[var(--text-faint)] px-2 font-medium">v0.1 · MVP</div>
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm py-2.5 px-3 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-3 transition-colors"
    >
      <span className="text-[var(--text-faint)]">{icon}</span>
      {label}
    </Link>
  );
}
