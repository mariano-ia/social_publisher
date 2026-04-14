import Link from "next/link";
import { listTenants } from "@/lib/db/queries";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/Icons";
import { TenantSidebarList } from "@/components/TenantSidebarList";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenants = await listTenants();
  const initialTenants = tenants.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));

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
          <TenantSidebarList initialTenants={initialTenants} />
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
