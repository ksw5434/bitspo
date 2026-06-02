-- /sports · Sports 어드민: sports_categories, news_sports_categories

CREATE TABLE IF NOT EXISTS public.sports_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sports_categories_slug_key
  ON public.sports_categories (slug)
  WHERE slug IS NOT NULL AND slug <> '';

CREATE TABLE IF NOT EXISTS public.news_sports_categories (
  news_id uuid NOT NULL REFERENCES public.news (id) ON DELETE CASCADE,
  sports_category_id uuid NOT NULL REFERENCES public.sports_categories (id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, sports_category_id)
);

CREATE OR REPLACE FUNCTION public.set_sports_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sports_categories_updated_at ON public.sports_categories;
CREATE TRIGGER sports_categories_updated_at
  BEFORE UPDATE ON public.sports_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sports_categories_updated_at();

ALTER TABLE public.sports_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sports_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sports_categories_select_public" ON public.sports_categories;
DROP POLICY IF EXISTS "sports_categories_insert_admin" ON public.sports_categories;
DROP POLICY IF EXISTS "sports_categories_update_admin" ON public.sports_categories;
DROP POLICY IF EXISTS "sports_categories_delete_admin" ON public.sports_categories;

CREATE POLICY "sports_categories_select_public"
  ON public.sports_categories
  FOR SELECT
  USING (true);

CREATE POLICY "sports_categories_insert_admin"
  ON public.sports_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "sports_categories_update_admin"
  ON public.sports_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "sports_categories_delete_admin"
  ON public.sports_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "news_sports_categories_select_public" ON public.news_sports_categories;
DROP POLICY IF EXISTS "news_sports_categories_insert_admin" ON public.news_sports_categories;
DROP POLICY IF EXISTS "news_sports_categories_delete_admin" ON public.news_sports_categories;

CREATE POLICY "news_sports_categories_select_public"
  ON public.news_sports_categories
  FOR SELECT
  USING (true);

CREATE POLICY "news_sports_categories_insert_admin"
  ON public.news_sports_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "news_sports_categories_delete_admin"
  ON public.news_sports_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

INSERT INTO public.sports_categories (name, slug)
SELECT v.name, v.slug
FROM (
  VALUES
    ('NBA', 'nba'),
    ('NFL', 'nfl'),
    ('MLB', 'mlb'),
    ('GOLF', 'golf')
) AS v(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sports_categories sc WHERE sc.slug = v.slug
);
