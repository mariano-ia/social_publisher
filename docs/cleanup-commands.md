# Cleanup Commands — Social Publisher

Comandos manuales que ejecutás **vos** cuando estés listo para limpiar restos del proyecto anterior (`argo-social-bot`). Ninguno es ejecutado automáticamente por la app — son destructivos y reversibilidad cero, así que se hacen a mano cuando estés 100% seguro.

## 1. Drop de tablas viejas en Supabase

Las tres tablas del bot legacy quedan huérfanas en el mismo Postgres pero ya no se usan. Cuando confirmes que Social Publisher anda y no las necesitás, ejecutá esto en el SQL Editor de Supabase (https://supabase.com/dashboard → SQL):

```sql
-- ⚠️ DESTRUCTIVO — borra datos irreversiblemente.
-- Solo correr cuando hayas confirmado que Social Publisher anda OK
-- y no necesitás los datos históricos del bot.

drop table if exists social_queue cascade;
drop table if exists content_calendar cascade;
drop table if exists blog_posts cascade;
```

Si dudás, primero hacé un backup: en Supabase Dashboard → Database → Backups, generá un snapshot manual antes de correr los DROPs.

## 2. Cleanup de Storage bucket viejo

El bot usaba el bucket `blog-images` con prefix `social/` para sus imágenes. Social Publisher usa un bucket nuevo dedicado (`social-publisher-assets`) — más prolijo y separado.

**Para borrar los assets viejos del bot:**

```sql
-- Borra todos los archivos bajo blog-images/social/
-- en Supabase Storage.
delete from storage.objects
where bucket_id = 'blog-images'
  and name like 'social/%';
```

**Para borrar el bucket viejo entero** (solo si confirmás que `blog-images` no se usa para nada más, como blog posts del sitio público):

```sql
-- ⚠️ Asegurate de que blog-images NO está en uso por argomethod.com u otro sitio.
delete from storage.buckets where id = 'blog-images';
```

## 3. Apagar el servicio Railway del bot

1. Ir a https://railway.app → tu proyecto del bot
2. Settings → Danger → **Delete Service**
3. Confirmar el nombre del proyecto

**Antes de apagar Railway**, asegurate de que:
- Social Publisher está deployado en Vercel y funciona end-to-end
- Generaste al menos 1 batch real de Argo desde Vercel y funcionó OK
- Generaste al menos 1 batch real de Yacaré desde Vercel y funcionó OK
- Tenés los `.env` del bot guardados en algún lado (por las dudas)

## 4. Variables de entorno legacy en Vercel

Si copiaste tal cual los env vars del bot a Vercel, hay algunas que ya no se usan en Social Publisher y conviene quitar para no confundir:

```
TELEGRAM_BOT_TOKEN          ← borrar
TELEGRAM_CHAT_ID            ← borrar
RAILWAY_*                   ← borrar (todas las que empiezan así)
NODE_CRON_*                 ← borrar
```

En Vercel: Project Settings → Environment Variables → seleccionar y borrar cada una.

Variables que **sí** se mantienen y son requeridas por Social Publisher:

```
ANTHROPIC_API_KEY           ← Claude para generación de copy
OPENAI_API_KEY              ← gpt-image-1 para imágenes Argo
SUPABASE_URL                ← DB
SUPABASE_SERVICE_KEY        ← DB (server-side)
NEXT_PUBLIC_SUPABASE_URL    ← DB (client-side, mismo valor que SUPABASE_URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY  ← DB (client-side, anon key)
APP_PASSWORD                ← password único del middleware de auth
```

## 5. Repo de GitHub viejo

El repo `mariano-ia/argo-social-bot` (si existe en GitHub) lo podés:
- Archivar (Settings → General → Archive this repository) — recomendado, mantiene la historia
- Borrar (Settings → General → Delete this repository) — solo si estás 100% seguro

Recomendación: **archivar**, no borrar. Te da rollback histórico si alguna vez necesitás mirar cómo hacía algo el bot.

## 6. Carpeta local del bot

Si tenés `argo-social-bot/` en tu disco como una carpeta separada (que es de donde lo clonamos), la podés borrar cuando hayas confirmado que todo lo que necesitabas migró:

```bash
rm -rf "/Users/marianonoceti/Desktop/Antigravity/argo-social-bot"
```

Recomendación: **dejala** por al menos 1 mes después del go-live de Social Publisher. Ocupa muy poco y te sirve de referencia si necesitás recordar cómo hacía X cosa el bot.

---

## Orden recomendado de ejecución

1. Deployar Social Publisher a Vercel ✅
2. Generar y publicar manualmente 1 semana de Argo desde Social Publisher ✅
3. Generar y publicar manualmente 1 semana de Yacaré desde Social Publisher ✅
4. Esperar 1 semana sin problemas ✅
5. **Recién ahí**: Apagar Railway (paso 3 de este doc)
6. **1 mes después**: Drop tablas viejas (paso 1) + cleanup bucket (paso 2) + borrar env vars legacy (paso 4) + archivar repo (paso 5)
7. **3 meses después** (opcional): borrar carpeta local del bot (paso 6)

Cada paso es reversible hasta el momento del DROP. Después del DROP no hay vuelta atrás sin restore desde backup.
