"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { NewsCategoryRecord } from "@/lib/news-categories";
import {
  NewsEditForm,
  type AdminNewsItem,
} from "../../_components/news-edit-form";

export default function AdminNewsEditPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  const [news, setNews] = useState<AdminNewsItem | null>(null);
  const [categories, setCategories] = useState<NewsCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!newsId) {
      setLoading(false);
      setError("유효하지 않은 뉴스 ID입니다.");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [newsRes, categoriesRes] = await Promise.all([
          fetch(`/news/api/${newsId}`),
          fetch("/api/admin/news/categories"),
        ]);

        const newsJson = await newsRes.json();
        const categoriesJson = await categoriesRes.json();

        if (!newsRes.ok) {
          throw new Error(newsJson.error ?? "뉴스를 불러오지 못했습니다.");
        }
        if (!categoriesRes.ok) {
          throw new Error(categoriesJson.error ?? "카테고리 로드 실패");
        }

        if (!cancelled) {
          setNews(newsJson.data);
          setCategories(categoriesJson.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "로드 실패");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [newsId]);

  const handleSave = () => {
    router.push("/admin/news");
    router.refresh();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (!news || error) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error ?? "뉴스를 찾을 수 없습니다."}
        </div>
        <Link href="/admin/news" className="text-sm text-primary hover:underline">
          ← 목록으로
        </Link>
      </div>
    );
  }

  return (
    <NewsEditForm
      news={news}
      categories={categories}
      onSave={handleSave}
      onError={setError}
    />
  );
}
