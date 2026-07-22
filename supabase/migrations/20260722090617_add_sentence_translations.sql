-- Sentence translations — separate table (not a column on lesson_sentences) so
-- adding another target language later only needs new rows, not a migration.
create table public.lesson_sentence_translations (
  id uuid primary key default gen_random_uuid(),
  sentence_id uuid not null references public.lesson_sentences (id) on delete cascade,
  language text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  unique (sentence_id, language)
);

create index lesson_sentence_translations_sentence_id_idx
  on public.lesson_sentence_translations (sentence_id);

alter table public.lesson_sentence_translations enable row level security;

create policy "Users can manage translations of their own lesson sentences"
  on public.lesson_sentence_translations
  for all
  using (exists (
    select 1 from public.lesson_sentences
    join public.lessons on lessons.id = lesson_sentences.lesson_id
    where lesson_sentences.id = lesson_sentence_translations.sentence_id
      and lessons.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.lesson_sentences
    join public.lessons on lessons.id = lesson_sentences.lesson_id
    where lesson_sentences.id = lesson_sentence_translations.sentence_id
      and lessons.user_id = auth.uid()
  ));

-- Drives the "translating..." spinner via Realtime + stores an error message on
-- failure. NOT used to decide whether the "Translate" button shows on LessonCard —
-- see get_lessons_translation_progress() below, which checks actual data instead
-- (this status column can get stuck at 'processing' if the tab closes mid-run, the
-- same failure mode already seen with lessons.status for transcription).
alter table public.lessons add column translation_status text not null default 'pending'
  check (translation_status in ('pending', 'processing', 'done', 'failed'));

-- Batched, accurate "does this lesson still have untranslated sentences" check —
-- avoids downloading potentially 1000+ lesson_sentences rows per lesson just to
-- count client-side, and avoids trusting translation_status (which can drift from
-- reality, see comment above).
create function public.get_lessons_translation_progress(lesson_ids uuid[])
returns table (lesson_id uuid, sentence_count bigint, translated_count bigint)
language sql stable security invoker as $$
  select
    ls.lesson_id,
    count(*) as sentence_count,
    count(lst.id) as translated_count
  from public.lesson_sentences ls
  left join public.lesson_sentence_translations lst
    on lst.sentence_id = ls.id and lst.language = 'vi'
  where ls.lesson_id = any(lesson_ids)
  group by ls.lesson_id;
$$;
