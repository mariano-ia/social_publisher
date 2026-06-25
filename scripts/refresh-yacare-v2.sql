-- ============================================================================
-- Yacaré visual + content refresh → "Product Studio" (2026-06-25)
-- ============================================================================
-- Canonical migration for the LIVE database. Idempotent: safe to re-run.
-- Applies everything discussed in the brainstorm session:
--   1. generated_posts.copy_en column (bilingual caption: ES in copy, EN here).
--   2. Yacaré cadence → 2 simples (1:1) + 1 carrusel (5 slides).
--   3. Visual templates: deactivate legacy yc-*, activate v2 yc2-*.
--   4. Brand voice: deactivate the active version, insert the Product Studio v.
--
-- The IMAGE renders only in Spanish; only the caption is bilingual.
-- ============================================================================

-- 1. Bilingual caption column ------------------------------------------------
alter table generated_posts add column if not exists copy_en text;

-- 2. Cadence: 2 simples + 1 carrusel ----------------------------------------
update tenants
set cadence = '{"ig_feed":2,"li_single":0,"li_carousel":1,"ig_carousel":0,"carousel_slides":5}'::jsonb,
    updated_at = now()
where slug = 'yacare';

-- 3. Visual templates --------------------------------------------------------
-- Retire the legacy yc-* family (glows + outlined circles).
update visual_templates
set is_active = false
where tenant_id = (select id from tenants where slug = 'yacare')
  and slug like 'yc-%';

-- Activate the v2 "Product Studio" family. Simples → ig_feed (the generator
-- picks 2 of 3). Carousel → one post-level slug (yc2-cover); content/cta slides
-- are routed by kind in orchestrate.ts (never picked by the generator).
insert into visual_templates (tenant_id, slug, format, engine, weight, is_active, description)
values
  ((select id from tenants where slug='yacare'), 'yc2-statement', 'ig_feed', 'html', 2, true,
    $d$Post simple (C): idea fuerte de producto, hook corto, último período en lima.$d$),
  ((select id from tenants where slug='yacare'), 'yc2-stat', 'ig_feed', 'html', 2, true,
    $d$Post simple (C): un número grande + label corto. Secundario (contenido poco numérico).$d$),
  ((select id from tenants where slug='yacare'), 'yc2-reframe', 'ig_feed', 'html', 2, true,
    $d$Post simple (C): contraste/reframe en primera persona, sin tachar al lector.$d$),
  ((select id from tenants where slug='yacare'), 'yc2-cover', 'li_carousel_slide', 'html', 2, true,
    $d$Carrusel (D): portada. content/cta se rutean por kind (yc2-content / yc2-cta).$d$)
on conflict (tenant_id, slug) do update
  set is_active = true, format = excluded.format, engine = excluded.engine,
      weight = excluded.weight, description = excluded.description;

-- 4. Brand voice: Product Studio --------------------------------------------
update brand_voice_versions
set is_active = false
where tenant_id = (select id from tenants where slug = 'yacare') and is_active = true;

insert into brand_voice_versions (
  tenant_id, version, is_active, archetype, dimensions,
  voice_is, voice_is_not, vocabulary_use, vocabulary_avoid, signature_phrases,
  dos, donts, pillars, monthly_themes, sample_copy, language, language_rules, system_prompt_override
)
values (
  (select id from tenants where slug='yacare'),
  (select coalesce(max(version),0)+1 from brand_voice_versions where tenant_id=(select id from tenants where slug='yacare')),
  true,
  'guide',
  '{"formal_casual":5,"serious_playful":4,"technical_simple":6,"reserved_bold":5}'::jsonb,
  array[$x$directo pero humilde$x$,$x$senior$x$,$x$simple$x$,$x$con criterio$x$,$x$consejero (no gurú)$x$,$x$primera persona ('así lo pensamos')$x$,$x$cercano pero serio$x$,$x$claro$x$],
  array[$x$gurú de LinkedIn$x$,$x$agencia que vende humo$x$,$x$consultora de IA$x$,$x$software factory$x$,$x$tips genéricos$x$,$x$contenido para microemprendedores$x$,$x$el que se las sabe todas$x$,$x$correctivo / señalador$x$],
  array[$x$producto$x$,$x$criterio de producto$x$,$x$MVP$x$,$x$discovery$x$,$x$delivery$x$,$x$señales$x$,$x$claridad$x$,$x$foco$x$,$x$decisión$x$,$x$validar$x$,$x$aprender$x$,$x$UX$x$,$x$dashboard$x$,$x$roadmap$x$,$x$hipótesis$x$,$x$shipping$x$],
  array[$x$disruptivo$x$,$x$revolucionario$x$,$x$transformación digital$x$,$x$potenciar$x$,$x$empoderar$x$,$x$soluciones$x$,$x$sinergia$x$,$x$gurú$x$,$x$deberías$x$,$x$dejá de$x$,$x$es fácil$x$,$x$plug-and-play$x$],
  array[$x$Pensamos antes de construir$x$,$x$Menos features, más señales$x$,$x$No solo diseñamos pantallas$x$,$x$Primero la decisión, después la pantalla$x$],
  array[
    $x$Voz de consejero humilde, primera persona plural: 'así lo pensamos', 'lo que aprendimos', 'cómo lo abordamos'.$x$,
    $x$El contraste apunta a NUESTRO criterio, nunca al error del lector.$x$,
    $x$Compartir cómo pensamos (proceso y criterio del estudio) es un formato recurrente.$x$,
    $x$Frases cortas y claras. Senior, simple, con criterio.$x$,
    $x$Permitido slang de producto en inglés (MVP, discovery, delivery, product-market fit, shipping) sin traducir.$x$,
    $x$Asumimos que el lector sabe de su negocio; aportamos criterio de producto.$x$,
    $x$En las piezas simples (imagen): hook de 2 a 8 palabras. El argumento largo va al caption.$x$
  ],
  array[
    $x$No sonar a gurú de LinkedIn, agencia que vende humo, consultora de IA, software factory ni cuenta de tips.$x$,
    $x$No contenido para microemprendedores.$x$,
    $x$Nada de imperativo correctivo ('no deberías', 'dejá de', 'estás mal'); no señalar al lector.$x$,
    $x$Sin casos inventados ni clientes ficticios. Sin precios.$x$,
    $x$El reframe no tacha la creencia del lector: se expresa en primera persona.$x$,
    $x$Sin emojis.$x$
  ],
  $json$[
    {"name":"mvps_honestos","weight":2,"description":"Lanzar menos para aprender más. El MVP es una herramienta para aprender antes de invertir de más, no una versión barata o incompleta. Menos features, más señales."},
    {"name":"discovery_delivery","weight":1,"description":"El delivery acelera la ejecución; el discovery evita ejecutar lo incorrecto. Construir rápido no sirve sin claridad de qué validar."},
    {"name":"ia_criterio","weight":1,"description":"IA como capa que mejora una decisión o reduce fricción real, no como feature decorativa. Cuándo suma y cuándo sobra."},
    {"name":"ux_b2b","weight":1,"description":"UX en productos B2B complejos (dashboards, operaciones, herramientas internas). Una buena experiencia no siempre se nota; una mala frena la operación. El dashboard ayuda a decidir, no solo a mostrar datos."},
    {"name":"antes_de_construir","weight":1,"description":"Serie fija. Entender qué decisión querés validar antes de construir; qué parte del flujo está rota antes de rediseñar."},
    {"name":"producto_vs_features","weight":1,"description":"Criterio, foco y estrategia. Una lista de features no es una estrategia de producto; más funcionalidades no hacen mejor al producto."}
  ]$json$::jsonb,
  array[
    $x$MVPs honestos: lanzar menos para aprender más$x$,
    $x$Discovery vs delivery: dónde se pierde la claridad$x$,
    $x$IA con criterio de producto, no IA decorativa$x$,
    $x$UX en productos B2B: ayudar a decidir, no solo mostrar$x$,
    $x$Antes de construir: qué decisión querés validar$x$,
    $x$Producto vs lista de features$x$,
    $x$Carrusel: Señales de que tu MVP necesita más claridad$x$,
    $x$Carrusel: 3 preguntas antes de construir un MVP$x$,
    $x$Carrusel: El error de empezar por features$x$,
    $x$Carrusel: IA dentro de un producto, cuándo sí y cuándo no$x$,
    $x$Carrusel: Discovery sin hacerlo eterno$x$
  ],
  $json$[
    {"context":"mvps_honestos","sample":"Un MVP no es una versión incompleta.\n\nPara nosotros es una forma de aprender antes de invertir de más. Lanzamos menos, no para mostrar menos, sino para ver señales reales antes de comprometer meses de build.\n\nMenos features. Más señales."},
    {"context":"discovery_delivery","sample":"Construir más rápido no sirve si todavía no sabemos qué estamos validando.\n\nEl delivery acelera la ejecución. El discovery evita ejecutar lo incorrecto. Así lo separamos cuando arrancamos: primero entender qué decisión está en juego, después correr."},
    {"context":"ux_b2b","sample":"Cuando diseñamos un dashboard, no empezamos por los datos. Empezamos por la decisión que tiene que ayudar a tomar.\n\nEn B2B una buena experiencia casi no se nota. Una mala frena toda la operación."},
    {"context":"ia_criterio","sample":"No se trata de sumar IA. Se trata de entender dónde mejora una decisión.\n\nLa IA suma cuando reduce fricción real o ayuda a alguien a hacer algo mejor. Si está solo para decir tenemos IA, probablemente sobra."},
    {"context":"producto_vs_features","sample":"Una lista de features no es una estrategia de producto.\n\nMás funcionalidades no siempre hacen mejor al producto. Lo que cambia las cosas es el criterio para decidir qué no construir todavía."}
  ]$json$::jsonb,
  'es-AR',
  $lr$Español rioplatense (voseo: tenés, sabés, pensá). Slang de producto en inglés permitido sin traducir (MVP, discovery, delivery, product-market fit, shipping). Tono de consejero humilde y en primera persona plural: el contraste apunta a NUESTRO criterio, nunca al error del lector. "Cómo pensamos" es un formato recurrente. El copy va SIEMPRE bilingüe a nivel caption: copy en español, copy_en en inglés (mismo mensaje y tono). La IMAGEN queda solo en español (no se traducen visual_variables ni slides). Sin emojis. Sin casos inventados ni precios.$lr$,
  null
);
