# Yacaré Brand Voice v2 — Dual audience (Startup + PYME) + tono guide-rebel

Date: 2026-05-11
Status: Approved, in implementation

## Why

El tono v1 de Yacaré ("rebel manifesto" + voseo + "Dejá de…" + "Sin…") era distintivo
pero se estaba volviendo predicador: tratábamos al lector como si no entendiera, y
estábamos cada vez más lejos de aportar valor concreto. Además, el foco de negocio
se está abriendo: además de startups B2B SaaS, ahora apuntamos también a PYMEs
argentinas con propuestas de IA (diagnóstico + productos de impacto en 48hs).

El v2 mantiene la fuerza de la voz, pero **redirige el rebel** (ataca al ruido del
mercado, nunca al lector), suma humildad operativa (siempre con ejemplo concreto)
y abre un eje nuevo de contenido para PYMEs sin renunciar al de startups.

## Decisions

### Audiencia
- **2 públicos en paralelo, peso 50/50**: startups B2B SaaS + PYMEs argentinas.
- Cadencia semanal: **4 publicaciones**, 2 para cada público.
  - 2 Startup: 1 IG feed + 1 LI single
  - 2 PYME: 1 LI carousel (5 slides) + 1 IG feed

Esto cambia la `tenant.cadence` de `{ig_feed:2, li_single:2, li_carousel:1, ig_carousel:0, carousel_slides:4}` (5 posts/batch)
a `{ig_feed:2, li_single:1, li_carousel:1, ig_carousel:0, carousel_slides:5}` (4 posts/batch).

### Tono (archetype + dimensiones)
- **Archetype: `rebel` (sin cambio)** — el rebel se redirige vía `language_rules` y `dos`, no se reemplaza.
- **Dimensiones**: bajaron 1 punto cada una excepto technical_simple. No es un cambio de volumen,
  es un cambio de dirección.
  - formal_casual: 7 → 6
  - serious_playful: 5 → 3
  - technical_simple: 6 → 5
  - reserved_bold: 9 → 8

### Regla maestra (entra en `language_rules`)
> "El rebel apunta al ruido del mercado, **nunca al lector**. Lo que cuestionamos es
> el status quo, no la inteligencia de quien nos lee. Asumimos siempre que el lector
> sabe más de su negocio que nosotros. Lo único que aportamos es qué cambió en lo que
> IA puede hacer hoy. Cada post lleva al menos un ejemplo concreto: número, caso,
> escenario. Sin ejemplo, no se publica."

### Voice IS / IS NOT
- voice_is: directo, profesional, concreto (siempre con ejemplo), confiado sin arrogancia, obsesionado por outcomes, anti-fluff
- voice_is_not: arrogante, corporativo, vendedor de horas, marketing vacío, **predicador**, **condescendiente**

### Vocabulario
- use: (startup) product judgment, shipping, outcomes, discovery, MVP, stack, claridad +
  (pyme) horas semanales, ahorrar tiempo, automatizar, diagnóstico, 48 horas, antes/después, caso concreto
- avoid: disruptivo, revolucionario, compañía emergente, soluciones, sinergia, startup emergente,
  **transformación digital, potenciar, empoderar, revolución de la IA, "vos no sabés que…"**

### Signature phrases
- "No fluff" (se mantiene)
- "We don't sell hours" (se mantiene)
- **"Mostramos qué cambió, no qué prometemos"** (nuevo, frase-ancla de v2)

### Pilares (audiencia codificada en el name)

| Pillar | Weight | Audience | Descripción |
|---|---|---|---|
| `startup_anti_pattern` | 1 | Startup | Toma contrarian sobre el ruido del mercado tech, nunca contra el lector |
| `startup_process` | 1 | Startup | Paso del método Understand→Shape→Build→Learn |
| `startup_reframe` | 1 | Startup | Concept flip sobre cómo se ve un problema B2B SaaS |
| `startup_objection` | 1 | Startup | FAQ con respuesta directa |
| `pyme_case` | **2** | PYME | Caso antes/después con número (heavyweight para carouseles) |
| `pyme_oportunidad` | 1 | PYME | Qué puede hacer IA hoy que la PYME quizá no sabe |
| `pyme_diagnostico` | 1 | PYME | Cómo es el diagnóstico 48hs, qué entregan |
| `pyme_objection` | 1 | PYME | FAQ tipo "¿es caro?", "¿reemplaza gente?" |

### Monthly themes (rotar)
- Startup: "Discovery vs delivery: dónde se pierde tiempo", "MVPs honestos: shipping menos para aprender más", "Cómo aceleramos discovery con IA sin saltarnos hablar con gente real"
- PYME: "Qué puede hacer IA hoy por una PYME (que hace 12 meses no podía)", "Casos reales: panadería, contador, distribuidora, agencia chica", "Cómo se ve una auditoría IA de 48hs", "Mitos sobre IA en PYME: no reemplaza gente, multiplica horas", "¿Cuánto cuesta automatizar un proceso?"

### Sample copy (1 por pillar)
- `startup_anti_pattern`: "Hay 4 herramientas que prometen automatizar discovery. Discovery no se automatiza. Lo que sí se acelera es la transcripción y el análisis temático de las 30 entrevistas que ya hiciste."
- `startup_process`: "Step 01 — Understand. Antes que exista un solo pixel, mapeamos usuarios, problema y dirección. Con IA aceleramos análisis de transcripts, sin saltarnos hablar con gente real."
- `startup_reframe`: "La interfaz no es el punto de partida. Es el resultado de entender el problema."
- `startup_objection`: "¿Pueden trabajar con nuestro equipo interno? Sí. Nos integramos directo con founders, devs y product. Sin pisarse."
- `pyme_case`: "Estudio contable, 50 clientes, 6hs semanales clasificando facturas. Bot conectado al mail clasifica 600 facturas/mes con 94% de exactitud. Hoy revisan 36 minutos."
- `pyme_oportunidad`: "Hace 18 meses, atender FAQs en WhatsApp 24/7 era un equipo. Hoy es una tarde de configuración con WhatsApp Business API y un modelo entrenado en tu información."
- `pyme_diagnostico`: "Auditoría IA de 48hs: 90 minutos de charla, miramos 3 procesos, te entregamos PDF con qué automatizar, qué dejar como está, y cuánto cuesta cada cosa."
- `pyme_objection`: "'¿Es caro?' Depende. Un bot de FAQs en WhatsApp arranca en menos de lo que cuesta una persona part-time un mes. Te lo decimos exacto después del diagnóstico."

## Visual templates

**Nuevo template: `yc-case-stat`**
- Propósito: slide con número grande (ej "6 hs/sem") + label + descripción breve.
- Sirve para slide-problema **y** slide-resultado del carousel PYME (mismo template, dos contextos).
- Mantiene tokens visuales de Yacaré (negro, púrpura `#8A5EFF`, tipografías Antonio/Figtree/Inter).

**Estructura recomendada de carousel PYME (5 slides):**
1. `yc-cover` (reuso) — título del caso
2. `yc-case-stat` (nuevo) — el problema en un número
3. `yc-process-step` (reuso) — qué aplicamos (IA)
4. `yc-case-stat` (nuevo) — el resultado en un número
5. `yc-manifesto-block` (reuso) — CTA "Auditoría 48hs"

## Audience split mechanism

`compose.ts` recibirá una sección nueva en el system prompt cuando el tenant es Yacaré:

> "REPARTO DE AUDIENCIA — En cada batch generá **2 posts para startups B2B SaaS** (usando pillars con prefijo `startup_`) y **2 posts para PYMEs argentinas** (usando pillars con prefijo `pyme_`). El carrusel siempre es PYME. El single LinkedIn siempre es startup. Los IG feed se reparten uno a cada audiencia."

Esto evita que Claude desbalancee el batch.

## What does NOT change
- Visual identity: púrpura `#8A5EFF`, fuentes Antonio/Figtree/Inter, logo, dark mode.
- PDF download para carouseles: el endpoint `/api/posts/:id/carousel-pdf` no se toca.
  Toma cualquier carousel renderizado y lo combina en PDF, independiente de qué templates use.
- Otros 5 templates yacaré existentes — se mantienen todos.
- Argo: no se toca nada de Argo.

## Out of scope (no en este cambio)
- Métricas de performance del nuevo voice (medir engagement con cada audiencia) — a definir post-launch.
- Visual templates específicos para PYME más allá del `yc-case-stat` (ej. testimonial, calculator). Se evaluará después de las primeras tandas.
- Cambio de archetype en `ARCHETYPE_DESCRIPTIONS` de compose.ts: se mantiene la lista de 5 actual.

## Migration plan

1. Nuevo template TS: `src/lib/rendering/templates/yacare/yc-case-stat.ts`
2. Registrarlo en `src/lib/rendering/template-registry.ts`
3. SQL en Supabase (project `pzoiexlgzsbgjftzblgo`):
   - UPDATE `tenants` SET cadence para Yacaré
   - INSERT nuevo `brand_voice_versions` v2 (con is_active=true) — y UPDATE v1 a is_active=false
   - INSERT `visual_templates` row para `yc-case-stat`
4. Update `compose.ts`: agregar bloque de audience split cuando tenant.slug === 'yacare'
5. Update `scripts/seed.ts`: futuros seeds aplican la v2
6. Typecheck

## Rollback

- DB: UPDATE para volver v1 a is_active=true y v2 a false. Sin pérdida de datos.
- Cadence: revertir tenant.cadence al snapshot de v1.
- Template nuevo: se puede dejar registrado, no se usa si los pilares no lo piden.
