"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 기본 placeholder 이미지 URL (안정적인 서비스 사용)
const DEFAULT_PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/800x600?text=No+Image";
const DEFAULT_PLACEHOLDER_IMAGE_SMALL =
  "https://via.placeholder.com/400x300?text=No+Image";

// 뉴스 아이템 타입 정의
type NewsItem = {
  id?: string; // 뉴스 ID (Supabase에서 가져온 경우 포함)
  image: string;
  headline: string;
  timestamp: string;
};

// 뉴스 그룹 타입 (3개씩 묶인 그룹)
type NewsGroup = NewsItem[];

interface NewsCarouselProps {
  newsGroups: NewsGroup[];
}

export function NewsCarousel({ newsGroups }: NewsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 자동 슬라이드 타이머를 저장하기 위한 ref
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 자동 슬라이드 시작 함수
  const startAutoplay = useCallback(() => {
    // 기존 타이머가 있으면 정리
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }

    // 5초마다 다음 슬라이드로 이동
    autoplayTimerRef.current = setInterval(() => {
      if (!emblaApi) return;

      // 다음 슬라이드로 이동 가능한 경우에만 이동
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        // 마지막 슬라이드에 도달하면 처음으로 돌아감
        emblaApi.scrollTo(0);
      }
    }, 5000); // 5초마다 실행
  }, [emblaApi]);

  // 자동 슬라이드 정지 함수
  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  // 이전/다음 버튼 상태 업데이트
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());

    // 사용자가 슬라이드를 조작할 때 자동 슬라이드 타이머 리셋
    stopAutoplay();
    startAutoplay();
  }, [emblaApi, startAutoplay, stopAutoplay]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // 자동 슬라이드 시작
    startAutoplay();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      stopAutoplay();
    };
  }, [emblaApi, onSelect, startAutoplay, stopAutoplay]);

  // 이전 슬라이드로 이동
  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      // 수동 조작 시 자동 슬라이드 타이머 리셋
      stopAutoplay();
      startAutoplay();
    }
  }, [emblaApi, startAutoplay, stopAutoplay]);

  // 다음 슬라이드로 이동
  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      // 수동 조작 시 자동 슬라이드 타이머 리셋
      stopAutoplay();
      startAutoplay();
    }
  }, [emblaApi, startAutoplay, stopAutoplay]);

  return (
    <div className="relative h-full flex flex-col">
      {/* 슬라이더 컨테이너 */}
      <div className="overflow-hidden flex-1" ref={emblaRef}>
        <div className="flex">
          {newsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex-[0_0_100%] min-w-0">
              <div className="space-y-4">
                {/* 첫 번째 기사: 큰 이미지 */}
                {group[0] && (
                  <Link
                    href={group[0].id ? `/news/${group[0].id}` : "#"}
                    className="block"
                  >
                    <Card className="overflow-hidden py-0 relative group cursor-pointer hover:shadow-lg transition-shadow">
                      <div className="relative h-80">
                        {/* 배경 이미지 */}
                        <img
                          src={group[0].image}
                          alt={group[0].headline}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            // 이미지 로드 실패 시 대체 이미지로 변경 (무한 루프 방지)
                            const target = e.target as HTMLImageElement;
                            // 이미 대체 이미지인 경우 더 이상 변경하지 않음
                            if (!target.src.includes("placeholder.com")) {
                              target.src = DEFAULT_PLACEHOLDER_IMAGE;
                            }
                          }}
                        />
                        {/* 반투명 오버레이 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        {/* 블러 배경 레이어 */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-28 z-0"
                          style={{
                            background: "rgba(0, 0, 0, 0.4)",
                            backdropFilter: "blur(4px)",
                            WebkitBackdropFilter: "blur(4px)", // Safari 지원
                          }}
                        />
                        {/* 헤드라인과 타임스탬프 - 블러 위에 선명하게 표시 */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                          <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                            {group[0].headline}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {group[0].timestamp}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                {/* 두 번째, 세 번째 기사: 작은 이미지 가로 배치 */}
                {group.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.slice(1).map((news, index) => (
                      <Link
                        key={index + 1}
                        href={news.id ? `/news/${news.id}` : "#"}
                        className="block"
                      >
                        <Card className="overflow-hidden py-0 group cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <div className="flex flex-col">
                              {/* 썸네일 이미지 */}
                              <div className="relative h-40 overflow-hidden">
                                <img
                                  src={news.image}
                                  alt={news.headline}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                  onError={(e) => {
                                    // 이미지 로드 실패 시 대체 이미지로 변경 (무한 루프 방지)
                                    const target = e.target as HTMLImageElement;
                                    // 이미 대체 이미지인 경우 더 이상 변경하지 않음
                                    if (
                                      !target.src.includes("placeholder.com")
                                    ) {
                                      target.src =
                                        DEFAULT_PLACEHOLDER_IMAGE_SMALL;
                                    }
                                  }}
                                />
                              </div>
                              {/* 헤드라인, 타임스탬프 */}
                              <div className="p-4">
                                <h4 className="text-base font-semibold line-clamp-2 mb-2">
                                  {news.headline}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {news.timestamp}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between mt-2 px-4 relative">
        {/* 이전 버튼 */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
          className={cn(
            "rounded-full relative z-10",
            !prevBtnEnabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="이전 슬라이드"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 슬라이드 인디케이터 */}
        <div className="flex items-center gap-2 relative z-10">
          {newsGroups.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                emblaApi?.scrollTo(index);
                // 인디케이터 클릭 시 자동 슬라이드 타이머 리셋
                stopAutoplay();
                startAutoplay();
              }}
              className={cn(
                "h-2 rounded-full transition-all",
                index === selectedIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-muted/80"
              )}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>

        {/* 다음 버튼 */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
          className={cn(
            "rounded-full relative z-10",
            !nextBtnEnabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="다음 슬라이드"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
