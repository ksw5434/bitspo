"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  COMMUNITY_SECTION_LABELS,
  type CommunitySection,
} from "@/lib/community-sections";

type CommunityRow = {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
  comment_count?: number | null;
  like_count?: number | null;
  views?: number | null;
};

type CommunitySectionListProps = {
  section: CommunitySection;
  /** forum | discussion — 새 글 작성 링크 표시 */
  allowAdminCreate?: boolean;
};

export function CommunitySectionList({
  section,
  allowAdminCreate = false,
}: CommunitySectionListProps) {
  const basePath = `/admin/community/${section}`;
  const [rows, setRows] = useState<CommunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/community/posts?section=${encodeURIComponent(section)}`,
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "목록 로드 실패");
      }

      setRows(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 로드 실패");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleDelete = async (row: CommunityRow) => {
    if (!confirm(`"${row.title}" 글을 삭제할까요?`)) return;

    setDeletingId(row.id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/community/posts/${row.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "삭제 실패");
      }

      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const sectionLabel = COMMUNITY_SECTION_LABELS[section];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Community · {sectionLabel}</h1>
          <p className="text-sm text-muted-foreground">
            {section === "guestbook"
              ? "회원이 작성한 방명록을 관리합니다."
              : "관리자가 작성한 글입니다. 회원은 공개 페이지에서 댓글을 달 수 있습니다."}
          </p>
        </div>
        <div className="flex gap-2">
          {allowAdminCreate && (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="mr-1 size-4" aria-hidden />
                새 글
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 글이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  {row.category ? `${row.category} · ` : ""}
                  {new Date(row.created_at).toLocaleString("ko-KR")}
                  {typeof row.comment_count === "number" &&
                    ` · 댓글 ${row.comment_count}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" asChild title="공개 보기">
                  <Link
                    href={`/community/${row.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                  </Link>
                </Button>
                {allowAdminCreate && (
                  <Button variant="ghost" size="icon" asChild title="수정">
                    <Link href={`${basePath}/${row.id}/edit`}>
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title="삭제"
                  disabled={deletingId === row.id}
                  onClick={() => void handleDelete(row)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
