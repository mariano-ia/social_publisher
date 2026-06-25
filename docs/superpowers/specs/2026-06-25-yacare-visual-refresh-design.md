# Yacaré — Refresh visual + de contenido ("Product Studio")

**Fecha:** 2026-06-25
**Estado:** Implementado (branch `feat/yacare-visual-refresh` → main)
**Alcance:** solo tenant **Yacaré**. Argo no se toca.

---

## 1. Objetivo

Modernizar la comunicación de Yacaré en redes, empezando por las piezas
gráficas. Reemplazar el sistema visual viejo (fondo negro + Antonio mayúsculas +
glows radiales + círculos de contorno — "correcto pero conservador") por un
sistema nuevo con más carácter, y alinear el contenido a un posicionamiento de
**Product Studio boutique** (no consultora de IA, no automatización para PYMEs).

## 2. Decisiones de diseño (todas validadas con el cliente)

### 2.1 Sistema visual — un partido, dos volúmenes

Un mismo sistema de marca expresado en dos "volúmenes":

| | **C — "volumen alto"** | **D — "volumen bajo"** |
|---|---|---|
| Uso | Posts simples (1:1) | Carrusel (4:5) |
| Fondo | Púrpura pleno `#7C3AED→#5B21B6` + mix grilla/viñeta | Tinta `#0d0a14` + panel con borde |
| Display | Archivo Black, mayúsculas, a sangre | Space Grotesk 600, caja mixta |
| Energía | Scroll-stopper | Sobrio, premium |

**ADN compartido** (lo que los hace el mismo partido):
- Logo wordmark `yacaré` en Archivo Black, minúscula.
- Metadatos en **Space Mono** (pie, índice de slide, epígrafe, tag de esquina).
- Paleta: tinta `#0d0a14`, púrpura `#7C3AED`/`#8A5EFF`, lavanda `#C4B5FD`, y el
  **lima `#D8FF3E`** como acento compartido (sticker/CTA en C, tick/epígrafe en D).
- Grano sutil sobre todo.
- **Pie chico, sin punto lima** (`yacaré.io · SLUG`). El lima nunca va en el pie.
- Se eliminan glows radiales y círculos de contorno.

### 2.2 Inventario de templates (6 nuevos `yc2-*`)

**Simples (C), formato `ig_feed` 1080×1080 — el motor elige 2 de 3 por tanda:**
- `yc2-statement` — idea fuerte de producto; hook corto; último período auto-lima.
- `yc2-stat` — un número grande + label corto (secundario; el contenido es poco numérico).
- `yc2-reframe` — contraste en primera persona, **sin tachar al lector** (tono consejero).

**Carrusel (D), formato `li_carousel_slide` 1080×1350, 5 slides:**
- `yc2-cover` — portada: epígrafe (solo "Producto"), headline con última palabra
  en gradiente, teaser de slides.
- `yc2-content` ×3 (slides 2–4) — número fantasma + título + cuerpo.
- `yc2-cta` (slide 5) — cierre como invitación + botón lima.

Reglas de texto en las piezas: **tamaño de fuente adaptativo** según largo +
**nunca cortar palabras** (`word-break: keep-all`). El argumento largo va al
caption, nunca a la imagen.

### 2.3 Cadencia semanal

3 publicaciones: **2 simples + 1 carrusel** ("dos golpes cortos + una pieza
explicativa"). Cadence: `{ ig_feed: 2, li_single: 0, li_carousel: 1, ig_carousel: 0, carousel_slides: 5 }`.

| Pieza | Rol | Template |
|---|---|---|
| Simple 1 | Idea fuerte de producto | `yc2-statement` / `yc2-stat` |
| Simple 2 | Error / contraste | `yc2-reframe` / `yc2-statement` |
| Carrusel | Explicación con criterio | `yc2-cover` + `yc2-content`×3 + `yc2-cta` |

### 2.4 Bilingüe

Regla del cliente: **"Imagen en español. Copy en español + inglés."**
- La imagen se renderiza **una sola vez, en español** (no se traducen
  `visual_variables` ni `slides`).
- El caption es bilingüe: `copy` (ES) + nuevo campo `copy_en` (EN). El export
  los junta con un separador `— English —`.

### 2.5 Contenido y tono

**Posicionamiento:** Product Studio boutique que piensa el producto antes de
construir. Reemplaza el lead PYME/automatización/auditoría del voice v4 anterior.

**Temas simples (6 buckets):** MVPs honestos · Discovery vs delivery · IA con
criterio · UX B2B · "Antes de construir" (serie fija) · Producto vs features.

**Temas carrusel (5):** Señales de MVP sin claridad · 3 preguntas antes del MVP ·
El error de empezar por features · IA en producto (cuándo sí/no) · Discovery sin
hacerlo eterno.

**Tono:** senior, simple, con criterio — **consejero humilde, NO el que se las
sabe todas**. Primera persona plural ("así lo pensamos"), el contraste apunta a
nuestro criterio, no al error del lector. NO: gurú de LinkedIn, agencia que vende
humo, consultora de IA, software factory, tips genéricos, microemprendedores.

## 3. Cambios de implementación

### Código (branch → main)
- `src/lib/rendering/templates/yacare/_v2-shared.ts` — tokens, fuentes, grano,
  mix de fondo, pie, helpers (`adaptiveSize`, `emphasizeLastSentence`,
  `gradLastWord`, `pillarLabel`, `footer`, `logoWordmark`).
- `src/lib/rendering/templates/yacare/yc2-*.ts` — 6 templates nuevos.
- `src/lib/rendering/template-registry.ts` — registra los 6 `yc2-*`.
- `src/lib/rendering/orchestrate.ts` — rutea las slides del carrusel de Yacaré a
  `yc2-cover/content/cta` por `slide.kind`; persiste `copy_en`.
- `src/lib/generator/schema.ts` — campo `copy_en` (nullish).
- `src/lib/generator/index.ts` — instrucción de copy bilingüe en el prompt ES.
- `src/lib/db/types.ts` — `GeneratedPost.copy_en`.
- `src/app/api/runs/[id]/export/route.ts` — caption ES + EN en `copy.txt`.
- `scripts/seed.ts` — cadencia v2 + templates `yc2-*` para installs nuevos.

### Base de datos (live) — `scripts/refresh-yacare-v2.sql`
Migración canónica, idempotente:
1. `alter table generated_posts add column if not exists copy_en text`.
2. Cadencia de Yacaré → 2 simples + 1 carrusel.
3. Desactiva `yc-*`, activa `yc2-*` en `visual_templates`.
4. Desactiva el voice activo e inserta la versión "Product Studio".

### Export PNG + PDF (ya existía)
El carrusel ya se exporta como PNG por slide + `carousel.pdf` combinado
(`GET /api/posts/:id/carousel-pdf` y el ZIP de `GET /api/runs/:id/export`).
No requirió cambios.

## 4. Qué quedó fuera (a propósito)
- Argo: sin cambios.
- Gráficas bilingües (dos versiones de cada imagen): descartado — opción A
  (imagen ES, caption ES+EN). Se puede sumar más adelante si hace falta.
- Templates legacy `yc-*`: quedan en el código (sin romper imports) pero
  desactivados en la DB.
