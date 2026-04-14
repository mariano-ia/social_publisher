import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTenantBySlug, getActiveVoiceVersion, createNewVoiceVersion } from "@/lib/db/queries";
import type { Archetype, VoiceDimensions, Pillar, SampleCopy } from "@/lib/db/types";
import { VoiceEditor } from "./VoiceEditor";

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
      <Link
        href={`/t/${slug}`}
        className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] hover:text-[var(--text)] font-semibold"
      >
        ← {tenant.name}
      </Link>
      <h1 className="font-display text-5xl uppercase tracking-tight mt-3 mb-2">
        Voz y tono
      </h1>
      <p className="text-[var(--text-dim)] mb-8 max-w-xl">
        Cada vez que guardes se crea una **nueva versión**. Las anteriores quedan archivadas y podés
        hacer rollback.
        {voice && (
          <span className="block mt-1 text-xs text-[var(--text-faint)]">
            Versión activa: v{voice.version}
          </span>
        )}
      </p>

      <VoiceEditor voice={voice} saveAction={save} />
    </div>
  );
}
