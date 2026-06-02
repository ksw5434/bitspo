-- 카테고리 표시 순서 (드래그 앤 드롭 정렬용)

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.sports_categories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- 기존 행 순서 초기화 (이름순 → sort_order 0,1,2…)
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY name ASC, created_at ASC) - 1 AS rn
  FROM public.categories
)
UPDATE public.categories c
SET sort_order = numbered.rn
FROM numbered
WHERE c.id = numbered.id;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY name ASC, created_at ASC) - 1 AS rn
  FROM public.sports_categories
)
UPDATE public.sports_categories sc
SET sort_order = numbered.rn
FROM numbered
WHERE sc.id = numbered.id;

CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories (sort_order);
CREATE INDEX IF NOT EXISTS sports_categories_sort_order_idx ON public.sports_categories (sort_order);
