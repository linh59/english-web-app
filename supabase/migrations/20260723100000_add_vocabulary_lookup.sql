-- Global cache for word/phrase lookups (definition + classification), shared
-- across ALL users so the same (word, sentence) pair only ever costs one
-- Gemini call system-wide, not per user/save. Free dictionary APIs can't
-- classify phrasal verbs/idioms/CEFR level/context-sensitive synonyms, so
-- Gemini is the primary source here (see lookup-word-meaning Edge Function);
-- caching by (word, context) is the actual cost lever, not avoiding Gemini.
create table public.word_lookups (
  id uuid primary key default gen_random_uuid(),
  word_normalized text not null,
  context_hash text not null,
  definition_en text,
  meaning_vi text,
  part_of_speech text,
  word_type text check (word_type in ('single_word', 'phrasal_verb', 'idiom', 'collocation', 'phrase')),
  cefr_level text check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  synonyms text[],
  antonyms text[],
  phonetic text,
  created_at timestamptz not null default now(),
  unique (word_normalized, context_hash)
);

alter table public.word_lookups enable row level security;

-- Not user-scoped data (a shared dictionary-style cache) — any authenticated
-- user may read it. Only the lookup-word-meaning Edge Function writes to it,
-- using the service role key (bypasses RLS), so no insert/update policy here.
create policy "Authenticated users can read the word lookup cache"
  on public.word_lookups
  for select
  to authenticated
  using (true);

alter table public.vocabulary
  add column definition_en text,
  add column part_of_speech text,
  add column word_type text check (word_type in ('single_word', 'phrasal_verb', 'idiom', 'collocation', 'phrase')),
  add column cefr_level text check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  add column synonyms text[],
  add column antonyms text[],
  add column start_time numeric,
  add column end_time numeric,
  add column encounter_count integer not null default 1,
  add column updated_at timestamptz not null default now(),
  -- Stored (not just a plain expression index) so a plain unique index on
  -- (user_id, word_key) below is something PostgREST's upsert onConflict can
  -- target directly — onConflict only accepts real column names, not
  -- expressions like lower(word).
  add column word_key text generated always as (lower(word)) stored;

-- Re-selecting an already-saved word upserts onto this key (see
-- vocabulary.store.ts::saveVocabulary) instead of creating a duplicate row,
-- and encounter_count becomes the "exposure" signal for review.
create unique index vocabulary_user_word_key_uidx
  on public.vocabulary (user_id, word_key);

-- Base table grants for word_lookups. RLS policies alone are not enough —
-- Postgres also requires the role to have the underlying table privilege
-- before RLS is even evaluated (verified locally: a fresh `supabase start`
-- 42501s with "permission denied for table word_lookups" until granted).
-- service_role has BYPASSRLS, so its grant is what actually gates the Edge
-- Function's cache writes; authenticated's grant is narrowed to select only,
-- matching the read-only policy above.
grant select, insert, update on public.word_lookups to service_role;
grant select on public.word_lookups to authenticated;

-- Every other table in this schema has the exact same gap locally: none of
-- the migrations up to this point ever granted base privileges to
-- `authenticated`, because the existing remote project already had them from
-- its original cloud provisioning (predating the stricter "new cloud
-- default" noted in supabase/config.toml's auto_expose_new_tables comment).
-- A fresh `supabase start` never had that provisioning step, so every table
-- 42501s, not just word_lookups. Fixing it here (once, project-wide) is a
-- harmless no-op against the existing remote project and unblocks local dev
-- for anyone running this repo's local stack for the first time.
grant select, insert, update, delete
  on public.lessons, public.lesson_sentences, public.lesson_sentence_translations, public.vocabulary
  to authenticated;
