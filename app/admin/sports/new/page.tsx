"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SportsCategoryRecord } from "@/lib/sports-categories";
import { SportsEditForm } from "../_components/sports-edit-form";

export default function AdminSportsNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [defaultSportsCategoryId, setDefaultSportsCategoryId] = useState<
    string | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!categorySlug) return;

        const res = await fetch("/api/admin/sports/categories");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "카테고리 로드 실패");

        const categories = (json.data ?? []) as SportsCategoryRecord[];
        const matched = categories.find((cat) => cat.slug === categorySlug);
        if (!cancelled && matched) {
          setDefaultSportsCategoryId(matched.id);
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
  }, [categorySlug]);

  const handleSave = () => {
    const returnUrl = categorySlug
      ? `/admin/sports?category=${encodeURIComponent(categorySlug)}`
      : "/admin/sports";
    router.push(returnUrl);
    router.refresh();
  };

  if (loading && categorySlug) {
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
      <SportsEditForm
        news={null}
        defaultSportsCategoryId={defaultSportsCategoryId}
        onSave={handleSave}
        onError={setError}
      />
    </div>
  );
}
