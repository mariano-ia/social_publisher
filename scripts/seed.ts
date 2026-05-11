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
        cadence: { ig_feed: 2, li_single: 0, li_carousel: 0, ig_carousel: 1, carousel_slides: 4 },
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

  // Visual templates — hybrid pipeline: gpt-image-1 for photos, HTML for UI
  await upsertTemplate(tenantId, {
    slug: "ar-ig-photo",
    format: "multi",
    engine: "argo_photo_panel",
    weight: 3,
    description: "IG feed / LI single con foto editorial gpt-image-1 + panel HTML composited (lavender top, foto+overlay dark, chip naranja, footer violeta). Ideal para escenas deportivas emocionales.",
  });
  await upsertTemplate(tenantId, {
    slug: "ar-ig-minimal",
    format: "multi",
    engine: "argo_photo_panel",
    weight: 2,
    description: "IG feed / LI single variante minimalista clara: fondo casi blanco, foto en contenedor rounded con círculos decorativos detrás, chip naranja + headline en negro debajo, línea acento + url. Ideal para contenido más reflexivo/conceptual, mejor legibilidad.",
  });
  await upsertTemplate(tenantId, {
    slug: "ar-solid-violet",
    format: "multi",
    engine: "html",
    weight: 1,
    description: "IG feed variante B — fondo violeta sólido, sin foto. Para opinión/manifiesto.",
  });
  await upsertTemplate(tenantId, {
    slug: "ar-carousel-content",
    format: "li_carousel_slide",
    engine: "html",
    weight: 2,
    description: "Slide de contenido de carrusel (2-4). Fondo claro, número deco gigante, línea naranja, título Inter Bold.",
  });
  await upsertTemplate(tenantId, {
    slug: "ar-carousel-cta",
    format: "li_carousel_slide",
    engine: "html",
    weight: 1,
    description: "Slide final de carrusel (5). Fondo violeta sólido, círculos decorativos, botón CTA pill blanco.",
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
        cadence: { ig_feed: 2, li_single: 1, li_carousel: 1, ig_carousel: 0, carousel_slides: 5 },
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
      dimensions: { formal_casual: 6, serious_playful: 3, technical_simple: 5, reserved_bold: 8 },
      voice_is: [
        "directo",
        "profesional",
        "concreto (siempre con ejemplo)",
        "confiado sin arrogancia",
        "obsesionado por outcomes",
        "anti-fluff",
      ],
      voice_is_not: [
        "arrogante",
        "corporativo",
        "vendedor de horas",
        "marketing vacío",
        "predicador",
        "condescendiente",
      ],
      vocabulary_use: [
        "product judgment",
        "shipping",
        "outcomes",
        "discovery",
        "MVP",
        "stack",
        "claridad",
        "horas semanales",
        "ahorrar tiempo",
        "automatizar",
        "diagnóstico",
        "48 horas",
        "antes/después",
        "caso concreto",
      ],
      vocabulary_avoid: [
        "disruptivo",
        "revolucionario",
        "compañía emergente",
        "soluciones",
        "sinergia",
        "startup emergente",
        "transformación digital",
        "potenciar",
        "empoderar",
        "revolución de la IA",
        "vos no sabés que",
      ],
      signature_phrases: [
        "No fluff",
        "We don't sell hours",
        "Mostramos qué cambió, no qué prometemos",
      ],
      dos: [
        "Voseo rioplatense informal",
        "Permitido slang inglés del rubro (product-market fit, MVP, shipping, discovery)",
        "Frases cortas, directas",
        "Llamada a la acción al final cuando aplique",
        "Cada post lleva al menos un ejemplo concreto: número, caso o escenario. Sin ejemplo, no se publica.",
        "El rebel apunta al ruido del mercado, NUNCA al lector.",
        "Asumimos siempre que el lector sabe más de su negocio que nosotros.",
      ],
      donts: [
        "No spanglish forzado",
        "No traducir 'B2B SaaS'",
        "No usar 'startup emergente' ni similares",
        "No usar 'transformación digital', 'potenciar', 'empoderar', 'revolución de la IA'",
        "Nunca tratar al lector como si no entendiera. Sin 'vos no sabés que...'.",
        "Nada de manifiestos vacíos: si no hay ejemplo concreto, no se publica.",
      ],
      pillars: [
        { name: "startup_anti_pattern", weight: 1, description: "Toma contrarian sobre el ruido del mercado tech, nunca contra el lector. Audiencia: startups B2B SaaS." },
        { name: "startup_process", weight: 1, description: "Paso del método Understand→Shape→Build→Learn. Audiencia: startups B2B SaaS." },
        { name: "startup_reframe", weight: 1, description: "Concept flip sobre cómo se ve un problema B2B SaaS. Audiencia: startups B2B SaaS." },
        { name: "startup_objection", weight: 1, description: "FAQ con respuesta directa. Audiencia: startups B2B SaaS." },
        { name: "pyme_case", weight: 2, description: "Caso concreto antes/después con número (horas ahorradas, $ ganados). Ideal para carrusel. Audiencia: PYMEs argentinas." },
        { name: "pyme_oportunidad", weight: 1, description: "Qué puede hacer IA hoy que la PYME quizá no sabe que existe. Audiencia: PYMEs argentinas." },
        { name: "pyme_diagnostico", weight: 1, description: "Cómo es la auditoría/diagnóstico de IA de 48hs, qué se entrega. Audiencia: PYMEs argentinas." },
        { name: "pyme_objection", weight: 1, description: "FAQ tipo '¿es caro?', '¿reemplaza gente?', '¿es para mi negocio?'. Audiencia: PYMEs argentinas." },
      ],
      monthly_themes: [
        "Discovery vs delivery: dónde se pierde tiempo en B2B",
        "MVPs honestos: shipping menos para aprender más",
        "Cómo aceleramos discovery con IA sin saltarnos hablar con gente real",
        "Qué puede hacer IA hoy por una PYME (que hace 12 meses no podía)",
        "Casos reales: panadería, contador, distribuidora, agencia chica",
        "Cómo se ve una auditoría IA de 48hs",
        "Mitos sobre IA en PYME: no reemplaza gente, multiplica horas",
        "¿Cuánto cuesta automatizar un proceso?",
      ],
      sample_copy: [
        {
          context: "startup_anti_pattern",
          sample: "Hay 4 herramientas que prometen automatizar discovery. Discovery no se automatiza. Lo que sí se acelera es la transcripción y el análisis temático de las 30 entrevistas que ya hiciste.",
        },
        {
          context: "startup_process",
          sample: "Step 01 — Understand. Antes que exista un solo pixel, mapeamos usuarios, problema y dirección. Con IA aceleramos análisis de transcripts, sin saltarnos hablar con gente real.",
        },
        {
          context: "startup_reframe",
          sample: "La interfaz no es el punto de partida. Es el resultado de entender el problema.",
        },
        {
          context: "startup_objection",
          sample: "¿Pueden trabajar con nuestro equipo interno? Sí. Nos integramos directo con founders, devs y product. Sin pisarse.",
        },
        {
          context: "pyme_case",
          sample: "Estudio contable, 50 clientes, 6hs semanales clasificando facturas. Bot conectado al mail clasifica 600 facturas/mes con 94% de exactitud. Hoy revisan 36 minutos.",
        },
        {
          context: "pyme_oportunidad",
          sample: "Hace 18 meses, atender FAQs en WhatsApp 24/7 era un equipo. Hoy es una tarde de configuración con WhatsApp Business API y un modelo entrenado en tu información.",
        },
        {
          context: "pyme_diagnostico",
          sample: "Auditoría IA de 48hs: 90 minutos de charla, miramos 3 procesos, te entregamos PDF con qué automatizar, qué dejar como está, y cuánto cuesta cada cosa.",
        },
        {
          context: "pyme_objection",
          sample: "'¿Es caro?' Depende. Un bot de FAQs en WhatsApp arranca en menos de lo que cuesta una persona part-time un mes. Te lo decimos exacto después del diagnóstico.",
        },
      ],
      language: "es-AR",
      language_rules:
        "Español 95% rioplatense informal (voseo: 'tenés', 'sabés', 'pensá'). Permitido el slang inglés del rubro tech: 'product-market fit', 'MVP', 'stack', 'shipping', 'discovery', 'growth', 'B2B SaaS' — NO traducir estos términos. Evitar spanglish forzado.\n\nREGLA MAESTRA: el rebel apunta al ruido del mercado, NUNCA al lector. Lo que cuestionamos es el status quo, no la inteligencia de quien nos lee. Asumimos siempre que el lector sabe más de su negocio que nosotros. Lo único que aportamos es qué cambió en lo que IA puede hacer hoy. Cada post lleva al menos un ejemplo concreto (número, caso, escenario). Sin ejemplo, no se publica.",
      system_prompt_override: null,
    });
    console.log("  + brand_voice_versions v1 (structured)");
  } else {
    console.log("  - brand_voice exists");
  }

  // Visual templates — Yacaré HTML templates (multi format = sirven para los 3)
  const ycSlugs = [
    { slug: "yc-contrarian-take", description: "Toma contrarian agresiva (anti-pattern + manifiesto)" },
    { slug: "yc-process-step", description: "Explicación de un paso del método" },
    { slug: "yc-faq-card", description: "FAQ con pregunta + respuesta directa" },
    { slug: "yc-reframe", description: "Concept flip / reframe insightful" },
    { slug: "yc-manifesto-block", description: "Statement largo de marca con peso variado" },
    { slug: "yc-case-stat", description: "Slide de stat/número grande para carouseles PYME tipo caso antes/después. Big number hero + label (ANTES/DESPUÉS) + descriptor de una línea." },
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
