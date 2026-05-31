"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { NewsImage } from "../news/news-image";

export type RealtimeNewsItem = {
  id: string;
  image: string;
  headline: string;
  timestamp: string;
};

/** 한 번에 추가로 불러올 뉴스 개수 */
const ITEMS_PER_LOAD = 10;

interface RealtimeNewsListProps {
  newsItems: RealtimeNewsItem[];
  isInitialLoading: boolean;
  emptyMessage: string;
}

/**
 * Real-Time News 무한 스크롤 리스트
 * IntersectionObserver로 하단 도달 시 10개씩 추가 표시
 */
export function RealtimeNewsList({
  newsItems,
  isInitialLoading,
  emptyMessage,
}: RealtimeNewsListProps) {
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // 목록 데이터가 바뀌면 처음 10개부터 다시 표시
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_LOAD);
  }, [newsItems]);

  const displayedNews = useMemo(
    () => newsItems.slice(0, displayedCount),
    [newsItems, displayedCount],
  );

  const hasMoreNews = displayedCount < newsItems.length;

  useEffect(() => {
    const observerTarget = observerTargetRef.current;
    if (!observerTarget || !hasMoreNews || isInitialLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || isLoadingMore) {
          return;
        }

        setIsLoadingMore(true);
        setTimeout(() => {
          setDisplayedCount((previousCount) =>
            Math.min(previousCount + ITEMS_PER_LOAD, newsItems.length),
          );
          setIsLoadingMore(false);
        }, 300);
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [
    displayedCount,
    hasMoreNews,
    isInitialLoading,
    isLoadingMore,
    newsItems.length,
  ]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">뉴스를 불러오는 중...</p>
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {displayedNews.map((news) => (
          <Link key={news.id} href={`/news/${news.id}`} className="cursor-pointer">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-none shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex gap-4">
                  <div className="shrink-0 w-24 h-24 rounded overflow-hidden bg-muted">
                    <NewsImage
                      src={news.image}
                      alt={news.headline}
                      newsId={news.id}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="text-base font-semibold line-clamp-2 mb-2 text-foreground hover:text-primary transition-colors">
                      {news.headline}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {news.timestamp}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {hasMoreNews && (
        <div
          ref={observerTargetRef}
          className="flex items-center justify-center py-6 min-h-[48px]"
          aria-hidden={!isLoadingMore}
        >
          {isLoadingMore && (
            <p className="text-sm text-muted-foreground">더 불러오는 중...</p>
          )}
        </div>
      )}
    </>
  );
}
