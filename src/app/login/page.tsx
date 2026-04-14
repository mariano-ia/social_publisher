import { redirect } from "next/navigation";
import { setAuthCookie, checkPassword } from "@/lib/auth";

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
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card p-10 w-full max-w-md">
        <h1 className="font-display text-5xl uppercase tracking-tight mb-2">Social Publisher</h1>
        <p className="text-[var(--text-dim)] text-sm mb-8">Multi-tenant autonomous content generator</p>

        <form action={login} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
              Password
            </span>
            <input type="password" name="password" autoFocus required />
          </label>
          {params.error && (
            <p className="text-[var(--danger)] text-sm">Password incorrecta.</p>
          )}
          <button type="submit" className="btn btn-primary mt-2">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
