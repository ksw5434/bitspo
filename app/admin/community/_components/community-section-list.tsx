"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  COMMUNITY_SECTION_LABELS,
  type CommunitySection,
} from "@/lib/community-sections";

const POSTS_PER_PAGE = 20;

type CommunityRow = {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
  comment_count?: number | null;
  like_count?: number | null;
  views?: number | null;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: POSTS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadRows = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        section,
        page: String(page),
        limit: String(POSTS_PER_PAGE),
      });
      const res = await fetch(`/api/admin/community/posts?${query.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "목록 로드 실패");
      }

      setRows(json.data ?? []);
      setPagination(
        json.pagination ?? {
          page,
          limit: POSTS_PER_PAGE,
          total: (json.data ?? []).length,
          totalPages: 1,
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 로드 실패");
      setRows([]);
      setPagination({
        page: 1,
        limit: POSTS_PER_PAGE,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void loadRows(currentPage);
  }, [loadRows, currentPage]);

  // 페이지가 바뀌면 선택 상태 초기화
  useEffect(() => {
    setSelectedPostIds(new Set());
  }, [currentPage, section]);

  const currentPageRowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  const isAllOnPageSelected =
    currentPageRowIds.length > 0 &&
    currentPageRowIds.every((id) => selectedPostIds.has(id));

  const isSomeOnPageSelected =
    currentPageRowIds.some((id) => selectedPostIds.has(id)) && !isAllOnPageSelected;

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        currentPageRowIds.forEach((id) => next.add(id));
      } else {
        currentPageRowIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const toggleRowSelection = (postId: string, checked: boolean) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  };

  const reloadAfterDelete = async (deletedCount: number) => {
    const remainingOnPage = rows.length - deletedCount;
    const shouldGoToPreviousPage =
      remainingOnPage <= 0 && currentPage > 1 && pagination.totalPages > 0;

    if (shouldGoToPreviousPage) {
      setCurrentPage((page) => page - 1);
      return;
    }

    await loadRows(currentPage);
  };

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

      setSelectedPostIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      await reloadAfterDelete(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = [...selectedPostIds];
    if (idsToDelete.length === 0) return;

    if (!confirm(`선택한 ${idsToDelete.length}개의 글을 삭제할까요?`)) return;

    setIsBulkDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/community/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "일괄 삭제 실패");
      }

      const deletedCount = json.deletedCount ?? idsToDelete.length;
      setSelectedPostIds(new Set());
      await reloadAfterDelete(deletedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 삭제 실패");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const sectionLabel = COMMUNITY_SECTION_LABELS[section];
  const selectedCount = selectedPostIds.size;
  const { total, totalPages } = pagination;
  const showPagination = !loading && total > 0;

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

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2">
          <p className="text-sm text-muted-foreground">{selectedCount}개 선택됨</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={isBulkDeleting}
            onClick={() => void handleBulkDelete()}
          >
            <Trash2 className="mr-1 size-4" aria-hidden />
            선택 삭제
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 글이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-border rounded-lg border border-border">
            <li className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
              <Checkbox
                checked={
                  isAllOnPageSelected
                    ? true
                    : isSomeOnPageSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(checked) =>
                  toggleSelectAllOnPage(checked === true)
                }
                aria-label="현재 페이지 전체 선택"
              />
              <span className="text-xs font-medium text-muted-foreground">
                전체 선택
              </span>
            </li>
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <Checkbox
                  checked={selectedPostIds.has(row.id)}
                  onCheckedChange={(checked) =>
                    toggleRowSelection(row.id, checked === true)
                  }
                  aria-label={`"${row.title}" 선택`}
                  disabled={isBulkDeleting || deletingId === row.id}
                />
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
                    disabled={deletingId === row.id || isBulkDeleting}
                    onClick={() => void handleDelete(row)}
                  >
                    <Trash2 className="size-4 text-destructive" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {showPagination && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                총 {total.toLocaleString("ko-KR")}건 · {currentPage} /{" "}
                {totalPages}페이지
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft className="mr-1 size-4" aria-hidden />
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  다음
                  <ChevronRight className="ml-1 size-4" aria-hidden />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
