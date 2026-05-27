# Argo Method — Estrategia social v2 (consumidor) + publicación autónoma vía Blotato

Date: 2026-05-27
Status: Approved (design), pending implementation plan

## Why

La voz social actual de Argo es "profesional pero humana", diseñada para B2B en
LinkedIn (clubes, federaciones, entrenadores). El objetivo cambia: queremos
**construir marca y comunidad** en plataformas de consumidor (Instagram + TikTok),
hablándole a una audiencia mixta de **padres y entrenadores**, con publicación
**autónoma** vía Blotato pero con un checkpoint humano antes de publicar.

Esto exige repensar tres cosas a la vez:
1. El tono y el sistema editorial (de B2B a consumidor, sin perder la sensibilidad).
2. El formato (sumar video vertical faceless, no solo imágenes estáticas).
3. La distribución (de "export ZIP + publicar a mano" a "generar, aprobar, publicar solo").

El hallazgo clave del relevamiento: **Blotato genera los videos y carruseles él mismo**
(templates de IA) además de publicar. Por lo tanto NO construimos un renderizador de
video propio. social-publisher pasa a ser el "cerebro" (voz de marca + franquicias) y
Blotato el "taller + publicador". Eso hace el build mucho más liviano.

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
- Español latam neutro, **tuteo, nunca voseo**.
- Sin guiones (em dash, en dash) en copy de usuario.
- Sin emojis en imagen/video (limitación de render histórica; en captions se evalúa aparte).
- Glosario: Odisea (no test/juego), Perfil (no diagnóstico), Adulto acompañante.

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
| Carta a un papá deportivo | Vínculo | Cálido | Reel + carrusel | IG + TikTok |
| Mito vs Dato | Mitos | Directo | Reel (comparación) | IG + TikTok |
| Cómo funciona la mente de... | Método | Revelador | Carrusel | IG |
| 60 segundos de método | Método | Revelador | Reel corto | IG + TikTok |
| El gesto que cambia todo | Vínculo (padres + entrenadores) | Cálido/práctico | Reel + carrusel | IG + TikTok |
| Detrás de la Odisea | Producto | Cálido/curioso | Carrusel | IG (quincenal) |

Ejemplos de ángulo (espíritu, no copy final):
- Carta a un papá deportivo: "A tu hijo no le falta actitud. Quizás necesita entender el
  para qué antes de entrar a la cancha."
- Mito vs Dato: "Mito: el chico tímido no sirve para los deportes de equipo. Dato: suele
  ser el que mejor lee al compañero."
- Cómo funciona la mente de...: "El deportista que necesita reglas claras no es rígido.
  Es alguien que rinde cuando sabe a qué atenerse."

## Decisiones de operación

### Mapeo franquicia -> template nativo de Blotato
Esto hace el build liviano: no renderizamos video; elegimos template y le pasamos contenido.

| Franquicia | Template Blotato | Tipo |
|---|---|---|
| Carta a un papá deportivo | AI Story Video (`/base/v2/ai-story-video/...`) escenas + imagen IA + subtítulos, 9:16 | Reel |
| Mito vs Dato | When X then Y (`/base/v2/images-with-text/c9892c3b...`) comparación arriba/abajo | Reel/slideshow |
| Cómo funciona la mente de... | Tutorial Carousel (`/base/v2/tutorial-carousel/...`) intro + slides + CTA | Carrusel |
| 60 segundos de método | AI Story Video (corto, subtítulos) | Reel |
| El gesto que cambia todo | Image Slideshow with Prominent Text (`/base/v2/images-with-text/0ddb8655...`) | Reel/carrusel |
| Detrás de la Odisea | Instagram Carousel Slideshow (`53cfec04...`) imágenes IA | Carrusel |

Notas de mapeo:
- Los templates aceptan colores y fuente, así que se aplica el branding de Argo (violeta de marca).
- Reels = aspectRatio 9:16. Carruseles = 4:5 (formato feed IG).
- Las franquicias marcadas "Reel + carrusel" tienen el reel como formato primario; el
  carrusel es variante opcional para rotar. El calendario v1 fija un solo formato por día.

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
- El sistema genera y **renderiza los visuales en Blotato automáticamente** (render antes
  de revisión: ves el video/carrusel ya terminado, no un guion).
- **Checkpoint humano obligatorio**: el batch queda "listo para revisión". Recién al
  aprobar en el panel, Blotato agenda y publica.
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
- La tarjeta de cada pieza muestra: preview real renderizado por Blotato (el reel se
  reproduce, el carrusel se desliza), caption, franquicia + tono, y el slot agendado
  (día, hora, IG/TikTok).

## Arquitectura de sistema

### Pipeline autónomo
```
Cron semanal (domingo noche)
  -> Claude genera el batch (1 pieza por franquicia, con voz + tono + anti-repetición)
  -> filtros automáticos (palabras prohibidas + sensibilidad + strip emojis)
  -> social-publisher llama blotato_create_visual por pieza (render antes de revisión)
  -> blotato_get_visual_status hasta que el render esté listo, guarda la URL del asset
  -> estado del run: "ready_for_review"
  -> email resumen (Resend) con las piezas + link al panel
  -> el usuario entra, ve los previews ya renderizados, aprueba / rechaza / regenera
  -> al "Aprobar y agendar todo": blotato_create_post agendado al slot del calendario
     (Argo IG + TikTok)
  -> Blotato publica durante la semana
  -> se marca published_externally (alimenta el anti-repeat de la próxima generación)
```

### Componentes a construir
1. **Brand voice de Argo v2**: nuevo system prompt (reemplaza `argo-legacy.ts`, el prompt
   B2B). Incluye posicionamiento, 3 registros de tono, pilares de consumidor, franquicias,
   glosario y lista negra. Se carga como nueva `brand_voice_versions` activa del tenant Argo.
2. **Modelo de franquicias**: cada slot del batch se asocia a una franquicia (pilar + tono
   + template Blotato + plataforma destino). Define la "cadencia" como lista de franquicias.
3. **Schema de contenido por franquicia**: extender el schema de generación para soportar
   "escenas" de reel (texto/script + prompt de imagen IA por escena) además de slides de
   carrusel. La forma del output depende del template de la franquicia.
4. **Integración Blotato** (reemplaza el export ZIP):
   - Config de cuentas: mapear tenant -> accountId de IG + TikTok de Argo en Blotato.
   - `blotato_create_visual` con el template y los inputs derivados del contenido generado.
   - `blotato_get_visual_status` (polling) para esperar el render.
   - `blotato_create_post` con scheduledTime según el slot del calendario.
   - Marcar `published_externally` al confirmar.
5. **Config de calendario/cadencia por tenant**: día + franquicia + plataformas + horario.
6. **Panel de revisión evolucionado**: muestra el preview real renderizado por Blotato
   por pieza, con acciones aprobar / rechazar / regenerar (nota de feedback opcional) y la
   acción de batch "Aprobar y agendar todo" que dispara el push a Blotato.
7. **Email resumen (Resend)**: al quedar el run "ready_for_review", envía un email con las
   piezas de la semana y un link directo al panel.

### Qué aporta Blotato (no se construye)
- Generación de video faceless (AI Story Video con escenas, imagen IA, subtítulos).
- Generación de carruseles (Tutorial Carousel, IG Carousel Slideshow, comparación When X then Y).
- Publicación y agendado nativo a IG + TikTok.
- Analítica de publicaciones.

## Prerrequisitos y riesgos

1. **Cuentas de Argo en Blotato (bloqueante)**: hoy solo están conectadas IG/TikTok de
   `storyhunt.city` y la página de LinkedIn de Argo. Falta conectar la cuenta propia de
   Instagram y de TikTok de Argo Method. Lo hace el usuario desde el panel de Blotato.
   Sin esto no se puede publicar contenido de Argo en IG/TikTok.
2. **Voz en off en español**: las voces de Blotato (ElevenLabs) listadas están etiquetadas
   con acentos anglo. Decisión para v1: **reels solo con subtítulos, sin voz en off**.
   Testear calidad de voz en español antes de activarla.
3. **Costo de generación**: cada `create_visual` consume créditos de Blotato más modelos de
   imagen IA. La cadencia de ~5 piezas/semana acota el costo; revisar límites del plan.
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
- Voz en off en español (subtítulos primero).
- Full-auto sin checkpoint (evolución futura por confianza demostrada).
- Persona a cámara / talking-head real (no automatizable).
- Renderizador de video propio (Blotato lo cubre).

## Descomposición sugerida para implementación
El build puede dividirse en fases independientes:
- **Fase A — Voz y franquicias**: brand voice v2 + modelo de franquicias + schema de
  contenido. Es la base creativa; se puede validar generando texto antes de tocar Blotato.
- **Visual spike (checkpoint de partido gráfico)**: antes de construir el pipeline de la
  Fase B, tomar 1 reel + 1 carrusel del contenido ya validado en la Fase A y renderizarlos
  reales vía `blotato_create_visual` con los colores y la fuente de Argo (violeta de marca).
  El usuario aprueba la dirección gráfica antes de seguir. Importante: `create_visual` NO
  requiere las cuentas de Argo conectadas (eso es solo para publicar), así que este
  checkpoint se puede hacer sin resolver el prerrequisito bloqueante.
- **Fase B — Integración Blotato**: cuentas, create_visual, create_post, panel aprobar/agendar.
- **Fase C — Autonomía**: cron semanal + calendario + filtros previos a revisión + email
  resumen (Resend). El panel de revisión evolucionado (preview Blotato + aprobar/agendar)
  va con la Fase B.

Cada fase es un plan de implementación propio. La Fase A se puede empezar sin los
prerrequisitos de Blotato resueltos.
