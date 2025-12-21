-- ============================================
-- 뉴스 요약 필드 추가 마이그레이션
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행
-- 
-- 이 마이그레이션은 news 테이블에 summary 컬럼을 추가하여
-- Google AI API로 생성한 요약을 캐싱합니다.
-- 이를 통해 동일한 뉴스에 대해 반복적인 API 호출을 방지하고 비용을 절감합니다.

-- news 테이블에 summary 컬럼 추가
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- summary 컬럼에 대한 인덱스 생성 (선택사항, 성능 최적화)
CREATE INDEX IF NOT EXISTS news_summary_idx ON public.news(summary) 
WHERE summary IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN public.news.summary IS 'Google AI API로 생성된 뉴스 요약 (캐싱용)';

