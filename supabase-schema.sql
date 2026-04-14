-- ═══════════════════════════════════════════════════════════════════════════════
-- Social Publisher — Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────── 1. tenants ─────────
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  website_url text,
  image_engine text not null default 'html'
    check (image_engine in ('argo_photo_panel', 'html')),
  cadence jsonb not null default '{"ig_feed":4,"li_single":2,"li_carousel":2,"carousel_slides":5}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tenants_slug on tenants(slug);

-- ───────── 2. brand_voice_versions ─────────
create table if not exists brand_voice_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  version int not null,
  is_active boolean not null default false,
  archetype text check (archetype in ('authority', 'innovator', 'friend', 'rebel', 'guide')),
  dimensions jsonb default '{}'::jsonb,
  voice_is text[] default '{}',
  voice_is_not text[] default '{}',
  vocabulary_use text[] default '{}',
  vocabulary_avoid text[] default '{}',
  signature_phrases text[] default '{}',
  dos text[] default '{}',
  donts text[] default '{}',
  pillars jsonb default '[]'::jsonb,
  monthly_themes text[] default '{}',
  sample_copy jsonb default '[]'::jsonb,
  language text default 'es',
  language_rules text,
  system_prompt_override text,
  created_at timestamptz default now(),
  unique(tenant_id, version)
);

create index if not exists idx_voice_active on brand_voice_versions(tenant_id, is_active);

-- ───────── 3. visual_templates ─────────
create table if not exists visual_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  slug text not null,
  format text not null
    check (format in ('ig_feed', 'li_single', 'li_carousel_slide', 'multi')),
  engine text not null check (engine in ('argo_photo_panel', 'html')),
  weight int not null default 1,
  is_active boolean not null default true,
  description text,
  created_at timestamptz default now(),
  unique(tenant_id, slug)
);

create index if not exists idx_visual_templates_lookup
  on visual_templates(tenant_id, format, is_active);

-- ───────── 4. generation_runs ─────────
create table if not exists generation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_voice_version_id uuid references brand_voice_versions(id),
  mode text not null check (mode in ('batch', 'single_idea')),
  manual_idea_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'images_pending', 'ready_for_review', 'approved', 'exported', 'discarded', 'failed')),
  retry_count int default 0,
  error text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_runs_tenant_status on generation_runs(tenant_id, status);

-- ───────── 5. generated_posts ─────────
create table if not exists generated_posts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references generation_runs(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  format text not null check (format in ('ig_feed', 'li_single', 'li_carousel')),
  visual_template_id uuid references visual_templates(id),
  visual_template_slug text,
  visual_variables jsonb default '{}'::jsonb,
  pillar text,
  topic text,
  topic_embedding text,
  title text,
  copy text not null,
  hashtags text[] default '{}',
  cta text,
  slot_order int,
  slides jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'rejected', 'exported', 'published_externally', 'image_failed')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_posts_run on generated_posts(run_id);
create index if not exists idx_posts_tenant_recent on generated_posts(tenant_id, created_at desc);
create index if not exists idx_posts_tenant_status on generated_posts(tenant_id, status);

-- ───────── 6. generated_assets ─────────
create table if not exists generated_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references generated_posts(id) on delete cascade,
  kind text not null check (kind in ('single', 'slide')),
  slide_index int,
  storage_path text not null,
  public_url text not null,
  width int,
  height int,
  prompt_used text,
  created_at timestamptz default now()
);

create index if not exists idx_assets_post on generated_assets(post_id);

-- ───────── 7. manual_ideas ─────────
create table if not exists manual_ideas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  target_format text not null check (target_format in ('ig_feed', 'li_single', 'li_carousel')),
  idea_text text not null,
  notes text,
  consumed_at timestamptz,
  consumed_run_id uuid references generation_runs(id),
  created_at timestamptz default now()
);

create index if not exists idx_ideas_tenant on manual_ideas(tenant_id, consumed_at);

-- ───────── 8. RLS (open for now — single user via middleware) ─────────
alter table tenants enable row level security;
alter table brand_voice_versions enable row level security;
alter table visual_templates enable row level security;
alter table generation_runs enable row level security;
alter table generated_posts enable row level security;
alter table generated_assets enable row level security;
alter table manual_ideas enable row level security;

-- Service role bypasses RLS automatically. For anon access we open everything
-- since the middleware password gates the entire app at the edge.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'tenants' and policyname = 'sp_full_access') then
    create policy sp_full_access on tenants for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'brand_voice_versions' and policyname = 'sp_full_access') then
    create policy sp_full_access on brand_voice_versions for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'visual_templates' and policyname = 'sp_full_access') then
    create policy sp_full_access on visual_templates for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'generation_runs' and policyname = 'sp_full_access') then
    create policy sp_full_access on generation_runs for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'generated_posts' and policyname = 'sp_full_access') then
    create policy sp_full_access on generated_posts for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'generated_assets' and policyname = 'sp_full_access') then
    create policy sp_full_access on generated_assets for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'manual_ideas' and policyname = 'sp_full_access') then
    create policy sp_full_access on manual_ideas for all using (true) with check (true);
  end if;
end $$;

-- ───────── 9. Storage bucket ─────────
insert into storage.buckets (id, name, public)
values ('social-publisher-assets', 'social-publisher-assets', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'sp_assets_public_read') then
    create policy sp_assets_public_read on storage.objects for select
      using (bucket_id = 'social-publisher-assets');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'sp_assets_service_write') then
    create policy sp_assets_service_write on storage.objects for insert
      with check (bucket_id = 'social-publisher-assets');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'sp_assets_service_update') then
    create policy sp_assets_service_update on storage.objects for update
      using (bucket_id = 'social-publisher-assets');
  end if;
end $$;
