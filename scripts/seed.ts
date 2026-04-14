/**
 * Seed initial data for Social Publisher.
 *
 * Creates 2 tenants (Argo + Yacaré), each with a v1 brand voice and the
 * appropriate visual templates. Idempotent: re-running won't duplicate.
 *
 * Run: `npm run seed`
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { ARGO_LEGACY_SYSTEM_PROMPT } from "../src/lib/prompts/argo-legacy";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("→ Seeding Argo…");
  await seedArgo();
  console.log("→ Seeding Yacaré…");
  await seedYacare();
  console.log("✓ Done.");
}

async function seedArgo() {
  const slug = "argo";
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", slug).maybeSingle();
  let tenantId: string;

  if (existing) {
    tenantId = (existing as { id: string }).id;
    console.log(`  - tenant exists (${tenantId.slice(0, 8)})`);
  } else {
    const { data, error } = await sb
      .from("tenants")
      .insert({
        slug,
        name: "Argo Method",
        website_url: "https://argomethod.com",
        image_engine: "argo_photo_panel",
        cadence: { ig_feed: 4, li_single: 2, li_carousel: 2, carousel_slides: 5 },
      })
      .select()
      .single();
    if (error) throw error;
    tenantId = (data as { id: string }).id;
    console.log(`  + tenant created (${tenantId.slice(0, 8)})`);
  }

  // Voice version with system_prompt_override
  const { data: voiceExists } = await sb
    .from("brand_voice_versions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();
  if (!voiceExists) {
    await sb.from("brand_voice_versions").insert({
      tenant_id: tenantId,
      version: 1,
      is_active: true,
      archetype: "authority",
      dimensions: { formal_casual: 4, serious_playful: 3, technical_simple: 5, reserved_bold: 5 },
      voice_is: ["profesional", "humano", "preciso", "accionable"],
      voice_is_not: ["marketing vacío", "sentencioso", "vago"],
      vocabulary_use: ["Odisea", "perfil", "arquetipo", "ritmo interno", "DISC", "entrenador"],
      vocabulary_avoid: ["revolucionario", "disruptivo", "game changer", "control", "rígido"],
      signature_phrases: ["en Argo creemos que…"],
      dos: [
        "Español latam neutro, tuteo (tú/usted según contexto), nunca voseo",
        "Frases cortas, voz activa",
        "Datos concretos cuando los hay",
      ],
      donts: [
        "No usar términos prohibidos del glosario (control, dominación, agresividad)",
        "No inventar estadísticas",
        "No diagnósticos rígidos",
      ],
      pillars: [
        { name: "ciencia_metodologia", weight: 1, description: "DISC aplicado al deporte, ritmo interno, perfilado conductual" },
        { name: "educacion_deportiva", weight: 1, description: "Contenido de valor para entrenadores y educadores" },
        { name: "producto", weight: 1, description: "Qué hace Argo, cómo se usa, casos de uso" },
      ],
      monthly_themes: [
        "Cada deportista es diferente",
        "El entrenador que conecta",
        "Por qué algunos niños rinden y otros no",
        "El informe que cambia el juego",
        "DISC en el deporte",
        "El ritmo interno del deportista",
      ],
      sample_copy: [],
      language: "es",
      language_rules: "Español latam neutro. Tuteo (tú/usted según contexto). NUNCA voseo.",
      system_prompt_override: ARGO_LEGACY_SYSTEM_PROMPT,
    });
    console.log("  + brand_voice_versions v1 (with override)");
  } else {
    console.log("  - brand_voice exists");
  }

  // Visual templates
  await upsertTemplate(tenantId, {
    slug: "argo-photo-panel-igfeed",
    format: "ig_feed",
    engine: "argo_photo_panel",
    weight: 1,
    description: "Foto+panel split horizontal 1:1 (gpt-image-1 con STYLE_BASE)",
  });
  await upsertTemplate(tenantId, {
    slug: "argo-photo-panel-lisingle",
    format: "li_single",
    engine: "argo_photo_panel",
    weight: 1,
    description: "Foto+panel split horizontal 3:2 (gpt-image-1 con STYLE_BASE)",
  });
  await upsertTemplate(tenantId, {
    slug: "argo-photo-panel-carousel",
    format: "li_carousel_slide",
    engine: "argo_photo_panel",
    weight: 1,
    description: "Foto+panel split vertical 4:5 para slides de carrusel (gpt-image-1)",
  });
}

async function seedYacare() {
  const slug = "yacare";
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", slug).maybeSingle();
  let tenantId: string;

  if (existing) {
    tenantId = (existing as { id: string }).id;
    console.log(`  - tenant exists (${tenantId.slice(0, 8)})`);
  } else {
    const { data, error } = await sb
      .from("tenants")
      .insert({
        slug,
        name: "Yacaré",
        website_url: "https://www.yacare.io",
        image_engine: "html",
        cadence: { ig_feed: 4, li_single: 2, li_carousel: 2, carousel_slides: 5 },
      })
      .select()
      .single();
    if (error) throw error;
    tenantId = (data as { id: string }).id;
    console.log(`  + tenant created (${tenantId.slice(0, 8)})`);
  }

  const { data: voiceExists } = await sb
    .from("brand_voice_versions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();
  if (!voiceExists) {
    await sb.from("brand_voice_versions").insert({
      tenant_id: tenantId,
      version: 1,
      is_active: true,
      archetype: "rebel",
      dimensions: { formal_casual: 7, serious_playful: 5, technical_simple: 6, reserved_bold: 9 },
      voice_is: ["directo", "confiado", "obsesionado por outcomes", "anti-fluff", "contrarian"],
      voice_is_not: ["arrogante", "corporativo", "vendedor de horas", "marketing vacío"],
      vocabulary_use: [
        "product judgment",
        "shipping",
        "outcomes",
        "discovery",
        "growth",
        "MVP",
        "stack",
        "claridad",
      ],
      vocabulary_avoid: [
        "disruptivo",
        "revolucionario",
        "compañía emergente",
        "soluciones",
        "sinergia",
        "startup emergente",
      ],
      signature_phrases: ["Just sharp execution", "No fluff", "We don't sell hours"],
      dos: [
        "Voseo rioplatense informal",
        "Permitido slang inglés del rubro (product-market fit, MVP, shipping, discovery)",
        "Frases cortas, directas",
        "Llamada a la acción al final cuando aplique",
      ],
      donts: [
        "No spanglish forzado",
        "No traducir 'B2B SaaS'",
        "No usar 'startup emergente' ni similares",
      ],
      pillars: [
        { name: "anti-pattern", weight: 2, description: "Toma contrarian fuerte sobre prácticas comunes del rubro" },
        { name: "process", weight: 2, description: "Explicación de un paso del método Understand→Shape→Build→Learn" },
        { name: "objection", weight: 2, description: "FAQ con respuesta directa a una pregunta común del cliente" },
        { name: "reframe", weight: 2, description: "Concept flip / reframe insightful sobre cómo se ve un problema" },
        { name: "manifesto", weight: 1, description: "Statement largo de marca con peso variado" },
      ],
      monthly_themes: [
        "Por qué la mayoría de productos B2B fallan en discovery, no en delivery",
        "El error de empezar por la UI",
        "Discovery vs delivery: dónde se pierde el tiempo",
        "MVPs honestos: shipping menos para aprender más",
        "Equipos chicos que envían vs equipos grandes que diseñan",
      ],
      sample_copy: [
        {
          context: "Contrarian take en Instagram",
          sample: "Dejá de contratar fábricas que diseñan pantallas. Necesitás product judgment.",
        },
        {
          context: "Process step",
          sample: "Step 01 — Understand. Antes que exista un solo pixel, mapeamos usuarios, problema y dirección. Sin atajos.",
        },
        {
          context: "FAQ card",
          sample: "¿Pueden trabajar con nuestro equipo interno? Sí. Nos integramos directo con founders, devs y product. Sin pisarse.",
        },
        {
          context: "Reframe",
          sample: "La interfaz no es el punto de partida. Es el resultado.",
        },
        {
          context: "Manifesto",
          sample: "Diseñamos, construimos y escalamos productos B2B SaaS. Sin equipos inflados. Sin proyectos eternos sin dirección. Just sharp execution.",
        },
      ],
      language: "es-AR",
      language_rules:
        "Español 95% rioplatense informal (voseo: 'tenés', 'sabés', 'pensá'). Permitido y bienvenido el slang inglés del rubro tech: 'product-market fit', 'MVP', 'stack', 'shipping', 'discovery', 'growth', 'B2B SaaS' — NO traducir estos términos. Evitar spanglish forzado o traducciones torpes.",
      system_prompt_override: null,
    });
    console.log("  + brand_voice_versions v1 (structured)");
  } else {
    console.log("  - brand_voice exists");
  }

  // Visual templates — Yacaré 5 HTML templates (multi format = sirven para los 3)
  const ycSlugs = [
    { slug: "yc-contrarian-take", description: "Toma contrarian agresiva (anti-pattern + manifiesto)" },
    { slug: "yc-process-step", description: "Explicación de un paso del método" },
    { slug: "yc-faq-card", description: "FAQ con pregunta + respuesta directa" },
    { slug: "yc-reframe", description: "Concept flip / reframe insightful" },
    { slug: "yc-manifesto-block", description: "Statement largo de marca con peso variado" },
  ];
  for (const t of ycSlugs) {
    await upsertTemplate(tenantId, {
      slug: t.slug,
      format: "multi",
      engine: "html",
      weight: t.slug === "yc-manifesto-block" ? 1 : 2,
      description: t.description,
    });
  }
}

async function upsertTemplate(
  tenantId: string,
  input: {
    slug: string;
    format: "ig_feed" | "li_single" | "li_carousel_slide" | "multi";
    engine: "argo_photo_panel" | "html";
    weight: number;
    description: string;
  },
) {
  const { data: existing } = await sb
    .from("visual_templates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("slug", input.slug)
    .maybeSingle();
  if (existing) {
    console.log(`  - template ${input.slug} exists`);
    return;
  }
  await sb.from("visual_templates").insert({ tenant_id: tenantId, ...input, is_active: true });
  console.log(`  + template ${input.slug}`);
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
