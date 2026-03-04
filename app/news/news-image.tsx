"use client";

import { getRandomPlaceholderThumbnail } from "@/lib/placeholder-image";

/**
 * 뉴스 이미지 컴포넌트
 * 이미지 로드 실패 시 랜덤 placeholder 이미지로 자동 변경
 */

interface NewsImageProps {
  src: string;
  alt: string;
  /** 뉴스 ID - 로드 실패 시 동일 뉴스에 일관된 랜덤 이미지 표시 */
  newsId?: string;
}

export function NewsImage({ src, alt, newsId }: NewsImageProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    // picsum.photos 이미지로 이미 대체된 경우 무한 루프 방지
    if (!target.src.includes("picsum.photos")) {
      target.src = getRandomPlaceholderThumbnail(newsId || `fallback-${Date.now()}`);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover rounded"
      loading="lazy"
      onError={handleError}
    />
  );
}
