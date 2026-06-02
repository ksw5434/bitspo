-- News categories: slug 컬럼 (URL·탭용)

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.categories
SET slug = lower(regexp_replace(trim(name), '\s+', '-', 'g'))
WHERE slug IS NULL OR trim(slug) = '';

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key
  ON public.categories (slug)
  WHERE slug IS NOT NULL AND trim(slug) <> '';
