"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "@/app/_components/rich-text-editor";
import {
  DISCUSSION_TOPIC_CATEGORIES,
  type CommunitySection,
} from "@/lib/community-sections";

export type AdminCommunityPost = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  section?: string | null;
  tags?: string[] | null;
  image_url?: string | null;
};

type CommunityPostEditFormProps = {
  section: Extract<CommunitySection, "forum" | "discussion">;
  post: AdminCommunityPost | null;
  listHref: string;
  onSaved: () => void;
  onError: (message: string | null) => void;
};

export function CommunityPostEditForm({
  section,
  post,
  listHref,
  onSaved,
  onError,
}: CommunityPostEditFormProps) {
  const isEdit = !!post;
  const editorRef = useRef<RichTextEditorRef>(null);

  const [formData, setFormData] = useState({
    title: post?.title ?? "",
    content: post?.content ?? "",
    category:
      post?.category ??
      (section === "discussion" ? DISCUSSION_TOPIC_CATEGORIES[0] : "Forum"),
    tags: (post?.tags ?? []).join(", "),
    image_url: post?.image_url ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    post?.image_url ?? null,
  );

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setIsUploadingImage(true);
    onError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/community/api/upload-image", {
        method: "POST",
        body,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "이미지 업로드 실패");
      }

      const url = json.url as string;
      setFormData((prev) => ({ ...prev, image_url: url }));
      setImagePreview(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "이미지 업로드 실패");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      onError("제목을 입력해주세요.");
      return;
    }

    if (!formData.content.trim()) {
      onError("내용을 입력해주세요.");
      return;
    }

    const tagList = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    onError(null);

    try {
      const payload = {
        section,
        title: formData.title.trim(),
        content: formData.content,
        category: formData.category,
        tags: tagList,
        image_url: formData.image_url?.trim() || null,
      };

      const url = isEdit
        ? `/api/admin/community/posts/${post.id}`
        : "/api/admin/community/posts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "저장 실패");
      }

      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {isEdit ? "글 수정" : "새 글 작성"} · {section === "forum" ? "Forum" : "Discussion"}
        </h2>
        <Button type="button" variant="outline" asChild>
          <Link href={listHref}>목록</Link>
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="community-title">
          제목
        </label>
        <Input
          id="community-title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          maxLength={200}
          required
        />
      </div>

      {section === "discussion" && (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="community-category">
            카테고리
          </label>
          <select
            id="community-category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            {DISCUSSION_TOPIC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">내용</label>
        <RichTextEditor
          ref={editorRef}
          content={formData.content}
          onChange={(html) =>
            setFormData((prev) => ({ ...prev, content: html }))
          }
          uploadImageUrl="/community/api/upload-image"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="community-tags">
          태그 (쉼표 구분)
        </label>
        <Input
          id="community-tags"
          value={formData.tags}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, tags: e.target.value }))
          }
          placeholder="비트코인, 디파이"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">대표 이미지</label>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isUploadingImage}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) void handleImageUpload(file);
              };
              input.click();
            }}
          >
            <ImageIcon className="mr-2 size-4" aria-hidden />
            {isUploadingImage ? "업로드 중..." : "이미지 선택"}
          </Button>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="미리보기"
              className="h-20 w-auto rounded border object-cover"
            />
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : isEdit ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
