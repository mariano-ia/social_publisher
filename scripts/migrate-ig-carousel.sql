-- Migration: add `ig_carousel` format support + update tenant cadences
-- Run this ONCE in the argo-smo Supabase SQL editor.
-- Idempotent: uses DO blocks + IF NOT EXISTS guards.
--
-- Related code commit: feat/new-cadence (batch size reduction)

-- ─────────────────────────────────────────────────────────────
-- 1. Expand the format check constraint on generated_posts so
--    ig_carousel becomes a valid value. Drop + re-add approach.
-- ─────────────────────────────────────────────────────────────

alter table generated_posts drop constraint if exists generated_posts_format_check;
alter table generated_posts add constraint generated_posts_format_check
  check (format in ('ig_feed', 'li_single', 'li_carousel', 'ig_carousel'));

-- ─────────────────────────────────────────────────────────────
-- 2. Update tenant cadences to the new smaller batch sizes.
--    Shape: { ig_feed, li_single, li_carousel, ig_carousel, carousel_slides }
-- ─────────────────────────────────────────────────────────────

-- Yacaré: 2 IG + 2 LI + 1 LI carousel of 4 slides = 5 posts / 8 images
update tenants
set cadence = '{
  "ig_feed": 2,
  "li_single": 2,
  "li_carousel": 1,
  "ig_carousel": 0,
  "carousel_slides": 4
}'::jsonb
where slug = 'yacare';

-- Argo: 2 IG + 1 IG carousel of 4 slides = 3 posts / 6 images
-- No LI posts in the new Argo cadence
update tenants
set cadence = '{
  "ig_feed": 2,
  "li_single": 0,
  "li_carousel": 0,
  "ig_carousel": 1,
  "carousel_slides": 4
}'::jsonb
where slug = 'argo';

-- ─────────────────────────────────────────────────────────────
-- 3. Verify
-- ─────────────────────────────────────────────────────────────

select slug, name, cadence from tenants;
