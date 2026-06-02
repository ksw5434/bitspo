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
import { ScoresSection } from "@/app/_components/scores-section";
import { getRandomPlaceholderImage } from "@/lib/placeholder-image";
import {
  formatNewsRelativeTime,
  getFirstImageFromNewsContent,
  isSportsNewsItem,
  type NewsWithCategories,
} from "@/lib/news-filters";
import {
  newsHasSportsCategory,
  type SportsCategoryRecord,
} from "@/lib/sports-categories";
import {
  FALLBACK_SPORTS_CATEGORIES,
  resolveActiveSportsCategorySlug,
} from "@/lib/sports-tabs";

/** 카테고리 slug 기준 필터 */
function filterNewsBySportsCategory(
  sportsNewsList: NewsWithCategories[],
  categorySlug: string,
  categories: Pick<SportsCategoryRecord, "id" | "slug" | "name">[],
): NewsWithCategories[] {
  const matchedCategory = categories.find((cat) => cat.slug === categorySlug);
  if (!matchedCategory) {
    return sportsNewsList;
  }

  const filtered = sportsNewsList.filter((news) =>
    newsHasSportsCategory(news, matchedCategory.id),
  );

  return filtered.length > 0 ? filtered : sportsNewsList;
}

export function SportsPageContent() {
  const searchParams = useSearchParams();

  const [newsList, setNewsList] = useState<NewsWithCategories[]>([]);
  const [sportsCategories, setSportsCategories] = useState<
    Pick<SportsCategoryRecord, "id" | "name" | "slug">[]
  >(FALLBACK_SPORTS_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  const activeCategorySlug = resolveActiveSportsCategorySlug(
    searchParams.get("category"),
    searchParams.get("tab"),
    sportsCategories,
  );

  const activeCategoryName =
    sportsCategories.find((cat) => cat.slug === activeCategorySlug)?.name ??
    "Sports";

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const loadSportsCategories = async () => {
      try {
        const res = await fetch("/api/sports/categories");
        const json = await res.json();
        if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
          setSportsCategories(json.data);
        }
      } catch {
        // 기본 탭 유지
      }
    };

    void loadSportsCategories();
  }, []);

  useEffect(() => {
    const loadSportsNews = async () => {
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
            news_sports_categories (
              sports_category_id,
              sports_categories ( id, name, slug )
            )
          `,
          )
          .order("created_at", { ascending: false });

        if (newsError) {
          console.error("스포츠 뉴스 로드 오류:", newsError);
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
        console.error("스포츠 뉴스 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSportsNews();
  }, [supabase]);

  const sportsNewsList = useMemo(
    () => newsList.filter(isSportsNewsItem),
    [newsList],
  );

  const displayedNewsList = useMemo(
    () =>
      filterNewsBySportsCategory(
        sportsNewsList,
        activeCategorySlug,
        sportsCategories,
      ),
    [sportsNewsList, activeCategorySlug, sportsCategories],
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <section className="space-y-10 lg:col-span-7">
          {displayedNewsList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  표시할 {activeCategoryName} 뉴스가 없습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <NewsCardGrid newsItems={displayedNewsList} />
          )}
        </section>

        <aside className="space-y-4 lg:col-span-3 lg:sticky lg:top-[calc(var(--sports-tabs-height,2.5rem)+0.75rem)] lg:self-start">
          <NewsSection newsItems={topNewsItems} showPagination={false} />
        </aside>
      </div>

      <ScoresSection className="w-full" />
    </main>
  );
}
