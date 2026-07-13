-- Church Devotion App - personalization (locale, theme, font scale, onboarding)
-- Run after 0003_community.sql. Run with: supabase db push (or paste into the Supabase SQL editor)

alter table public.profiles add column locale text not null default 'en' check (locale in ('en', 'fr', 'yo', 'ig', 'ha'));
alter table public.profiles add column theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark'));
alter table public.profiles add column font_scale numeric not null default 1.0 check (font_scale >= 0.8 and font_scale <= 1.6);
alter table public.profiles add column has_onboarded boolean not null default false;
