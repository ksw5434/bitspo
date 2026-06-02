-- /crypto · Crypto 어드민: crypto_categories, news_crypto_categories, publish_to_crypto

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS publish_to_crypto boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.crypto_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crypto_categories_slug_key
  ON public.crypto_categories (slug)
  WHERE slug IS NOT NULL AND slug <> '';

CREATE TABLE IF NOT EXISTS public.news_crypto_categories (
  news_id uuid NOT NULL REFERENCES public.news (id) ON DELETE CASCADE,
  crypto_category_id uuid NOT NULL REFERENCES public.crypto_categories (id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, crypto_category_id)
);

CREATE OR REPLACE FUNCTION public.set_crypto_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crypto_categories_updated_at ON public.crypto_categories;
CREATE TRIGGER crypto_categories_updated_at
  BEFORE UPDATE ON public.crypto_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_crypto_categories_updated_at();

ALTER TABLE public.crypto_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_crypto_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crypto_categories_select_public" ON public.crypto_categories;
DROP POLICY IF EXISTS "crypto_categories_insert_admin" ON public.crypto_categories;
DROP POLICY IF EXISTS "crypto_categories_update_admin" ON public.crypto_categories;
DROP POLICY IF EXISTS "crypto_categories_delete_admin" ON public.crypto_categories;

CREATE POLICY "crypto_categories_select_public"
  ON public.crypto_categories
  FOR SELECT
  USING (true);

CREATE POLICY "crypto_categories_insert_admin"
  ON public.crypto_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "crypto_categories_update_admin"
  ON public.crypto_categories
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

CREATE POLICY "crypto_categories_delete_admin"
  ON public.crypto_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "news_crypto_categories_select_public" ON public.news_crypto_categories;
DROP POLICY IF EXISTS "news_crypto_categories_insert_admin" ON public.news_crypto_categories;
DROP POLICY IF EXISTS "news_crypto_categories_delete_admin" ON public.news_crypto_categories;

CREATE POLICY "news_crypto_categories_select_public"
  ON public.news_crypto_categories
  FOR SELECT
  USING (true);

CREATE POLICY "news_crypto_categories_insert_admin"
  ON public.news_crypto_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "news_crypto_categories_delete_admin"
  ON public.news_crypto_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

INSERT INTO public.crypto_categories (name, slug, sort_order)
SELECT v.name, v.slug, v.sort_order
FROM (
  VALUES
    ('Bitcoin', 'bitcoin', 0),
    ('Ethereum', 'ethereum', 1),
    ('DeFi', 'defi', 2),
    ('NFT', 'nft', 3),
    ('Altcoins', 'altcoins', 4)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crypto_categories cc WHERE cc.slug = v.slug
);
