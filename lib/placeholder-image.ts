/**
 * 뉴스 이미지가 없을 때 사용할 랜덤 placeholder 이미지 유틸리티
 * picsum.photos 사용 - 동일 ID에 대해 일관된 이미지 반환
 */

/**
 * 뉴스 ID를 기반으로 랜덤 placeholder 이미지 URL 생성
 * @param newsId - 뉴스 ID (같은 뉴스는 항상 같은 이미지)
 * @param width - 이미지 너비 (기본 800)
 * @param height - 이미지 높이 (기본 600)
 */
export function getRandomPlaceholderImage(
  newsId: string,
  width = 800,
  height = 600
): string {
  // newsId를 seed로 사용하여 동일 뉴스는 항상 같은 이미지
  const seed = newsId || `fallback-${Date.now()}`;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * 뉴스 썸네일용 작은 랜덤 이미지 (200x200)
 */
export function getRandomPlaceholderThumbnail(newsId: string): string {
  return getRandomPlaceholderImage(newsId, 200, 200);
}

/**
 * 캐러셀/메인용 큰 랜덤 이미지 (800x600)
 */
export function getRandomPlaceholderLarge(newsId: string): string {
  return getRandomPlaceholderImage(newsId, 800, 600);
}
