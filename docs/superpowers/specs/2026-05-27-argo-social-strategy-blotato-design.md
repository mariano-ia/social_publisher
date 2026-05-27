# Argo Method — Estrategia social v2 (consumidor) + publicación autónoma

Date: 2026-05-27
Status: Fase A implementada. Arquitectura revisada (Blotato = solo publicador). Fase B pendiente de plan.
Idioma de salida: **inglés** (todo el contenido social de Argo es en inglés; este doc de planeamiento está en español).

> Nota de idioma: el contenido social de Argo se publica en **inglés** (coincide con la
> config histórica de social-publisher: Argo -> "en"). El producto argomethod.com es en
> español, pero NO se mezcla con lo social. Los nombres y briefs canónicos de las
> franquicias viven en inglés en `src/lib/franchises/argo.ts`. Los ejemplos en español más
> abajo son ilustrativos del ángulo, no del copy literal.

## Why

La voz social actual de Argo es "profesional pero humana", diseñada para B2B en
LinkedIn (clubes, federaciones, entrenadores). El objetivo cambia: queremos
**construir marca y comunidad** en plataformas de consumidor (Instagram + TikTok),
hablándole a una audiencia mixta de **padres y entrenadores**, con publicación
**autónoma** pero con un checkpoint humano antes de publicar.

Esto exige repensar tres cosas a la vez:
1. El tono y el sistema editorial (de B2B a consumidor, sin perder la sensibilidad).
2. El formato (sumar video vertical faceless, no solo imágenes estáticas).
3. La distribución (de "export ZIP + publicar a mano" a "generar, aprobar, publicar solo").

### Decisión de arquitectura (revisada 2026-05-27)
**Blotato se usa solo como publicador** (subir el asset, agendar y publicar a IG/TikTok),
NO como generador. Los visuales los genera nuestro propio pipeline:
- **Carruseles**: puppeteer (HTML→PNG), como social-publisher ya hace hoy, con templates
  nuevos de franquicia y el branding de Argo. Costo efectivo cero, control tipográfico total.
- **Reels**: **kie.ai** (Veo/Kling, pago por uso), alimentado por las escenas que genera el
  cerebro (script + image_prompt por escena).

Por qué se descartó que Blotato genere los visuales: su generación de video encadena voz
+ modelo de imagen + render y quema créditos por pieza (a ~4 reels/semana, opaco y caro).
Usar Blotato solo para publicar preserva sus créditos para lo barato y confiable, y nos da
control total del partido gráfico. social-publisher = cerebro (voz + franquicias) + taller
(render); Blotato = publicador.

## Decisiones de estrategia (núcleo editorial)

### Audiencia y objetivo
- **Audiencia mixta**: padres (primario en canales de consumidor) + entrenadores
  (secundario), segmentando por pilar de contenido.
- **Objetivo**: marca y comunidad (alcance, guardados, comunidad). Venta indirecta.
- **Plataformas**: Instagram + TikTok. Video vertical (9:16) como motor. Sin LinkedIn
  por ahora (queda como expansión futura, ya hay página de empresa conectada).

### Posicionamiento (norte de marca)
Argo es la voz que ayuda al adulto a ver a cada chico como es en el deporte. No más
fuerte, no más exigente: más entendido. La tensión que ocupamos:

> El deporte infantil no necesita más presión. Necesita más comprensión.

Vendemos indirecto: primero entiendes a tu hijo o deportista, después descubres que
Argo te da el lenguaje exacto para hacerlo.

### Sistema de tono (3 registros, uno por tipo de contenido)
- **Cálido** (de padre o madre a padre o madre): escenas cotidianas, empatía. Para vínculo.
- **Revelador** ("sabías que"): curiosidad más autoridad accesible. Para método y DISC.
- **Directo** (postura clara, sin agredir): contra la presión, la comparación, el grito.
  Para mitos.

Reglas que NO cambian en ningún registro (heredadas de las guidelines de marca y de las
reglas de copy del proyecto Argo):
- Centrado en el niño. Foco en bienestar y disfrute, no en rendimiento ni "potenciar".
- Lenguaje probabilístico ("tiende a", "suele", "es probable que").
- Sin etiquetas rígidas ni diagnósticos definitivos.
- Sin "talento", "ganar", "errores", "control", "dominación", "rígido", "débil".
- **Idioma de salida: inglés natural y claro** (no español). Las reglas de tuteo/voseo del
  producto NO aplican al contenido social.
- Sin guiones (em dash, en dash) en el copy publicado.
- Sin emojis en imagen/video; en captions también se mantienen fuera por consistencia.
- Glosario: Odisea (no test/juego), Perfil (no diagnóstico), Adulto acompañante.
- Sitio oficial: argomethod.com (no inventar variantes en español).

### Pilares de contenido (adaptados a consumidor)
1. **Vínculo** (padres) -> registro cálido
2. **Método** (cómo funciona la mente deportiva: DISC, motor, arquetipos) -> revelador
3. **Mitos y cultura** (deporte infantil) -> directo
4. **Argo en acción** (qué es la Odisea, qué recibes) -> cálido, baja frecuencia

### Franquicias (motor de contenido)
Cada franquicia es una serie con nombre, pilar fijo, tono fijo y plantilla estable.
Esto es lo que permite generación autónoma con identidad de marca consistente.

| Franquicia | Pilar | Tono | Formato | Plataforma |
|---|---|---|---|---|
| Carta a un papá deportivo | Vínculo | Cálido | Reel | IG + TikTok |
| Mito vs Dato | Mitos | Directo | Reel (comparación) | IG + TikTok |
| Cómo funciona la mente de... | Método | Revelador | Carrusel | IG |
| 60 segundos de método | Método | Revelador | Reel corto | IG + TikTok |
| El gesto que cambia todo | Vínculo (padres + entrenadores) | Cálido/práctico | Reel | IG + TikTok |
| Detrás de la Odisea | Producto | Cálido/curioso | Carrusel | IG (quincenal) |

Ejemplos de ángulo (espíritu, no copy final):
- Carta a un papá deportivo: "A tu hijo no le falta actitud. Quizás necesita entender el
  para qué antes de entrar a la cancha."
- Mito vs Dato: "Mito: el chico tímido no sirve para los deportes de equipo. Dato: suele
  ser el que mejor lee al compañero."
- Cómo funciona la mente de...: "El deportista que necesita reglas claras no es rígido.
  Es alguien que rinde cuando sabe a qué atenerse."

## Decisiones de operación

### Render de cada franquicia
Los visuales los genera nuestro pipeline. Blotato no renderiza nada.

| Franquicia | Render | Tipo |
|---|---|---|
| Carta a un papá deportivo | kie.ai (video 9:16) | Reel |
| Mito vs Dato | kie.ai (video 9:16) | Reel |
| Cómo funciona la mente de... | puppeteer (template franquicia, 4:5) | Carrusel |
| 60 segundos de método | kie.ai (video 9:16) | Reel |
| El gesto que cambia todo | kie.ai (video 9:16) | Reel |
| Detrás de la Odisea | puppeteer (template franquicia, 4:5) | Carrusel |

Notas:
- **Carruseles**: templates nuevos de franquicia en el render existente (HTML→PNG), con la
  paleta y la fuente de Argo (violeta de marca). 4:5, slides cover/content/cta.
- **Reels**: kie.ai genera el video 9:16 a partir de las escenas del cerebro (script +
  image_prompt por escena). El modelo concreto (Veo/Kling) y si lleva voz/subtítulos se
  define en el visual spike. El cerebro ya produce ese material.

### Calendario semanal (cadencia autónoma)
Reels se cruzan a IG + TikTok (mismo asset 9:16). Carruseles solo IG.

| Día | Franquicia | Formato | Dónde |
|---|---|---|---|
| Lunes | 60 segundos de método | Reel | IG + TikTok |
| Martes | Carta a un papá deportivo | Reel | IG + TikTok |
| Miércoles | Cómo funciona la mente de... | Carrusel | IG |
| Jueves | Mito vs Dato | Reel | IG + TikTok |
| Viernes | El gesto que cambia todo | Reel | IG + TikTok |
| Quincenal | Detrás de la Odisea | Carrusel | IG |

- Aproximadamente 5 piezas por semana.
- Horarios por defecto pensados para padres (mediodía y noche), configurables por tenant.

### Nivel de autonomía
- El sistema genera el copy y **renderiza los visuales en nuestro pipeline** (puppeteer para
  carruseles, kie.ai para reels) automáticamente. Render antes de revisión: ves la pieza ya
  terminada, no un guion.
- **Checkpoint humano obligatorio**: el batch queda "listo para revisión". Recién al
  aprobar en el panel, se empuja a Blotato para agendar y publicar.
- Filtros automáticos previos a revisión: palabras prohibidas + sensibilidad (reúso del
  filtro existente del proyecto), strip de emojis.

### UX de revisión y aprobación
- **Aviso por email** (vía Resend, ya usado en el ecosistema Argo): cuando la semana está
  generada y renderizada, llega un email resumen con las piezas y un link directo al panel.
  El usuario no depende de acordarse de entrar.
- **El panel es solo para autorizar**: el usuario entra desde el email, ve las piezas ya
  renderizadas y actúa. No hace falta un editor de texto completo en v1.
- **Acciones por pieza (v1)**: aprobar, rechazar, regenerar (con una nota de feedback
  opcional que vuelve al generador). Edición inline de caption y reagendado manual quedan
  como mejora futura, no v1.
- **Acción de batch**: "Aprobar y agendar todo" empuja a Blotato las piezas aprobadas, cada
  una en su slot del calendario.
- La tarjeta de cada pieza muestra: preview real renderizado (el reel se reproduce, el
  carrusel se desliza), caption, franquicia + tono, y el slot agendado (día, hora, IG/TikTok).

## Arquitectura de sistema

### Pipeline autónomo
```
Cron semanal (domingo noche)
  -> Claude genera el batch (1 pieza por franquicia, con voz + tono + anti-repetición)
  -> filtros automáticos (palabras prohibidas + sensibilidad + strip emojis)
  -> render por pieza:
       carrusel -> puppeteer (template de franquicia, branding Argo)
       reel     -> kie.ai (video 9:16 desde las escenas), poll hasta listo
  -> sube los assets a Supabase Storage; estado del run: "ready_for_review"
  -> email resumen (Resend) con las piezas + link al panel
  -> el usuario entra, ve los previews ya renderizados, aprueba / rechaza / regenera
  -> al "Aprobar y agendar todo":
       blotato_create_source (sube/registra el asset en Blotato)
       blotato_create_post con scheduledTime al slot del calendario (Argo IG + TikTok)
  -> Blotato publica durante la semana
  -> se marca published_externally (alimenta el anti-repeat de la próxima generación)
```

### Componentes a construir
1. **[HECHO en Fase A] Brand voice de Argo v2**: nuevo system prompt (reemplaza el rol de
   `argo-legacy.ts`). Posicionamiento, 3 registros de tono, pilares de consumidor, glosario,
   lista negra, dominio fijado.
2. **[HECHO en Fase A] Modelo de franquicias + schema de contenido**: cada slot del batch es
   una franquicia (pilar + tono + formato + plataformas); schema con escenas de reel
   (script + image_prompt) y slides de carrusel. (`Franchise.blotatoTemplateId` queda como
   metadata sin uso; Fase B agregará el target de render real: template puppeteer / params kie.ai.)
3. **Render de reels con kie.ai**: integración de la API de kie.ai. Toma las escenas (script
   + image_prompt) y produce un video 9:16. Polling de estado, guardar el asset. Requiere la
   API key de kie.ai en `.env.local` de social-publisher (hoy NO está; existe en otro
   proyecto del ecosistema, hay que copiarla acá).
4. **Templates de carrusel de franquicia (puppeteer)**: nuevos templates HTML con branding
   Argo para "Cómo funciona la mente de..." y "Detrás de la Odisea" (cover/content/cta, 4:5).
5. **Integración Blotato (solo publicar, reemplaza el export ZIP)**:
   - Config de cuentas: mapear tenant -> accountId de IG + TikTok de Argo en Blotato.
   - `blotato_create_source` para registrar el asset renderizado.
   - `blotato_create_post` con scheduledTime según el slot del calendario.
   - Marcar `published_externally` al confirmar.
6. **Config de calendario/cadencia por tenant**: día + franquicia + plataformas + horario.
7. **Panel de revisión evolucionado**: preview real por pieza, acciones aprobar / rechazar /
   regenerar (nota de feedback) y la acción de batch "Aprobar y agendar todo".
8. **Email resumen (Resend)**: al quedar el run "ready_for_review", envía el email con las
   piezas y el link al panel.

### Qué aporta Blotato (no se construye)
- Publicación y agendado nativo a IG + TikTok (su rol único).
- Analítica de publicaciones.

(Blotato NO genera visuales en esta arquitectura.)

## Prerrequisitos y riesgos

1. **Cuentas de Argo en Blotato (bloqueante para publicar)**: hoy solo están conectadas
   IG/TikTok de `storyhunt.city` y la página de LinkedIn de Argo. Falta conectar la cuenta
   propia de Instagram y de TikTok de Argo Method. Lo hace el usuario desde el panel de
   Blotato. No bloquea el render ni el visual spike, solo la publicación.
2. **Costo de kie.ai**: cada reel es una generación de video paga en kie.ai. ~4 reels/semana.
   Costo predecible y bajo control (a diferencia de los créditos opacos de Blotato). Los
   carruseles (puppeteer) no tienen costo por pieza.
3. **Voz / audio en reels**: a definir en el visual spike. kie.ai (p.ej. Veo) puede generar
   audio/voz nativa en español, lo que resuelve la limitación de las voces anglo de Blotato.
   Alternativa: reels con subtítulos sin voz.
4. **Sensibilidad del contenido**: al hablar de niños, el checkpoint humano se mantiene
   hasta validar consistencia de calidad. No pasar a full-auto sin demostrar calidad.

## Métricas de éxito (objetivo marca/comunidad)
- Crecimiento de seguidores (IG + TikTok).
- Alcance e impresiones.
- **Guardados + compartidos** (señal principal de marca para este objetivo).
- Visitas al perfil y clics al link.
- Performance por franquicia (para aprender qué serie funciona mejor y rebalancear).

## Fuera de alcance (v1)
- LinkedIn y otras plataformas (Threads, YouTube). Expansión futura.
- Full-auto sin checkpoint (evolución futura por confianza demostrada).
- Persona a cámara / talking-head real (no automatizable).
- Que Blotato genere los visuales (descartado por costo/control).

## Descomposición de implementación
- **Fase A — Voz y franquicias [HECHA]**: brand voice v2 + modelo de franquicias + schema de
  contenido + generador + script de preview. Validada con `npm run preview:argo` (32 tests).
  Vive en `main` de social-publisher.
- **Visual spike (checkpoint de partido gráfico)**: tomar 1 carrusel (puppeteer, template de
  franquicia con branding Argo) + 1 reel (kie.ai, desde las escenas generadas) y mostrarlos
  reales para que el usuario apruebe la dirección gráfica. No requiere cuentas de Blotato ni
  consume créditos de Blotato. Define el modelo kie.ai y el look de los carruseles.
- **Fase B — Render + publicación**: integración kie.ai (reels) + templates de carrusel +
  integración Blotato (create_source + create_post) + panel de revisión + email resumen.
- **Fase C — Autonomía**: cron semanal + calendario + filtros previos a revisión.

Cada fase es un plan de implementación propio.
