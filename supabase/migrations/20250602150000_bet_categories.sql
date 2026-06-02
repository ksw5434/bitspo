-- /bet · Bet 어드민: bet_categories, news_bet_categories, publish_to_bet

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS publish_to_bet boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.bet_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bet_categories_slug_key
  ON public.bet_categories (slug)
  WHERE slug IS NOT NULL AND slug <> '';

CREATE TABLE IF NOT EXISTS public.news_bet_categories (
  news_id uuid NOT NULL REFERENCES public.news (id) ON DELETE CASCADE,
  bet_category_id uuid NOT NULL REFERENCES public.bet_categories (id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, bet_category_id)
);

CREATE OR REPLACE FUNCTION public.set_bet_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bet_categories_updated_at ON public.bet_categories;
CREATE TRIGGER bet_categories_updated_at
  BEFORE UPDATE ON public.bet_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_bet_categories_updated_at();

ALTER TABLE public.bet_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_bet_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bet_categories_select_public" ON public.bet_categories;
DROP POLICY IF EXISTS "bet_categories_insert_admin" ON public.bet_categories;
DROP POLICY IF EXISTS "bet_categories_update_admin" ON public.bet_categories;
DROP POLICY IF EXISTS "bet_categories_delete_admin" ON public.bet_categories;

CREATE POLICY "bet_categories_select_public"
  ON public.bet_categories
  FOR SELECT
  USING (true);

CREATE POLICY "bet_categories_insert_admin"
  ON public.bet_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "bet_categories_update_admin"
  ON public.bet_categories
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

CREATE POLICY "bet_categories_delete_admin"
  ON public.bet_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "news_bet_categories_select_public" ON public.news_bet_categories;
DROP POLICY IF EXISTS "news_bet_categories_insert_admin" ON public.news_bet_categories;
DROP POLICY IF EXISTS "news_bet_categories_delete_admin" ON public.news_bet_categories;

CREATE POLICY "news_bet_categories_select_public"
  ON public.news_bet_categories
  FOR SELECT
  USING (true);

CREATE POLICY "news_bet_categories_insert_admin"
  ON public.news_bet_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "news_bet_categories_delete_admin"
  ON public.news_bet_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

INSERT INTO public.bet_categories (name, slug, sort_order)
SELECT v.name, v.slug, v.sort_order
FROM (
  VALUES
    ('Betting Sites', 'betting-sites', 0),
    ('How to Bet', 'how-to-bet', 1)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bet_categories bc WHERE bc.slug = v.slug
);
