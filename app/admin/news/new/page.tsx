"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { NewsCategoryRecord } from "@/lib/news-categories";
import { NewsEditForm } from "../_components/news-edit-form";

export default function AdminNewsNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [categories, setCategories] = useState<NewsCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/news/categories");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "카테고리 로드 실패");
        if (!cancelled) setCategories(json.data ?? []);
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
  }, []);

  const defaultCategoryId = categorySlug
    ? categories.find((cat) => cat.slug === categorySlug)?.id
    : undefined;

  const handleSave = () => {
    const returnUrl = categorySlug
      ? `/admin/news?category=${encodeURIComponent(categorySlug)}`
      : "/admin/news";
    router.push(returnUrl);
    router.refresh();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <NewsEditForm
        news={null}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        onSave={handleSave}
        onError={setError}
      />
    </div>
  );
}
