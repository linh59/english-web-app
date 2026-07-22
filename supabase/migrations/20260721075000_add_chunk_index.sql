alter table public.lesson_sentences add column chunk_index integer not null default 0;

create index lesson_sentences_lesson_chunk_idx on public.lesson_sentences (lesson_id, chunk_index);
