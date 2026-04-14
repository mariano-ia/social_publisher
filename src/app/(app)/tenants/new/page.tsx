import { redirect } from "next/navigation";
import { createTenant, createNewVoiceVersion } from "@/lib/db/queries";
import type { ImageEngine } from "@/lib/db/types";

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
      cadence: { ig_feed: 4, li_single: 2, li_carousel: 2, carousel_slides: 5 },
    });

    // Create empty v1 voice so user can edit
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
    <div className="p-12 max-w-2xl">
      <h1 className="font-display text-5xl uppercase tracking-tight mb-2">Nuevo tenant</h1>
      <p className="text-[var(--text-dim)] mb-8 text-sm">
        Después de crearlo, te llevo al editor de voz para configurar la voz inicial.
      </p>

      <form action={create} className="card p-8 flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
            Nombre
          </span>
          <input type="text" name="name" required placeholder="Mi Marca" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
            Slug (URL-safe)
          </span>
          <input type="text" name="slug" required placeholder="mi-marca" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
            Website (opcional)
          </span>
          <input type="url" name="website_url" placeholder="https://" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
            Image engine
          </span>
          <select name="image_engine" defaultValue="html">
            <option value="html">HTML → PNG (puppeteer, sin fotos)</option>
            <option value="argo_photo_panel">Argo photo+panel (gpt-image-1, con fotos)</option>
          </select>
        </label>

        <button type="submit" className="btn btn-primary self-start mt-2">
          Crear tenant y editar voz
        </button>
      </form>
    </div>
  );
}
