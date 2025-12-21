"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import {
  RichTextEditor,
  RichTextEditorRef,
} from "@/app/_components/rich-text-editor";
import {
  ChevronLeft,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

// 카테고리 옵션
const CATEGORIES = [
  "비트코인",
  "이더리움",
  "솔라나",
  "디파이",
  "NFT",
  "메타버스",
  "알트코인",
  "거래소",
  "뉴스",
  "기타",
];

// 인기 태그 옵션
const POPULAR_TAGS = [
  "BTC",
  "ETH",
  "SOL",
  "DeFi",
  "NFT",
  "AI",
  "거래소",
  "뉴스",
  "스테이킹",
  "투자",
];

export default function CommunityEditPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;
  const supabase = createClient();
  const editorRef = useRef<RichTextEditorRef>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    image_url: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 로그인 확인 및 게시글 로드
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);

        // 로그인 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login?redirect=/community/" + postId + "/edit");
          return;
        }

        setIsAuthenticated(true);
        setCurrentUser(user);

        // 게시글 조회
        const { data: postData, error: postError } = await supabase
          .from("communities")
          .select("*")
          .eq("id", postId)
          .single();

        if (postError || !postData) {
          showToast("게시글을 찾을 수 없습니다.", "error");
          router.push("/community");
          return;
        }

        // 작성자 확인
        if (postData.user_id !== user.id) {
          showToast("본인의 게시글만 수정할 수 있습니다.", "error");
          router.push(`/community/${postId}`);
          return;
        }

        setIsAuthor(true);

        // 폼 데이터 설정
        setFormData({
          title: postData.title,
          content: postData.content,
          category: postData.category || "",
          tags: postData.tags || [],
          image_url: postData.image_url || "",
        });

        if (postData.image_url) {
          setImagePreview(postData.image_url);
        }
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        showToast("게시글을 불러오는데 실패했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [postId, supabase, router]);

  // 토스트 메시지 표시
  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (file: File) => {
    // 파일 타입 검증 (모든 이미지 타입 허용)
    // MIME 타입이 image/로 시작하거나, 없거나 application/octet-stream인 경우 허용
    const isImageMimeType = file.type && file.type.startsWith("image/");
    const isOctetStream = file.type === "application/octet-stream" || !file.type;
    
    if (!isImageMimeType && !isOctetStream) {
      showToast("이미지 파일만 업로드할 수 있습니다.", "error");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("파일 크기는 10MB를 초과할 수 없습니다.", "error");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/community/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드에 실패했습니다.");
      }

      setFormData((prev) => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
      showToast("이미지가 업로드되었습니다.", "success");
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      showToast(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
        "error"
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 태그 추가/제거
  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  // 커스텀 태그 추가
  const handleCustomTagAdd = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !formData.tags.includes(trimmedTag) &&
      trimmedTag.length <= 20
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast("제목을 입력해주세요.", "error");
      return;
    }

    if (!formData.content.trim()) {
      showToast("내용을 입력해주세요.", "error");
      return;
    }

    if (formData.title.length > 200) {
      showToast("제목은 200자 이하로 입력해주세요.", "error");
      return;
    }

    try {
      setIsSaving(true);

      // 게시글 수정
      const { error } = await supabase
        .from("communities")
        .update({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : [],
          image_url: formData.image_url || null,
        })
        .eq("id", postId)
        .eq("user_id", currentUser.id); // 본인 게시글만 수정 가능

      if (error) {
        throw new Error(error.message || "게시글 수정에 실패했습니다.");
      }

      showToast("게시글이 수정되었습니다.", "success");
      setTimeout(() => {
        router.push(`/community/${postId}`);
      }, 1000);
    } catch (error) {
      console.error("제출 오류:", error);
      showToast(
        error instanceof Error ? error.message : "게시글 수정에 실패했습니다.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-muted py-4 min-h-screen">
        <div className="container mx-auto">
          <div className="bg-card rounded-lg p-8">
            <div className="text-center text-muted-foreground">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthor) {
    return null;
  }

  return (
    <div className="bg-muted py-4 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-semibold">게시글 수정</h1>
        </div>

        {/* 수정 폼 */}
        <Card className="bg-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-2"
                >
                  제목 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="게시글 제목을 입력하세요"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/200
                </p>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">카테고리 선택 (선택사항)</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  태그
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        formData.tags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="커스텀 태그 입력 (엔터로 추가)"
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomTagAdd(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 이미지 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  대표 이미지
                </label>
                {imagePreview ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="w-full rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image_url: "" }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {isUploadingImage
                          ? "업로드 중..."
                          : "이미지를 클릭하여 업로드"}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* 본문 내용 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  내용 <span className="text-destructive">*</span>
                </label>
                <RichTextEditor
                  ref={editorRef}
                  content={formData.content}
                  onChange={(html) =>
                    setFormData({ ...formData, content: html })
                  }
                  placeholder="게시글 내용을 입력하세요..."
                  editable={true}
                />
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    "수정하기"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 토스트 메시지 */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            toastMessage.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toastMessage.message}
        </div>
      )}
    </div>
  );
}

