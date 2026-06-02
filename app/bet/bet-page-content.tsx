"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/app/_components/ui/card";
import {
  NewsSection,
  type RankingNewsItem,
} from "@/app/_components/news-section";
import { NewsCardGrid } from "@/app/_components/news-card-grid";
import { BettingSitesBoard } from "@/app/_components/betting-sites-board";
import { getRandomPlaceholderImage } from "@/lib/placeholder-image";
import {
  formatNewsRelativeTime,
  getFirstImageFromNewsContent,
  isBetNewsItem,
  type NewsWithCategories,
} from "@/lib/news-filters";
import { newsHasBetCategory, type BetCategoryRecord } from "@/lib/bet-categories";
import {
  FALLBACK_BET_CATEGORIES,
  resolveActiveBetCategorySlug,
} from "@/lib/bet-tabs";

/** 카테고리 slug 기준 필터 */
function filterNewsByBetCategory(
  betNewsList: NewsWithCategories[],
  categorySlug: string,
  categories: Pick<BetCategoryRecord, "id" | "slug" | "name">[],
): NewsWithCategories[] {
  const matchedCategory = categories.find((cat) => cat.slug === categorySlug);
  if (!matchedCategory) {
    return betNewsList;
  }

  const filtered = betNewsList.filter((news) =>
    newsHasBetCategory(news, matchedCategory.id),
  );

  return filtered.length > 0 ? filtered : betNewsList;
}

/**
 * /bet 페이지 — DB 뉴스 + Betting Sites 보드 (7:3 레이아웃)
 */
export function BetPageContent() {
  const searchParams = useSearchParams();

  const [newsList, setNewsList] = useState<NewsWithCategories[]>([]);
  const [betCategories, setBetCategories] = useState<
    Pick<BetCategoryRecord, "id" | "name" | "slug">[]
  >(FALLBACK_BET_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  const activeCategorySlug = resolveActiveBetCategorySlug(
    searchParams.get("category"),
    searchParams.get("tab"),
    betCategories,
  );

  const activeCategoryName =
    betCategories.find((cat) => cat.slug === activeCategorySlug)?.name ?? "Bet";

  const showBettingSitesBoard = activeCategorySlug === "betting-sites";

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const loadBetCategories = async () => {
      try {
        const res = await fetch("/api/bet/categories");
        const json = await res.json();
        if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
          setBetCategories(json.data);
        }
      } catch {
        // 기본 탭 유지
      }
    };

    void loadBetCategories();
  }, []);

  useEffect(() => {
    const loadBetNews = async () => {
      try {
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select(
            `
            *,
            news_categories (
              category_id,
              categories ( id, name )
            ),
            news_bet_categories (
              bet_category_id,
              bet_categories ( id, name, slug )
            )
          `,
          )
          .order("created_at", { ascending: false });

        if (newsError) {
          console.error("Bet 뉴스 로드 오류:", newsError);
          return;
        }

        const authorIds = [
          ...new Set(
            (newsData ?? [])
              .map((news) => news.author_id)
              .filter((id): id is string => id !== null),
          ),
        ];

        const authorMap = new Map<
          string,
          { id: string; name: string | null; avatar_url: string | null }
        >();

        if (authorIds.length > 0) {
          const { data: authorData } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .in("id", authorIds);

          authorData?.forEach((author) => {
            authorMap.set(author.id, author);
          });
        }

        const newsWithAuthors = (newsData ?? []).map((news) => ({
          ...news,
          author: news.author_id ? authorMap.get(news.author_id) : undefined,
        }));

        setNewsList(newsWithAuthors);
      } catch (error) {
        console.error("Bet 뉴스 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBetNews();
  }, [supabase]);

  const betNewsList = useMemo(() => newsList.filter(isBetNewsItem), [newsList]);

  const displayedNewsList = useMemo(
    () =>
      filterNewsByBetCategory(betNewsList, activeCategorySlug, betCategories),
    [betNewsList, activeCategorySlug, betCategories],
  );

  const topNewsItems = useMemo<RankingNewsItem[]>(
    () =>
      displayedNewsList.slice(0, 5).map((news, index) => ({
        rank: index + 1,
        image:
          getFirstImageFromNewsContent(news.content) ||
          news.image_url ||
          getRandomPlaceholderImage(news.id, 200, 200),
        headline: news.headline,
        timestamp: formatNewsRelativeTime(news.created_at),
        href: `/news/${news.id}`,
      })),
    [displayedNewsList],
  );

  if (isLoading) {
    return (
      <main className="container mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto w-full max-w-7xl px-4 py-8 space-y-10">
      {showBettingSitesBoard && <BettingSitesBoard className="w-full" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <section className="lg:col-span-7">
          {displayedNewsList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  표시할 {activeCategoryName} 글이 없습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <NewsCardGrid newsItems={displayedNewsList} />
          )}
        </section>

        <aside className="lg:col-span-3 lg:sticky lg:top-[calc(var(--bet-tabs-height,2.5rem)+0.75rem)] lg:self-start">
          <NewsSection newsItems={topNewsItems} showPagination={false} />
        </aside>
      </div>
    </main>
  );
}
