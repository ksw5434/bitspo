import { categoryNameToSlug } from "@/lib/news-categories";

/** Crypto 카테고리 (Supabase crypto_categories 테이블) */
export type CryptoCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export { categoryNameToSlug };

/** DB row 정규화 */
export function normalizeCryptoCategory(
  row: {
    id: string;
    name: string;
    slug?: string | null;
    created_at: string;
    updated_at: string;
  },
): CryptoCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug?.trim() || categoryNameToSlug(row.name),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** 뉴스가 Crypto 카테고리에 속하는지 */
export function newsHasCryptoCategory(
  news: {
    news_crypto_categories?: Array<{
      crypto_category_id: string;
      crypto_categories: { id: string; name: string } | null;
    }>;
  },
  categoryId: string,
): boolean {
  return (news.news_crypto_categories ?? []).some(
    (item) =>
      item.crypto_category_id === categoryId ||
      item.crypto_categories?.id === categoryId,
  );
}
