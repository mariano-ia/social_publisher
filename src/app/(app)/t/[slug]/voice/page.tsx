import { notFound, redirect } from "next/navigation";
import { getTenantBySlug, getActiveVoiceVersion, createNewVoiceVersion } from "@/lib/db/queries";
import type { Archetype, VoiceDimensions, Pillar, SampleCopy } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function VoiceEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const voice = await getActiveVoiceVersion(tenant.id);

  async function save(formData: FormData) {
    "use server";
    const t = await getTenantBySlug(slug);
    if (!t) throw new Error("not found");

    const dims: VoiceDimensions = {
      formal_casual: Number(formData.get("dim_formal_casual") ?? 5),
      serious_playful: Number(formData.get("dim_serious_playful") ?? 5),
      technical_simple: Number(formData.get("dim_technical_simple") ?? 5),
      reserved_bold: Number(formData.get("dim_reserved_bold") ?? 5),
    };

    const splitLines = (k: string) =>
      String(formData.get(k) ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

    const splitTags = (k: string) =>
      String(formData.get(k) ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const pillarsRaw = splitLines("pillars");
    const pillars: Pillar[] = pillarsRaw.map((line) => {
      const [name, weight] = line.split("|").map((s) => s.trim());
      return { name, weight: weight ? Number(weight) : 1 };
    });

    const samplesRaw = splitLines("sample_copy");
    const sample_copy: SampleCopy[] = samplesRaw.map((line) => {
      const [context, ...rest] = line.split("::");
      return { context: context.trim(), sample: rest.join("::").trim() };
    });

    await createNewVoiceVersion(t.id, {
      archetype: (formData.get("archetype") || null) as Archetype | null,
      dimensions: dims,
      voice_is: splitTags("voice_is"),
      voice_is_not: splitTags("voice_is_not"),
      vocabulary_use: splitTags("vocabulary_use"),
      vocabulary_avoid: splitTags("vocabulary_avoid"),
      signature_phrases: splitLines("signature_phrases"),
      dos: splitLines("dos"),
      donts: splitLines("donts"),
      pillars,
      monthly_themes: splitLines("monthly_themes"),
      sample_copy,
      language: String(formData.get("language") ?? "es"),
      language_rules: String(formData.get("language_rules") ?? "") || null,
      system_prompt_override: String(formData.get("system_prompt_override") ?? "") || null,
    });
    redirect(`/t/${slug}`);
  }

  return (
    <div className="p-12 max-w-4xl">
      <div className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-2">
        {tenant.name} · Brand voice
      </div>
      <h1 className="font-display text-5xl uppercase tracking-tight mb-2">
        Editar voz {voice ? `(actual: v${voice.version})` : "(primera versión)"}
      </h1>
      <p className="text-[var(--text-dim)] mb-8 text-sm">
        Guardar crea una nueva versión y la marca como activa. Las viejas no se borran.
      </p>

      <form action={save} className="card p-8 flex flex-col gap-6">
        <Field label="Override de system prompt (opcional, anula el form completo)">
          <textarea
            name="system_prompt_override"
            rows={6}
            defaultValue={voice?.system_prompt_override ?? ""}
            placeholder="Si dejás esto vacío, el sistema arma el prompt desde los campos de abajo. Si lo llenás, ese texto se usa literal y los demás se ignoran."
          />
        </Field>

        <Field label="Arquetipo">
          <select name="archetype" defaultValue={voice?.archetype ?? ""}>
            <option value="">— elegir —</option>
            <option value="authority">Authority — experto, confiable, basado en datos</option>
            <option value="innovator">Innovator — visionario, futuro, disruptivo</option>
            <option value="friend">Friend — cálido, accesible, empático</option>
            <option value="rebel">Rebel — audaz, contrarian, irreverente</option>
            <option value="guide">Guide — sabio, paciente, metódico</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Formal ↔ Casual (1-10)">
            <input type="number" min={1} max={10} name="dim_formal_casual" defaultValue={voice?.dimensions?.formal_casual ?? 5} />
          </Field>
          <Field label="Serio ↔ Playful (1-10)">
            <input type="number" min={1} max={10} name="dim_serious_playful" defaultValue={voice?.dimensions?.serious_playful ?? 5} />
          </Field>
          <Field label="Técnico ↔ Simple (1-10)">
            <input type="number" min={1} max={10} name="dim_technical_simple" defaultValue={voice?.dimensions?.technical_simple ?? 5} />
          </Field>
          <Field label="Reservado ↔ Bold (1-10)">
            <input type="number" min={1} max={10} name="dim_reserved_bold" defaultValue={voice?.dimensions?.reserved_bold ?? 5} />
          </Field>
        </div>

        <Field label="Voz IS (separado por coma)">
          <input type="text" name="voice_is" defaultValue={voice?.voice_is.join(", ") ?? ""} placeholder="directo, confiado, claro" />
        </Field>
        <Field label="Voz IS NOT (separado por coma)">
          <input type="text" name="voice_is_not" defaultValue={voice?.voice_is_not.join(", ") ?? ""} placeholder="arrogante, vago, corporativo" />
        </Field>
        <Field label="Vocabulario a usar (separado por coma)">
          <input type="text" name="vocabulary_use" defaultValue={voice?.vocabulary_use.join(", ") ?? ""} />
        </Field>
        <Field label="Vocabulario a evitar (separado por coma)">
          <input type="text" name="vocabulary_avoid" defaultValue={voice?.vocabulary_avoid.join(", ") ?? ""} />
        </Field>

        <Field label="Frases firma (una por línea)">
          <textarea name="signature_phrases" rows={3} defaultValue={voice?.signature_phrases.join("\n") ?? ""} />
        </Field>

        <Field label="Pilares de contenido (una por línea, formato: nombre | peso)">
          <textarea
            name="pillars"
            rows={4}
            defaultValue={voice?.pillars.map((p) => `${p.name} | ${p.weight ?? 1}`).join("\n") ?? ""}
            placeholder="anti-pattern | 2&#10;process | 2&#10;objection | 2&#10;reframe | 2&#10;manifesto | 1"
          />
        </Field>

        <Field label="Temas mensuales (uno por línea)">
          <textarea name="monthly_themes" rows={4} defaultValue={voice?.monthly_themes.join("\n") ?? ""} />
        </Field>

        <Field label="Do's (uno por línea)">
          <textarea name="dos" rows={4} defaultValue={voice?.dos.join("\n") ?? ""} />
        </Field>
        <Field label="Don'ts (uno por línea)">
          <textarea name="donts" rows={4} defaultValue={voice?.donts.join("\n") ?? ""} />
        </Field>

        <Field label="Ejemplos de copy (una por línea, formato: contexto :: texto del ejemplo)">
          <textarea
            name="sample_copy"
            rows={6}
            defaultValue={voice?.sample_copy.map((s) => `${s.context} :: ${s.sample}`).join("\n") ?? ""}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Language code">
            <input type="text" name="language" defaultValue={voice?.language ?? "es"} />
          </Field>
          <div className="col-span-2">
            <Field label="Reglas de idioma">
              <input type="text" name="language_rules" defaultValue={voice?.language_rules ?? ""} placeholder="Ej: voseo rioplatense informal, slang inglés permitido en términos técnicos" />
            </Field>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button type="submit" className="btn btn-primary">
            Guardar como nueva versión
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
