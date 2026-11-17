-- ============================================================================
-- AI Talent Intelligence Platform — Supabase schema (Phase 5)
--
-- Run this ENTIRE file once in the Supabase dashboard's SQL Editor
-- (Project -> SQL Editor -> New query -> paste -> Run). It is self-contained:
-- tables, indexes, Row Level Security policies, and storage buckets are all in
-- here. `policies.sql` duplicates just the RLS section for reference/review —
-- you don't need to run it separately.
--
-- Mirrors the shape of backend/app/database/local_store.py's JSON records, so
-- the Phase 5 Supabase-backed store (app/database/supabase_store.py) is a
-- drop-in replacement with no API-shape changes for the frontend.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- jobs — a recruiter's company requirement (created via POST /jobs[/upload])
-- ----------------------------------------------------------------------------
create table if not exists public.jobs (
  job_id            text primary key,
  owner_user_id     uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  raw_text          text not null,
  structured_job    jsonb not null,
  source_file_path  text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_jobs_owner on public.jobs(owner_user_id);

-- ----------------------------------------------------------------------------
-- uploaded_resumes — one uploaded resume, its parsed candidate data, and (if
-- scored against a job) its score + explanation.
-- ----------------------------------------------------------------------------
create table if not exists public.uploaded_resumes (
  resume_id          text primary key,
  owner_user_id      uuid not null references auth.users(id) on delete cascade,
  job_id             text references public.jobs(job_id) on delete set null,
  original_filename  text not null,
  stored_file_path   text,
  status             text not null default 'pending'
                       check (status in ('pending', 'parsed', 'scored', 'failed')),
  candidate          jsonb,
  score_result       jsonb,
  error              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_uploaded_resumes_owner on public.uploaded_resumes(owner_user_id);
create index if not exists idx_uploaded_resumes_job_id on public.uploaded_resumes(job_id);

-- ============================================================================
-- Row Level Security — every row is only visible/writable by the user who
-- created it. The backend queries as the signed-in user (via
-- postgrest.auth(user_jwt)), never with a blanket service-role bypass, so
-- these policies are the actual enforcement, not just a formality.
-- ============================================================================

alter table public.jobs enable row level security;
alter table public.uploaded_resumes enable row level security;

create policy "jobs_select_own" on public.jobs
  for select using (auth.uid() = owner_user_id);
create policy "jobs_insert_own" on public.jobs
  for insert with check (auth.uid() = owner_user_id);
create policy "jobs_update_own" on public.jobs
  for update using (auth.uid() = owner_user_id);
create policy "jobs_delete_own" on public.jobs
  for delete using (auth.uid() = owner_user_id);

create policy "resumes_select_own" on public.uploaded_resumes
  for select using (auth.uid() = owner_user_id);
create policy "resumes_insert_own" on public.uploaded_resumes
  for insert with check (auth.uid() = owner_user_id);
create policy "resumes_update_own" on public.uploaded_resumes
  for update using (auth.uid() = owner_user_id);
create policy "resumes_delete_own" on public.uploaded_resumes
  for delete using (auth.uid() = owner_user_id);

-- ============================================================================
-- Storage — uploaded resume files and job-description files, replacing the
-- local uploads/resumes and uploads/job_descriptions directories. Private
-- buckets; files are stored under "<user_id>/<record_id>/<filename>" so the
-- storage policies can check ownership from the path itself.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('job-descriptions', 'job-descriptions', false)
on conflict (id) do nothing;

create policy "resumes_storage_own" on storage.objects
  for all using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "job_descriptions_storage_own" on storage.objects
  for all using (
    bucket_id = 'job-descriptions'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'job-descriptions'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
