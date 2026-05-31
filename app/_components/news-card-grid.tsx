"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { getRandomPlaceholderImage } from "@/lib/placeholder-image";

/** 페이지당 뉴스 카드 개수 */
export const NEWS_CARDS_PER_PAGE = 15;

/** 그리드에 표시할 뉴스 카드 데이터 */
export type NewsCardGridItem = {
  id: string;
  headline: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  author?: {
    name: string | null;
    avatar_url: string | null;
  };
};

interface NewsCardGridProps {
  newsItems: NewsCardGridItem[];
  /** false면 목업 등 상세 이동 없음 */
  enableDetailLink?: boolean;
}

/** 카드 하단 작성일 포맷 (yyyy.mm.dd) */
function formatNewsCardDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "날짜 불명";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error("날짜 포맷팅 오류:", error);
    return "날짜 불명";
  }
}

/** 본문에서 첫 번째 이미지 URL 추출 */
function getFirstImageFromContent(content: string | null): string | null {
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
    // HTML 파싱 실패 시 무시
  }

  return null;
}

/**
 * /news 메인 그리드 — 페이지당 15개 카드, 이전/다음 페이지네이션
 */
export function NewsCardGrid({
  newsItems,
  enableDetailLink = true,
}: NewsCardGridProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(newsItems.length / NEWS_CARDS_PER_PAGE));

  // 탭·필터 변경 등 목록이 바뀌면 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [newsItems]);

  // 삭제 등으로 총 페이지가 줄어든 경우 현재 페이지 보정
  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const displayedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * NEWS_CARDS_PER_PAGE;
    return newsItems.slice(startIndex, startIndex + NEWS_CARDS_PER_PAGE);
  }, [newsItems, currentPage]);

  const goToPreviousPage = () => {
    setCurrentPage((previousPage) => Math.max(1, previousPage - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedNews.map((news) => {
          const thumbnailImage =
            getFirstImageFromContent(news.content) ||
            news.image_url ||
            getRandomPlaceholderImage(news.id, 400, 300);

          return (
            <Card
              key={news.id}
              className={`overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full ${
                enableDetailLink ? "cursor-pointer" : ""
              }`}
              onClick={
                enableDetailLink
                  ? () => router.push(`/news/${news.id}`)
                  : undefined
              }
            >
              <div className="relative w-full aspect-4/3 overflow-hidden bg-muted">
                <img
                  src={thumbnailImage}
                  alt={news.headline}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(event) => {
                    const target = event.target as HTMLImageElement;
                    if (!target.src.includes("picsum.photos")) {
                      target.src = getRandomPlaceholderImage(news.id, 400, 300);
                    }
                  }}
                />
              </div>

              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="text-base font-semibold mb-3 line-clamp-2 text-foreground leading-snug">
                  {news.headline}
                </h3>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {news.author?.avatar_url ? (
                      <img
                        src={news.author.avatar_url}
                        alt={news.author.name || "기자"}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                        onError={(event) => {
                          const target = event.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {news.author?.name?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {news.author?.name || "익명"} 기자
                    </span>
                  </div>
                  <time
                    className="text-xs text-muted-foreground shrink-0 tabular-nums"
                    dateTime={news.created_at}
                  >
                    {formatNewsCardDate(news.created_at)}
                  </time>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {newsItems.length > 0 && (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="뉴스 목록 페이지네이션"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums min-w-16 text-center">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
