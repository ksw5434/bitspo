/** 뉴스 카테고리 조인 타입 (목록 조회 공통) */
export type NewsWithCategories = {
  id: string;
  headline: string;
  content: string | null;
  image_url: string | null;
  author_id: string | null;
  is_pick?: boolean | null;
  publish_to_crypto?: boolean | null;
  publish_to_bet?: boolean | null;
  created_at: string;
  updated_at: string;
  news_categories?: Array<{
    category_id: string;
    categories: {
      id: string;
      name: string;
    } | null;
  }>;
  news_sports_categories?: Array<{
    sports_category_id: string;
    sports_categories: {
      id: string;
      name: string;
      slug?: string | null;
    } | null;
  }>;
  news_crypto_categories?: Array<{
    crypto_category_id: string;
    crypto_categories: {
      id: string;
      name: string;
      slug?: string | null;
    } | null;
  }>;
  news_bet_categories?: Array<{
    bet_category_id: string;
    bet_categories: {
      id: string;
      name: string;
      slug?: string | null;
    } | null;
  }>;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};

/** 뉴스 카테고리명 목록 추출 */
export function getNewsCategoryNames(news: NewsWithCategories): string[] {
  return (news.news_categories ?? [])
    .map((item) => item.categories?.name?.toLowerCase() ?? "")
    .filter((name) => name.length > 0);
}

/** Sports News 여부 (is_pick 또는 스포츠 카테고리) */
export function isSportsNewsItem(news: NewsWithCategories): boolean {
  if (news.is_pick === true) {
    return true;
  }

  if ((news.news_sports_categories ?? []).length > 0) {
    return true;
  }

  return getNewsCategoryNames(news).some((name) => name.includes("sport"));
}

/** Crypto News 여부 (publish_to_crypto 또는 crypto 카테고리) */
export function isCryptoNewsItem(news: NewsWithCategories): boolean {
  if (news.publish_to_crypto === true) {
    return true;
  }

  if ((news.news_crypto_categories ?? []).length > 0) {
    return true;
  }

  return getNewsCategoryNames(news).some((name) => name.includes("crypto"));
}

/** Bet News 여부 (publish_to_bet 또는 bet 카테고리) */
export function isBetNewsItem(news: NewsWithCategories): boolean {
  if (news.publish_to_bet === true) {
    return true;
  }

  if ((news.news_bet_categories ?? []).length > 0) {
    return true;
  }

  return getNewsCategoryNames(news).some((name) => name.includes("bet"));
}

/** 본문에서 첫 번째 이미지 URL 추출 */
export function getFirstImageFromNewsContent(
  content: string | null,
): string | null {
  if (!content) return null;

  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch?.[1]) {
    return imgMatch[1];
  }

  try {
    const jsonContent = JSON.parse(content);
    if (jsonContent?.content) {
      const findImage = (nodes: Array<Record<string, unknown>>): string | null => {
        for (const node of nodes) {
          if (node.type === "image" && (node.attrs as { src?: string })?.src) {
            return (node.attrs as { src: string }).src;
          }
          if (Array.isArray(node.content)) {
            const found = findImage(node.content as Array<Record<string, unknown>>);
            if (found) return found;
          }
        }
        return null;
      };
      return findImage(jsonContent.content);
    }
  } catch {
    // HTML/JSON 파싱 실패 시 무시
  }

  return null;
}

/** TOP News용 상대 시간 포맷 */
export function formatNewsRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
  } catch (error) {
    console.error("날짜 포맷팅 오류:", error);
    return "날짜 불명";
  }
}
