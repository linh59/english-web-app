-- Lightweight breadcrumb so we can see which phase of AI processing a lesson
-- is stuck in (download / upload to Gemini / waiting on Gemini / transcribing / saving),
-- since a killed Edge Function invocation leaves no other trace.
alter table public.lessons add column processing_step text;
