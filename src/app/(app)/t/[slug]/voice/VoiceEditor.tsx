"use client";

import { useState } from "react";
import type { BrandVoiceVersion, Archetype } from "@/lib/db/types";

interface Props {
  voice: BrandVoiceVersion | null;
  saveAction: (formData: FormData) => void;
}

const DIM_LABELS = [
  { key: "formal_casual", left: "Formal", right: "Casual" },
  { key: "serious_playful", left: "Serio", right: "Playful" },
  { key: "technical_simple", left: "Técnico", right: "Simple" },
  { key: "reserved_bold", left: "Reservado", right: "Bold" },
] as const;

type DimKey = (typeof DIM_LABELS)[number]["key"];

export function VoiceEditor({ voice, saveAction }: Props) {
  const initial = (k: DimKey) => (voice?.dimensions?.[k] as number | undefined) ?? 5;
  const [dims, setDims] = useState<Record<DimKey, number>>({
    formal_casual: initial("formal_casual"),
    serious_playful: initial("serious_playful"),
    technical_simple: initial("technical_simple"),
    reserved_bold: initial("reserved_bold"),
  });

  return (
    <form action={saveAction} className="card p-10 flex flex-col gap-10 animate-in">
      {/* Override */}
      <Field
        label="Prompt custom (opcional)"
        hint="Si lo llenás, este texto se usa literal como system prompt y los demás campos se ignoran. Dejalo vacío para que el sistema construya el prompt automáticamente desde los campos de abajo."
      >
        <textarea
          name="system_prompt_override"
          rows={5}
          defaultValue={voice?.system_prompt_override ?? ""}
          placeholder="Solo si necesitás control total del prompt. Para la mayoría de casos, dejá vacío y usá los campos estructurados."
        />
      </Field>

      {/* Archetype */}
      <Field
        label="Arquetipo de marca"
        hint="El arquetipo guía el tono general. Elegí el que más represente la personalidad que querés proyectar."
      >
        <select name="archetype" defaultValue={voice?.archetype ?? ""}>
          <option value="">— Elegir arquetipo —</option>
          <option value="authority">Authority · experto, preciso, confiable</option>
          <option value="innovator">Innovator · visionario, disruptivo, forward</option>
          <option value="friend">Friend · cálido, accesible, empático</option>
          <option value="rebel">Rebel · audaz, contrarian, irreverente</option>
          <option value="guide">Guide · sabio, metódico, paciente</option>
        </select>
      </Field>

      {/* Dimensions — proper sliders */}
      <div>
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] font-semibold mb-1">
            Dimensiones de voz
          </div>
          <p className="text-sm text-[var(--text-dim)]">
            Movelos para calibrar el tono. Los valores se traducen en instrucciones concretas para el
            generador.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {DIM_LABELS.map(({ key, left, right }) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[var(--text-muted)]">{left}</span>
                <span className="text-[var(--text)] tabular-nums">
                  <span className="text-[var(--accent)]">{dims[key]}</span>
                  <span className="text-[var(--text-faint)]"> / 10</span>
                </span>
                <span className="text-[var(--text-muted)]">{right}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={dims[key]}
                onChange={(e) => setDims({ ...dims, [key]: Number(e.target.value) })}
                name={`dim_${key}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Voice IS / IS NOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Nuestra voz ES" hint="Adjetivos separados por coma. Ej: directo, confiado, claro.">
          <input
            type="text"
            name="voice_is"
            defaultValue={voice?.voice_is.join(", ") ?? ""}
            placeholder="directo, confiado, claro, bold"
          />
        </Field>
        <Field label="Nuestra voz NO ES" hint="Lo que evitamos sonar. Ej: arrogante, vago, corporativo.">
          <input
            type="text"
            name="voice_is_not"
            defaultValue={voice?.voice_is_not.join(", ") ?? ""}
            placeholder="arrogante, vago, corporativo, marketing vacío"
          />
        </Field>
      </div>

      {/* Vocabulary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Palabras que usamos" hint="Términos del rubro, jerga intencional, vocabulario propio.">
          <input
            type="text"
            name="vocabulary_use"
            defaultValue={voice?.vocabulary_use.join(", ") ?? ""}
            placeholder="product judgment, shipping, discovery"
          />
        </Field>
        <Field label="Palabras prohibidas" hint="Clichés, términos del rubro que evitamos, buzzwords.">
          <input
            type="text"
            name="vocabulary_avoid"
            defaultValue={voice?.vocabulary_avoid.join(", ") ?? ""}
            placeholder="disruptivo, sinergia, revolucionario"
          />
        </Field>
      </div>

      <Field label="Frases firma" hint="Frases recurrentes que son característicamente tuyas. Una por línea.">
        <textarea
          name="signature_phrases"
          rows={3}
          defaultValue={voice?.signature_phrases.join("\n") ?? ""}
          placeholder={`Just sharp execution\nNo fluff\nWe don't sell hours`}
        />
      </Field>

      <Field
        label="Pilares de contenido"
        hint="Una por línea, formato: nombre | peso. El peso determina la frecuencia relativa en cada tanda."
      >
        <textarea
          name="pillars"
          rows={5}
          defaultValue={voice?.pillars.map((p) => `${p.name} | ${p.weight ?? 1}`).join("\n") ?? ""}
          placeholder={`anti-pattern | 2\nprocess | 2\nobjection | 2\nreframe | 2\nmanifesto | 1`}
        />
      </Field>

      <Field
        label="Temas mensuales"
        hint="Los temas que rotamos cada mes. Una línea por tema."
      >
        <textarea
          name="monthly_themes"
          rows={4}
          defaultValue={voice?.monthly_themes.join("\n") ?? ""}
          placeholder={`Por qué la mayoría de productos B2B fallan\nEl error de empezar por la UI`}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Reglas Do's" hint="Una por línea. Lo que SÍ hacemos siempre.">
          <textarea
            name="dos"
            rows={4}
            defaultValue={voice?.dos.join("\n") ?? ""}
            placeholder={`Frases cortas\nVoz activa\nDatos concretos cuando los hay`}
          />
        </Field>
        <Field label="Reglas Don'ts" hint="Una por línea. Lo que NUNCA hacemos.">
          <textarea
            name="donts"
            rows={4}
            defaultValue={voice?.donts.join("\n") ?? ""}
            placeholder={`Marketing vacío\nClichés del rubro\nSuperlativos sin evidencia`}
          />
        </Field>
      </div>

      <Field
        label="Ejemplos de copy"
        hint="Ejemplos few-shot para guiar el generador. Una línea por ejemplo, formato: contexto :: texto."
      >
        <textarea
          name="sample_copy"
          rows={6}
          defaultValue={voice?.sample_copy.map((s) => `${s.context} :: ${s.sample}`).join("\n") ?? ""}
          placeholder={`Contrarian take IG :: Dejá de contratar fábricas de pantallas\nProcess step :: Antes de diseñar, entendemos`}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Código de idioma" hint="ISO tipo es, es-AR, en.">
          <input type="text" name="language" defaultValue={voice?.language ?? "es"} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Reglas de idioma" hint="Detalles específicos del idioma: voseo, tuteo, slang permitido.">
            <input
              type="text"
              name="language_rules"
              defaultValue={voice?.language_rules ?? ""}
              placeholder="Español rioplatense, voseo, slang inglés en términos técnicos"
            />
          </Field>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
        <button type="submit" className="btn btn-primary btn-lg">
          Guardar como nueva versión
        </button>
        <a href="../" className="btn btn-ghost">
          Cancelar
        </a>
      </div>
    </form>
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
