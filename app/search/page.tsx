"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "../_components/ui/card";

interface SearchNewsResult {
  id: string;
  headline: string;
  created_at: string;
}

interface SearchCommunityResult {
  id: string;
  title: string;
  created_at: string;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKeyword = (searchParams.get("q") ?? "").trim();

  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const [newsResults, setNewsResults] = useState<SearchNewsResult[]>([]);
  const [communityResults, setCommunityResults] = useState<SearchCommunityResult[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    if (!searchKeyword) {
      setNewsResults([]);
      setCommunityResults([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    const runSearch = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const likePattern = `%${searchKeyword}%`;

        const [newsResponse, communityResponse] = await Promise.all([
          supabase
            .from("news")
            .select("id, headline, created_at")
            .ilike("headline", likePattern)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("communities")
            .select("id, title, created_at")
            .ilike("title", likePattern)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (newsResponse.error) {
          throw newsResponse.error;
        }
        if (communityResponse.error) {
          throw communityResponse.error;
        }

        setNewsResults(newsResponse.data ?? []);
        setCommunityResults(communityResponse.data ?? []);
      } catch (error) {
        console.error("검색 오류:", error);
        setLoadError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        setNewsResults([]);
        setCommunityResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    runSearch();
  }, [supabase, searchKeyword]);

  const totalResultCount = newsResults.length + communityResults.length;

  return (
    <main className="container mx-auto px-2 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">검색</h1>
        {searchKeyword ? (
          <p className="mt-2 text-muted-foreground">
            &quot;{searchKeyword}&quot; 검색 결과{" "}
            {isLoading ? "불러오는 중..." : `${totalResultCount}건`}
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            헤더 검색창에 키워드를 입력해주세요.
          </p>
        )}
      </div>

      {loadError && (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      )}

      {searchKeyword && !isLoading && totalResultCount === 0 && !loadError && (
        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
      )}

      {newsResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">News</h2>
          <div className="space-y-2">
            {newsResults.map((news) => (
              <Link key={news.id} href={`/news/${news.id}`} className="block cursor-pointer">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="py-3">
                    <p className="font-medium">{news.headline}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {communityResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Community</h2>
          <div className="space-y-2">
            {communityResults.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`} className="block cursor-pointer">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="py-3">
                    <p className="font-medium">{post.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!searchKeyword && (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          홈으로 돌아가기
        </button>
      )}
    </main>
  );
}

/**
 * 통합 검색 결과 페이지
 * 헤더 검색창에서 ?q= 쿼리로 진입
 */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-2 py-8">
          <p className="text-muted-foreground">검색 페이지를 불러오는 중...</p>
        </main>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
