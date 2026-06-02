import type { NewsCategoryRecord } from "@/lib/news-categories";

/** 레거시 /news?tab= 쿼리 (하위 호환) */
export type LegacyNewsTab = "sports" | "crypto";

export const LEGACY_NEWS_TAB_LABELS: Record<LegacyNewsTab, string> = {
  sports: "Sports News",
  crypto: "Crypto Insights",
};

/** URL 쿼리에서 레거시 탭 값 파싱 */
export function parseLegacyNewsTab(tabParam: string | null): LegacyNewsTab {
  return tabParam === "crypto" ? "crypto" : "sports";
}

/** 레거시 탭 → 기본 카테고리 slug (DB 카테고리명과 매칭) */
export const LEGACY_TAB_TO_CATEGORY_SLUG: Record<LegacyNewsTab, string> = {
  sports: "sports-news",
  crypto: "crypto-insights",
};

/** 활성 카테고리 slug 결정 (category 쿼리 우선, 없으면 tab 변환) */
export function resolveActiveCategorySlug(
  categoryParam: string | null,
  tabParam: string | null,
): string | null {
  if (categoryParam?.trim()) {
    return categoryParam.trim();
  }

  if (tabParam === "crypto" || tabParam === "sports") {
    return LEGACY_TAB_TO_CATEGORY_SLUG[parseLegacyNewsTab(tabParam)];
  }

  return null;
}

/** 카테고리가 없을 때 쓰는 기본 탭 목록 */
export const FALLBACK_NEWS_CATEGORIES: Pick<
  NewsCategoryRecord,
  "id" | "name" | "slug"
>[] = [
  { id: "fallback-sports", name: "Sports News", slug: "sports-news" },
  { id: "fallback-crypto", name: "Crypto Insights", slug: "crypto-insights" },
];
