"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { isBetNewsItem } from "@/lib/news-filters";
import {
  newsHasBetCategory,
  normalizeBetCategory,
  type BetCategoryRecord,
} from "@/lib/bet-categories";
import type { AdminBetNewsItem } from "./_components/bet-edit-form";

export default function AdminBetListPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [newsList, setNewsList] = useState<AdminBetNewsItem[]>([]);
  const [categories, setCategories] = useState<BetCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCategory = useMemo(
    () => categories.find((cat) => cat.slug === categorySlug),
    [categories, categorySlug],
  );

  const betNewsList = useMemo(
    () =>
      newsList.filter((news) =>
        isBetNewsItem(news as Parameters<typeof isBetNewsItem>[0]),
      ),
    [newsList],
  );

  const filteredNews = useMemo(() => {
    if (!activeCategory) return betNewsList;
    return betNewsList.filter((news) =>
      newsHasBetCategory(news, activeCategory.id),
    );
  }, [betNewsList, activeCategory]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [categoriesRes, newsRes] = await Promise.all([
        fetch("/api/admin/bet/categories"),
        supabase
          .from("news")
          .select(
            `
            id,
            headline,
            content,
            image_url,
            created_at,
            publish_to_bet,
            author_id,
            updated_at,
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
          .order("created_at", { ascending: false }),
      ]);

      const categoriesJson = await categoriesRes.json();
      if (!categoriesRes.ok) {
        throw new Error(categoriesJson.error ?? "카테고리 로드 실패");
      }

      setCategories(
        (categoriesJson.data ?? []).map((row: BetCategoryRecord) =>
          normalizeBetCategory(row),
        ),
      );

      if (newsRes.error) {
        throw new Error(newsRes.error.message);
      }

      setNewsList((newsRes.data ?? []) as unknown as AdminBetNewsItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDelete = async (news: AdminBetNewsItem) => {
    if (!confirm(`"${news.headline}" 글을 삭제할까요?`)) return;

    setDeletingId(news.id);
    setError(null);

    try {
      const res = await fetch(`/news/api/${news.id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "삭제 실패");
      }

      setNewsList((prev) => prev.filter((item) => item.id !== news.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const newPostHref = activeCategory
    ? `/admin/bet/new?category=${encodeURIComponent(activeCategory.slug)}`
    : "/admin/bet/new";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {activeCategory ? `${activeCategory.name} · ` : "전체 · "}
          {filteredNews.length}건
        </p>
        <Button asChild>
          <Link href={newPostHref}>
            <Plus className="size-4" />
            새 글 작성
          </Link>
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">
                  작성일
                </th>
                <th className="px-4 py-3 font-medium w-36">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : filteredNews.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    등록된 글이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredNews.map((news) => (
                  <tr
                    key={news.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{news.headline}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {news.created_at
                        ? new Date(news.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/bet/${news.id}/edit`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Pencil className="size-3.5" />
                          수정
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(news)}
                          disabled={deletingId === news.id}
                          className="inline-flex items-center gap-1 text-destructive hover:underline disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <a
                          href={`/news/${news.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="미리보기"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
