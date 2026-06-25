# Social Publisher

Multi-tenant autonomous social media generator. Genera batches de copy + visuales para Instagram + LinkedIn por cada tenant (Argo, Yacaré, etc.) y exporta listo para publicar manualmente.

## Stack
- **Frontend + API**: Next.js 15 (App Router) + TypeScript + Tailwind
- **DB**: Supabase Postgres
- **Storage**: Supabase Storage (`social-publisher-assets` bucket)
- **LLM (copy)**: Anthropic Claude Sonnet 4.5
- **LLM (imágenes Argo)**: OpenAI gpt-image-1
- **Render HTML→PNG**: puppeteer-core + @sparticuz/chromium
- **Auth**: middleware single-password (MVP)
- **Deploy**: Vercel

## Comandos
```bash
npm install
npm run dev              # localhost:3000
npm run build
npm run typecheck
npm run seed             # poblar Argo + Yacaré inicial (1 vez)
```

## Estructura
```
src/
  app/                       # Next.js App Router
    (dashboard)/
      page.tsx               # lista de tenants
      t/[slug]/              # vistas por tenant
      tenants/new/           # wizard nuevo tenant
    api/
      runs/[id]/export/      # ZIP export endpoint
    login/
  lib/
    db/
      supabase.ts            # client
      types.ts               # types DB
      queries.ts             # queries reusables
    generator/
      index.ts               # main generator (Claude call)
      schema.ts              # zod schemas para output
    prompts/
      compose.ts             # arma system prompt desde voice version
    rendering/
      argo-photo.ts          # gpt-image-1 pipeline (legacy Argo)
      html-renderer.ts       # puppeteer wrapper
      template-registry.ts   # registry de templates
      templates/yacare/      # templates Yacaré: yc2-* (sistema v2 activo) + yc-* (legacy)
        _v2-shared.ts        # tokens/fuentes/helpers del sistema v2
        yc2-statement|stat|reframe.ts   # simples 1:1 (volumen "C", loud)
        yc2-cover|content|cta.ts        # carrusel 4:5 (volumen "D", quiet)
  components/
  middleware.ts              # auth check
scripts/
  seed.ts                    # seed inicial de tenants
  refresh-yacare-v2.sql      # migración live: copy_en + cadencia + templates + voz Product Studio
docs/
  cleanup-commands.md        # comandos manuales para cleanup post-cutover
  superpowers/specs/         # specs de diseño (ver 2026-06-25-yacare-visual-refresh)
```

## Tenants iniciales
- **Argo Method** (`argo`) — usa pipeline gpt-image-1 con STYLE_BASE histórico. Brand voice via `system_prompt_override` (113 líneas legacy). Output en inglés.
- **Yacaré** (`yacare`) — usa HTML→PNG con el sistema visual **v2 "Product Studio"** (`yc2-*`). Un partido gráfico, dos volúmenes: simples 1:1 "loud" (púrpura pleno, Archivo Black) + carrusel 4:5 "quiet" (dark, Space Grotesk). Acento lima `#D8FF3E`, metadatos Space Mono, grano. Voz: archetype `guide`, consejero humilde en primera persona. **Imagen en español, copy bilingüe ES+EN** (`copy` + `copy_en`). Ver [docs/superpowers/specs/2026-06-25-yacare-visual-refresh-design.md](docs/superpowers/specs/2026-06-25-yacare-visual-refresh-design.md).

## Cadencia por batch
Por tenant (campo `tenant.cadence`):
- **Yacaré:** 2 simples (`ig_feed` 1:1) + 1 carrusel (`li_carousel`, 5 slides) = **3 posts / 7 imágenes**. "Dos golpes cortos + una pieza explicativa".
- **Argo:** 2 IG feed + 1 IG carrusel (4 slides).

## Modos de generación
- **Batch**: el botón "Generar tanda" → la tanda completa según la cadencia del tenant
- **Single idea**: form con texto libre → 1 post del formato elegido

## Anti-repetición
Últimos 60 días de posts por tenant se inyectan al system prompt como bloque "no repetir". Backstop: Jaro-Winkler ≥ 0.85 marca duplicados para revisión manual.

## Documentos relevantes
- [docs/cleanup-commands.md](docs/cleanup-commands.md) — comandos manuales para apagar el bot legacy y limpiar Supabase
