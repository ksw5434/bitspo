"use client";

/**
 * 뉴스 이미지 컴포넌트
 * 이미지 로드 실패 시 대체 이미지로 자동 변경
 */
interface NewsImageProps {
  src: string;
  alt: string;
}

export function NewsImage({ src, alt }: NewsImageProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 이미지 로드 실패 시 대체 이미지로 변경
    const target = e.target as HTMLImageElement;
    target.src = `https://source.unsplash.com/random/200x200?${Date.now()}`;
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
