import { categoryNameToSlug } from "@/lib/news-categories";

/** 스포츠 카테고리 (Supabase sports_categories 테이블) */
export type SportsCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export { categoryNameToSlug };

/** DB row 정규화 */
export function normalizeSportsCategory(
  row: {
    id: string;
    name: string;
    slug?: string | null;
    created_at: string;
    updated_at: string;
  },
): SportsCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug?.trim() || categoryNameToSlug(row.name),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** 뉴스가 스포츠 카테고리에 속하는지 */
export function newsHasSportsCategory(
  news: {
    news_sports_categories?: Array<{
      sports_category_id: string;
      sports_categories: { id: string; name: string } | null;
    }>;
  },
  categoryId: string,
): boolean {
  return (news.news_sports_categories ?? []).some(
    (item) =>
      item.sports_category_id === categoryId ||
      item.sports_categories?.id === categoryId,
  );
}
