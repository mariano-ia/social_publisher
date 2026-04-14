import { redirect } from "next/navigation";
import { setAuthCookie, checkPassword } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    if (!checkPassword(password)) {
      redirect(`/login?error=invalid${params.next ? `&next=${params.next}` : ""}`);
    }
    await setAuthCookie();
    redirect(params.next || "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, var(--accent-glow) 0%, transparent 40%)",
        }}
      />

      <div className="card p-10 w-full max-w-md relative animate-in">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        <h1 className="font-display text-3xl uppercase tracking-tight mb-2">Bienvenido</h1>
        <p className="text-[var(--text-dim)] text-sm mb-8">
          Accedé con tu contraseña para empezar a generar contenido.
        </p>

        <form action={login} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)] font-semibold">
              Contraseña
            </span>
            <input type="password" name="password" autoFocus required />
          </label>
          {params.error && (
            <div className="text-[var(--danger)] text-sm bg-[var(--bg-surface)] border border-[var(--danger)] border-opacity-40 rounded-lg p-3">
              Contraseña incorrecta. Probá de nuevo.
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg mt-2">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
