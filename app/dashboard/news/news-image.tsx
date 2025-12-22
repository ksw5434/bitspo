"use client";

/**
 * 뉴스 이미지 컴포넌트
 * 이미지 로드 실패 시 대체 이미지로 자동 변경
 */

// 기본 placeholder 이미지 URL (안정적인 서비스 사용)
const DEFAULT_PLACEHOLDER_IMAGE = "https://via.placeholder.com/200x200?text=No+Image";

interface NewsImageProps {
  src: string;
  alt: string;
}

export function NewsImage({ src, alt }: NewsImageProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 이미지 로드 실패 시 대체 이미지로 변경 (무한 루프 방지)
    const target = e.target as HTMLImageElement;
    // 이미 대체 이미지인 경우 더 이상 변경하지 않음
    if (!target.src.includes('placeholder.com')) {
      target.src = DEFAULT_PLACEHOLDER_IMAGE;
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
