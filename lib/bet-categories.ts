import { categoryNameToSlug } from "@/lib/news-categories";

/** Bet 카테고리 (Supabase bet_categories 테이블) */
export type BetCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export { categoryNameToSlug };

/** DB row 정규화 */
export function normalizeBetCategory(
  row: {
    id: string;
    name: string;
    slug?: string | null;
    created_at: string;
    updated_at: string;
  },
): BetCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug?.trim() || categoryNameToSlug(row.name),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** 뉴스가 Bet 카테고리에 속하는지 */
export function newsHasBetCategory(
  news: {
    news_bet_categories?: Array<{
      bet_category_id: string;
      bet_categories: { id: string; name: string } | null;
    }>;
  },
  categoryId: string,
): boolean {
  return (news.news_bet_categories ?? []).some(
    (item) =>
      item.bet_category_id === categoryId ||
      item.bet_categories?.id === categoryId,
  );
}
