-- Lessons library
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  audio_path text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  duration_seconds integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index lessons_user_id_idx on public.lessons (user_id);

alter table public.lessons enable row level security;

create policy "Users can manage their own lessons"
  on public.lessons
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sentences produced by AI processing for a lesson
create table public.lesson_sentences (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  sentence_index integer not null,
  text text not null,
  start_time numeric not null,
  end_time numeric not null
);

create index lesson_sentences_lesson_id_idx on public.lesson_sentences (lesson_id);

alter table public.lesson_sentences enable row level security;

create policy "Users can manage sentences of their own lessons"
  on public.lesson_sentences
  for all
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = lesson_sentences.lesson_id
        and lessons.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lessons
      where lessons.id = lesson_sentences.lesson_id
        and lessons.user_id = auth.uid()
    )
  );

-- Saved vocabulary
create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  word text not null,
  meaning text,
  example_sentence text,
  created_at timestamptz not null default now()
);

create index vocabulary_user_id_idx on public.vocabulary (user_id);

alter table public.vocabulary enable row level security;

create policy "Users can manage their own vocabulary"
  on public.vocabulary
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime status updates for lessons (processing -> done/failed)
alter publication supabase_realtime add table public.lessons;

-- Private audio storage, one folder per user
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false);

create policy "Users can manage their own audio files"
  on storage.objects
  for all
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
