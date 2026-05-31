"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  BETTING_SITES_PER_PAGE,
  MOCK_BETTING_SITES,
  type BettingSiteItem,
} from "@/lib/betting-sites-mock";

interface BettingSitesBoardProps {
  /** 목록 데이터 (기본: 목업 20건) */
  sites?: BettingSiteItem[];
  className?: string;
}

/**
 * Betting Sites 게시판 목록 (목업)
 * 왼쪽 썸네일 · 중앙 2줄 텍스트 · 오른쪽 GO 버튼
 */
export function BettingSitesBoard({
  sites = MOCK_BETTING_SITES,
  className = "",
}: BettingSitesBoardProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sites.length / BETTING_SITES_PER_PAGE));

  // 목록 길이 변경 시 현재 페이지 보정
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const displayedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * BETTING_SITES_PER_PAGE;
    return sites.slice(startIndex, startIndex + BETTING_SITES_PER_PAGE);
  }, [sites, currentPage]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  return (
    <div className={`w-full space-y-6 ${className}`.trim()}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">Betting Sites</h2>
        <span className="text-xs text-muted-foreground">목업 데이터</span>
      </div>

      <ul className="w-full divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
        {displayedSites.map((site) => (
          <li key={site.id}>
            <article className="flex w-full items-center gap-4 p-4 sm:gap-6 sm:p-5">
              {/* 왼쪽: 사이트 로고 placeholder */}
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-sm bg-red-600 text-sm font-bold text-white sm:size-20"
                aria-hidden
              >
                {site.logoLabel}
              </div>

              {/* 중앙: 사이트명 + 프로모션 (2줄) */}
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate text-base font-bold uppercase tracking-wide sm:text-lg">
                  {site.name}
                </h3>
                <p className="line-clamp-2 text-sm font-semibold uppercase leading-snug text-foreground/90 sm:text-base">
                  {site.promoText}
                </p>
              </div>

              {/* 오른쪽: GO 바로가기 */}
              <a
                href={site.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer sm:size-16"
                aria-label={`${site.name} 바로가기`}
              >
                GO
              </a>
            </article>
          </li>
        ))}
      </ul>

      {sites.length > 0 && (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="베팅 사이트 목록 페이지네이션"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center text-sm tabular-nums text-muted-foreground">
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
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
