-- Sports 노출 플래그 (Sports 어드민에서 작성한 글 표시용)

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS is_pick boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.news.is_pick IS 'Sports 페이지·홈 Sports 섹션 노출 여부';

CREATE INDEX IF NOT EXISTS news_is_pick_idx ON public.news (is_pick)
  WHERE is_pick = true;
