"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Card, CardContent } from "@/app/_components/ui/card";
import {
  SortableCategoryList,
  type SortableCategoryItem,
} from "@/app/admin/_components/sortable-category-list";
import type { CryptoCategoryRecord } from "@/lib/crypto-categories";

export default function AdminCryptoCategoriesPage() {
  const [categories, setCategories] = useState<CryptoCategoryRecord[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/crypto/categories");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "로드 실패");
      setCategories(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleReorder = async (orderedItems: SortableCategoryItem[]) => {
    setIsSavingOrder(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/crypto/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordered_ids: orderedItems.map((item) => item.id),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "순서 저장 실패");
      }

      setCategories((prev) => {
        const map = new Map(prev.map((cat) => [cat.id, cat]));
        return orderedItems
          .map((item) => map.get(item.id))
          .filter((cat): cat is CryptoCategoryRecord => !!cat);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "순서 저장 실패");
      throw err;
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleAdd = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setError("카테고리 이름을 입력해주세요.");
      return;
    }

    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      setError("이미 존재하는 카테고리입니다.");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/crypto/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "추가 실패");
      }

      setNewCategoryName("");
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (category: CryptoCategoryRecord) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (categoryId: string) => {
    const name = editingName.trim();
    if (!name) {
      setError("카테고리 이름을 입력해주세요.");
      return;
    }

    const duplicate = categories.some(
      (cat) =>
        cat.id !== categoryId && cat.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setError("이미 존재하는 카테고리 이름입니다.");
      return;
    }

    setIsSavingEdit(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/crypto/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "수정 실패");
      }

      cancelEdit();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (category: CryptoCategoryRecord) => {
    if (
      !confirm(
        `"${category.name}" 카테고리를 삭제할까요?\n연결된 글에서도 제거됩니다.`,
      )
    ) {
      return;
    }

    setDeletingId(category.id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/crypto/categories/${category.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "삭제 실패");
      }

      if (editingId === category.id) cancelEdit();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const sortableItems: SortableCategoryItem[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Crypto 카테고리 관리</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/crypto">← 글 목록</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        드래그로 순서를 바꾸면 사이드바·/crypto 탭에 바로 반영됩니다.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Tag className="size-4" />
            새 카테고리 추가
          </h3>

          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="예: NBA, 농구, 축구"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAdding) void handleAdd();
              }}
              className="flex-1"
            />
            <Button
              onClick={() => void handleAdd()}
              disabled={isAdding || !newCategoryName.trim()}
            >
              {isAdding ? (
                "추가 중..."
              ) : (
                <>
                  <Plus className="size-4" />
                  추가
                </>
              )}
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">카테고리 목록</h4>
            {loading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                등록된 카테고리가 없습니다.
              </p>
            ) : (
              <SortableCategoryList
                items={sortableItems}
                editingId={editingId}
                isSavingOrder={isSavingOrder}
                onReorder={handleReorder}
                renderActions={(item) => {
                  const category = categories.find((cat) => cat.id === item.id);
                  if (!category) return null;
                  return (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(category)}
                        aria-label={`${category.name} 수정`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === category.id}
                        onClick={() => void handleDelete(category)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`${category.name} 삭제`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  );
                }}
                renderEditRow={(item) => (
                  <div className="flex flex-1 items-center gap-2 min-w-0 w-full">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSavingEdit) {
                          void handleSaveEdit(item.id);
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                      disabled={isSavingEdit}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isSavingEdit}
                      onClick={() => void handleSaveEdit(item.id)}
                      aria-label="저장"
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isSavingEdit}
                      onClick={cancelEdit}
                      aria-label="취소"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
