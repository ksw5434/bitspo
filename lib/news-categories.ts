/** 뉴스 카테고리 (Supabase categories 테이블) */
export type NewsCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

/** 카테고리명 → URL slug (한글·영문 지원) */
export function categoryNameToSlug(categoryName: string): string {
  const trimmed = categoryName.trim().toLowerCase();
  const slug = trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `category-${Date.now()}`;
}

/** DB row에 slug가 없을 때 name으로 생성 */
export function normalizeNewsCategory(
  row: { id: string; name: string; slug?: string | null; created_at: string; updated_at: string },
): NewsCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug?.trim() || categoryNameToSlug(row.name),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** 뉴스가 특정 카테고리에 속하는지 */
export function newsHasCategory(
  news: {
    news_categories?: Array<{
      category_id: string;
      categories: { id: string; name: string } | null;
    }>;
  },
  categoryId: string,
): boolean {
  return (news.news_categories ?? []).some(
    (item) =>
      item.category_id === categoryId || item.categories?.id === categoryId,
  );
}
