"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "@/app/_components/rich-text-editor";
import type { NewsCategoryRecord } from "@/lib/news-categories";

export type AdminNewsItem = {
  id: string;
  headline: string;
  content: string | null;
  image_url: string | null;
  created_at?: string;
  news_categories?: Array<{
    category_id: string;
    categories: { id: string; name: string } | null;
  }>;
};

type NewsEditFormProps = {
  news: AdminNewsItem | null;
  categories: NewsCategoryRecord[];
  /** URL ?category=slug 로 진입 시 기본 선택 카테고리 */
  defaultCategoryId?: string;
  onSave: () => void;
  onError: (message: string | null) => void;
};

function getCategoryIdsFromNews(news: AdminNewsItem | null): string[] {
  if (!news?.news_categories) return [];
  return news.news_categories
    .map((item) => item.category_id ?? item.categories?.id)
    .filter((id): id is string => !!id);
}

export function NewsEditForm({
  news,
  categories,
  defaultCategoryId,
  onSave,
  onError,
}: NewsEditFormProps) {
  const isEdit = !!news;
  const editorRef = useRef<RichTextEditorRef>(null);

  const initialCategoryIds = (() => {
    const fromNews = getCategoryIdsFromNews(news);
    if (fromNews.length > 0) return fromNews;
    if (defaultCategoryId) return [defaultCategoryId];
    return [];
  })();

  const [formData, setFormData] = useState({
    headline: news?.headline ?? "",
    content: news?.content ?? "",
    image_url: news?.image_url ?? "",
    category_ids: initialCategoryIds,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    news?.image_url ?? null,
  );

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: checked
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter((id) => id !== categoryId),
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onError("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    setIsUploadingImage(true);
    onError(null);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const response = await fetch("/news/api/upload-image", {
        method: "POST",
        body: uploadForm,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드에 실패했습니다.");
      }

      setFormData((prev) => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!formData.headline.trim()) {
      onError("제목을 입력해주세요.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    onError(null);

    try {
      const url = news ? `/news/api/${news.id}` : "/news/api";
      const method = news ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "저장에 실패했습니다.");
      }

      onSave();
    } catch (error) {
      onError(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, news, onError, onSave]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-base font-semibold">
          {isEdit ? "뉴스 수정" : "새 뉴스 작성"}
        </h3>
        <Link
          href="/admin/news"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록으로
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label htmlFor="headline" className="block text-sm font-medium mb-2">
            제목 <span className="text-destructive">*</span>
          </label>
          <Input
            id="headline"
            value={formData.headline}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, headline: e.target.value }))
            }
            placeholder="뉴스 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            내용
          </label>
          <RichTextEditor
            ref={editorRef}
            content={formData.content}
            onChange={(html) =>
              setFormData((prev) => ({ ...prev, content: html }))
            }
            placeholder="뉴스 내용을 입력하세요..."
            editable
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">대표 이미지</span>
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void handleImageUpload(file);
            }}
          >
            {imagePreview ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="max-h-48 mx-auto object-cover rounded"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, image_url: "" }));
                  }}
                >
                  이미지 제거
                </Button>
              </div>
            ) : (
              <>
                <ImageIcon className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  이미지를 드래그하거나 파일을 선택하세요
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="admin-news-image"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                    e.target.value = "";
                  }}
                  disabled={isUploadingImage}
                />
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="admin-news-image" className="cursor-pointer">
                    {isUploadingImage ? "업로드 중..." : "파일 선택"}
                  </label>
                </Button>
              </>
            )}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">카테고리</span>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 카테고리가 없습니다.{" "}
              <Link href="/admin/news/categories" className="text-primary underline">
                카테고리 관리
              </Link>
              에서 추가하세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 p-4 border border-border rounded-lg">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`admin-category-${category.id}`}
                    checked={formData.category_ids.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked === true)
                    }
                  />
                  <label
                    htmlFor={`admin-category-${category.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/news">취소</Link>
        </Button>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSubmitting || !formData.headline.trim()}
        >
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
