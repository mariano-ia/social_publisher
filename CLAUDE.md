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
      templates/yacare/      # 5 React templates Yacaré
  components/
  middleware.ts              # auth check
scripts/
  seed.ts                    # seed inicial de tenants
docs/
  cleanup-commands.md        # comandos manuales para cleanup post-cutover
```

## Tenants iniciales
- **Argo Method** (`argo`) — usa pipeline gpt-image-1 con STYLE_BASE histórico. Brand voice via `system_prompt_override` (113 líneas legacy).
- **Yacaré** (`yacare`) — usa HTML→PNG con 5 templates. Brand voice estructurado: archetype rebel, voseo rioplatense, púrpura `#8A5EFF`.

## Cadencia por batch
4 IG feed + 2 LI single + 2 LI carrusel × 5 slides = **8 posts / 18 imágenes** por batch.

## Modos de generación
- **Batch**: el botón "Generar tanda" → 8 posts coherentes
- **Single idea**: form con texto libre → 1 post del formato elegido

## Anti-repetición
Últimos 60 días de posts por tenant se inyectan al system prompt como bloque "no repetir". Backstop: Jaro-Winkler ≥ 0.85 marca duplicados para revisión manual.

## Documentos relevantes
- [docs/cleanup-commands.md](docs/cleanup-commands.md) — comandos manuales para apagar el bot legacy y limpiar Supabase
