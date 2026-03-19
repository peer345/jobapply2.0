-- Add missing current_city and preferred_city columns to answer_bank
alter table public.answer_bank 
add column if not exists current_city text,
add column if not exists preferred_city text;
