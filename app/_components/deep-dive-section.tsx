"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 기본 placeholder 이미지 URL (안정적인 서비스 사용)
const DEFAULT_PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x300?text=No+Image";

// 딥다이브 뉴스 아이템 타입 정의
type DeepDiveNewsItem = {
  image: string;
  headline: string;
  tags: string[];
  timestamp: string;
};

interface DeepDiveSectionProps {
  newsItems: DeepDiveNewsItem[];
}

export function DeepDiveSection({ newsItems }: DeepDiveSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    skipSnaps: false,
    dragFree: false, // 스냅 포인트에 맞춰 이동하도록 변경
    containScroll: "trimSnaps",
    slidesToScroll: 1, // 한 번에 1개의 카드만 이동
  });

  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);

  // 스크롤 가능 여부 업데이트
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollNext(emblaApi.canScrollNext());
    setCanScrollPrev(emblaApi.canScrollPrev());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("resize", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("resize", onSelect);
    };
  }, [emblaApi, onSelect]);

  // newsItems가 변경되면 Embla를 다시 초기화
  useEffect(() => {
    if (emblaApi && newsItems.length > 0) {
      emblaApi.reInit();
    }
  }, [emblaApi, newsItems.length]);

  // 이전 슬라이드로 이동
  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
    }
  }, [emblaApi]);

  // 다음 슬라이드로 이동
  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
    }
  }, [emblaApi]);

  return (
    <div className="bg-card py-8 rounded-lg overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex gap-8 items-start">
          {/* 왼쪽 헤더 섹션 */}
          <div className="flex-shrink-0 w-80">
            <div className="space-y-2 text-white">
              <h3 className=" font-medium text-muted-foreground">
                Only 비스트포
              </h3>
              <h2 className="text-2xl font-bold  leading-tight">
                크립토 전문기자의 <br />
                딥다이브를 모았어요!
              </h2>
            </div>
          </div>

          {/* 오른쪽 수평 스크롤 뉴스 카드 섹션 */}
          <div className="flex-1 relative min-w-0">
            {/* Embla Carousel 컨테이너 */}
            <div className="overflow-hidden px-12" ref={emblaRef}>
              {/* Embla Carousel 슬라이드 컨테이너 */}
              <div className="flex gap-5">
                {newsItems.map((news, index) => (
                  <div
                    key={index}
                    className="flex-[0_0_auto] w-48 h-68 relative group rounded-xl overflow-hidden"
                  >
                    {/* 이미지 */}
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={news.image}
                        alt={news.headline}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // 이미지 로드 실패 시 대체 이미지로 변경 (무한 루프 방지)
                          const target = e.target as HTMLImageElement;
                          // 이미 대체 이미지인 경우 더 이상 변경하지 않음
                          if (!target.src.includes('placeholder.com')) {
                            target.src = DEFAULT_PLACEHOLDER_IMAGE;
                          }
                        }}
                      />
                    </div>
                    {/* 헤드라인 */}
                    <div className="p-4 bg-card/50 backdrop-blur-sm absolute bottom-0 left-0 right-0 h-1/2 rounded-xl">
                      <h4 className="text-base font-semibold line-clamp-2 mb-2 text-foreground">
                        {news.headline}
                      </h4>
                      {/* 타임스탬프 */}
                      <span className="text-xs text-foreground whitespace-nowrap flex justify-end mb-2">
                        {news.timestamp}
                      </span>
                      {/* 태그와 타임스탬프 */}
                      <div className="flex items-center justify-between">
                        {/* 태그들 */}
                        <div className="flex gap-1 flex-wrap">
                          {news.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 네비게이션 버튼 컨테이너 */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* 이전 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className={cn(
                  "absolute left-7 top-1/2 -translate-y-1/2 rounded-full bg-gray-700 shadow-md hover:bg-gray-800",
                  "h-10 w-10 cursor-pointer pointer-events-auto",
                  !canScrollPrev && "opacity-50 cursor-not-allowed"
                )}
                aria-label="이전 슬라이드"
              >
                <ChevronLeft className="size-5 text-white" />
              </Button>
              {/* 다음 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-gray-700 shadow-md hover:bg-gray-800",
                  "h-10 w-10 cursor-pointer pointer-events-auto",
                  !canScrollNext && "opacity-50 cursor-not-allowed"
                )}
                aria-label="다음 슬라이드"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
