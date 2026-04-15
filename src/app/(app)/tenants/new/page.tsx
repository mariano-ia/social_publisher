import Link from "next/link";
import { redirect } from "next/navigation";
import { createTenant, createNewVoiceVersion } from "@/lib/db/queries";
import type { ImageEngine } from "@/lib/db/types";
import { Icon } from "@/components/Icons";

export default function NewTenantPage() {
  async function create(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const website_url = String(formData.get("website_url") ?? "").trim() || null;
    const image_engine = String(formData.get("image_engine") ?? "html") as ImageEngine;

    if (!name || !slug) throw new Error("Nombre y slug obligatorios");

    const tenant = await createTenant({
      slug,
      name,
      website_url,
      image_engine,
      cadence: { ig_feed: 2, li_single: 1, li_carousel: 1, ig_carousel: 0, carousel_slides: 4 },
    });

    await createNewVoiceVersion(tenant.id, {
      archetype: null,
      dimensions: {},
      voice_is: [],
      voice_is_not: [],
      vocabulary_use: [],
      vocabulary_avoid: [],
      signature_phrases: [],
      dos: [],
      donts: [],
      pillars: [],
      monthly_themes: [],
      sample_copy: [],
      language: "es",
      language_rules: null,
      system_prompt_override: null,
    });

    redirect(`/t/${slug}/voice`);
  }

  return (
    <div className="p-12 max-w-2xl animate-in">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold"
      >
        ← Cuentas
      </Link>
      <h1 className="font-display text-5xl uppercase tracking-tight mt-3 mb-2">Nueva cuenta</h1>
      <p className="text-[var(--text-dim)] mb-8 max-w-md">
        Creamos la cuenta y te llevamos al editor de voz para configurar la personalidad de la marca.
      </p>

      <form action={create} className="card p-8 flex flex-col gap-6">
        <Field label="Nombre de la marca" hint="Cómo se muestra en el dashboard.">
          <input type="text" name="name" required placeholder="Mi Marca" autoFocus />
        </Field>

        <Field label="Slug" hint="URL-safe, solo letras, números y guiones. Se usa en los URLs internos.">
          <input type="text" name="slug" required placeholder="mi-marca" />
        </Field>

        <Field label="Sitio web" hint="Opcional. Lo usamos para análisis automático de voz en el futuro.">
          <input type="url" name="website_url" placeholder="https://mimarca.com" />
        </Field>

        <Field label="Sistema visual" hint="Cómo generamos las imágenes de esta cuenta.">
          <select name="image_engine" defaultValue="html">
            <option value="html">HTML diseñado · sin fotos, solo tipografía y color</option>
            <option value="argo_photo_panel">Foto editorial + overlay · con fotos generadas por IA</option>
          </select>
        </Field>

        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
          <button type="submit" className="btn btn-primary btn-lg">
            <Icon.Plus size={16} />
            Crear cuenta
          </button>
          <Link href="/" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <div>
        <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
        {hint && <div className="text-xs text-[var(--text-dim)] mt-0.5">{hint}</div>}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}
