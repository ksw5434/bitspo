import {
  MOCK_CRYPTO_NEWS_GRID,
  MOCK_CRYPTO_TOP_NEWS,
} from "@/lib/crypto-news-mock";
import { NewsCardGrid } from "@/app/_components/news-card-grid";
import { NewsSection } from "@/app/_components/news-section";

/**
 * /crypto 페이지 목업 — /news와 동일 7:3 레이아웃
 */
export function CryptoPageContent() {
  return (
    <main className="container mx-auto w-full max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        {/* 메인 그리드 (7) */}
        <section className="lg:col-span-7">
          <NewsCardGrid
            newsItems={MOCK_CRYPTO_NEWS_GRID}
            enableDetailLink={false}
          />
        </section>

        {/* TOP News 사이드바 (3) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-[calc(var(--crypto-tabs-height,2.5rem)+0.75rem)] lg:self-start">
          <NewsSection newsItems={MOCK_CRYPTO_TOP_NEWS} showPagination={false} />
        </aside>
      </div>
    </main>
  );
}
