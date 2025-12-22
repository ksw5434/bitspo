"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import {
  RichTextEditor,
  RichTextEditorRef,
} from "@/app/_components/rich-text-editor";
import { ChevronLeft, X, Image as ImageIcon, Tag, Loader2 } from "lucide-react";

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

export default function CommunityWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const editorRef = useRef<RichTextEditorRef>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    image_url: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 로그인 확인 및 뉴스 데이터 로드
  useEffect(() => {
    const checkAuthAndLoadNews = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 비로그인 사용자는 로그인 페이지로 리다이렉트
        const newsId = searchParams.get("newsId");
        const redirectUrl = newsId
          ? `/community/write?newsId=${newsId}`
          : "/community/write";
        router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }

      setIsAuthenticated(true);
      setCurrentUser(user);

      // 뉴스 ID가 쿼리 파라미터에 있는 경우 뉴스 데이터 로드
      const newsId = searchParams.get("newsId");
      if (newsId) {
        await loadNewsData(newsId);
      }
    };

    checkAuthAndLoadNews();
  }, [supabase, router, searchParams]);

  // 뉴스 데이터 로드 함수
  const loadNewsData = async (newsId: string) => {
    if (!supabase) return;

    try {
      setIsLoadingNews(true);

      // 뉴스 데이터 조회
      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("*")
        .eq("id", newsId)
        .single();

      if (newsError) {
        console.error("뉴스 조회 오류:", newsError);
        showToast("뉴스 정보를 불러오는데 실패했습니다.", "error");
        return;
      }

      if (newsData) {
        // 뉴스 헤드라인에서 코인 태그 추출
        const extractCoinTag = (headline: string): string => {
          const coinKeywords: { [key: string]: string } = {
            비트코인: "BTC",
            BTC: "BTC",
            솔라나: "SOL",
            SOL: "SOL",
            이더리움: "ETH",
            ETH: "ETH",
            리플: "XRP",
            XRP: "XRP",
            도지코인: "DOGE",
            DOGE: "DOGE",
            바이낸스: "BNB",
            BNB: "BNB",
            테더: "USDT",
            USDT: "USDT",
            카르다노: "ADA",
            ADA: "ADA",
            폴카닷: "DOT",
            DOT: "DOT",
            아발란체: "AVAX",
            AVAX: "AVAX",
            체인링크: "LINK",
            LINK: "LINK",
            펠로: "PEPE",
            PEPE: "PEPE",
          };

          for (const [keyword, tag] of Object.entries(coinKeywords)) {
            if (headline.includes(keyword)) {
              return tag;
            }
          }
          return "BTC";
        };

        // 본문 내용 추출 (문자열 또는 JSONB 처리)
        let contentText = "";
        if (typeof newsData.content === "string") {
          contentText = newsData.content;
        } else if (
          typeof newsData.content === "object" &&
          newsData.content !== null
        ) {
          // JSONB인 경우 텍스트 추출
          try {
            const extractText = (node: any): string => {
              if (typeof node === "string") return node;
              if (node?.text) return node.text;
              if (node?.content && Array.isArray(node.content)) {
                return node.content.map(extractText).join("");
              }
              return "";
            };
            contentText =
              extractText(newsData.content) || JSON.stringify(newsData.content);
          } catch (e) {
            contentText = JSON.stringify(newsData.content);
          }
        }

        // 폼 데이터에 뉴스 정보 미리 채우기
        const coinTag = extractCoinTag(newsData.headline);
        const tags = [coinTag];

        // 뉴스 링크 추가
        const newsLink = `\n\n<a href="/news/${newsId}" target="_blank" rel="noopener noreferrer">원본 뉴스 보기</a>`;
        const contentWithLink = contentText + newsLink;

        setFormData({
          title: `[뉴스] ${newsData.headline}`,
          content: contentWithLink,
          category: "뉴스",
          tags: tags,
          image_url: newsData.image_url || "",
        });

        // 이미지가 있으면 미리보기 설정
        if (newsData.image_url) {
          setImagePreview(newsData.image_url);
        }

        showToast("뉴스 정보가 불러와졌습니다.", "success");
      }
    } catch (error) {
      console.error("뉴스 데이터 로드 오류:", error);
      showToast("뉴스 정보를 불러오는데 실패했습니다.", "error");
    } finally {
      setIsLoadingNews(false);
    }
  };

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
    const isOctetStream =
      file.type === "application/octet-stream" || !file.type;

    if (!isImageMimeType && !isOctetStream) {
      showToast("이미지 파일만 업로드할 수 있습니다.", "error");
      return;
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("파일 크기는 10MB를 초과할 수 없습니다.", "error");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 커뮤니티 이미지 업로드 API (나중에 구현 필요)
      const response = await fetch("/community/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // 상세한 에러 메시지 표시
        const errorMessage = result.details
          ? `${result.error}\n${result.details}`
          : result.error || "이미지 업로드에 실패했습니다.";
        throw new Error(errorMessage);
      }

      // 업로드 성공 시 이미지 URL 설정
      setFormData((prev) => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
      showToast("이미지가 업로드되었습니다.", "success");
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
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

    // 필수 필드 검증
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
      setIsLoading(true);

      // 게시글 작성
      // 이미지 URL이 없거나 빈 문자열인 경우 null로 처리 (선택사항)
      const imageUrl = formData.image_url?.trim() || null;

      const { data, error } = await supabase
        .from("communities")
        .insert({
          user_id: currentUser.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : [],
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("게시글 작성 오류:", error);
        throw new Error(error.message || "게시글 작성에 실패했습니다.");
      }

      if (data) {
        showToast("게시글이 작성되었습니다.", "success");
        // 작성 완료 후 상세 페이지로 이동
        setTimeout(() => {
          router.push(`/community/${data.id}`);
        }, 1000);
      }
    } catch (error) {
      console.error("제출 오류:", error);
      showToast(
        error instanceof Error ? error.message : "게시글 작성에 실패했습니다.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인하지 않은 경우 또는 뉴스 데이터 로딩 중 로딩 표시
  if (!isAuthenticated || isLoadingNews) {
    return (
      <div className="bg-muted py-4 min-h-screen">
        <div className="container mx-auto">
          <div className="bg-card rounded-lg p-8">
            <div className="text-center text-muted-foreground">
              {isLoadingNews ? "뉴스 정보를 불러오는 중..." : "로딩 중..."}
            </div>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-semibold">게시글 작성</h1>
        </div>

        {/* 작성 폼 */}
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
                <label className="block text-sm font-medium mb-2">태그</label>
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
                  대표 이미지{" "}
                  <span className="text-muted-foreground font-normal">
                    (선택사항)
                  </span>
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
                          : "이미지를 클릭하여 업로드 (선택사항)"}
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      작성 중...
                    </>
                  ) : (
                    "작성하기"
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
