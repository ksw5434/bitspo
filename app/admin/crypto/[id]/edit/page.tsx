"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CryptoEditForm,
  type AdminCryptoNewsItem,
} from "../../_components/crypto-edit-form";

export default function AdminCryptoEditPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  const [news, setNews] = useState<AdminCryptoNewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!newsId) {
      setLoading(false);
      setError("유효하지 않은 ID입니다.");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const newsRes = await fetch(`/news/api/${newsId}`);
        const newsJson = await newsRes.json();

        if (!newsRes.ok) {
          throw new Error(newsJson.error ?? "글을 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setNews(newsJson.data);
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
    router.push("/admin/crypto");
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
          {error ?? "글을 찾을 수 없습니다."}
        </div>
        <Link href="/admin/crypto" className="text-sm text-primary hover:underline">
          ← 목록으로
        </Link>
      </div>
    );
  }

  return <CryptoEditForm news={news} onSave={handleSave} onError={setError} />;
}
