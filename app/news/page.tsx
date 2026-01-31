"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  RichTextEditor,
  RichTextEditorRef,
} from "@/app/_components/rich-text-editor";
import {
  Newspaper,
  Plus,
  X,
  Image as ImageIcon,
  Tag,
  Trash2,
} from "lucide-react";

/**
 * 뉴스 타입 정의
 */
interface News {
  id: string;
  headline: string;
  content: string | null;
  image_url: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

/**
 * 카테고리 타입 정의
 */
interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * 쿼리 파라미터 처리 컴포넌트 (Suspense 경계 내에서 사용)
 */
function EditQueryHandler({
  isAdmin,
  newsList,
  onEdit,
  router,
}: {
  isAdmin: boolean;
  newsList: News[];
  onEdit: (news: News) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAdmin && newsList.length > 0) {
      const editId = searchParams.get("edit");
      if (editId) {
        const newsToEdit = newsList.find((news) => news.id === editId);
        if (newsToEdit) {
          onEdit(newsToEdit);
          // URL에서 쿼리 파라미터 제거
          router.replace("/news");
        }
      }
    }
  }, [isAdmin, newsList, searchParams, router, onEdit]);

  return null;
}

/**
 * 관리자 뉴스 게시판 페이지
 */
function DashboardNewsPageContent() {
  const router = useRouter();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    headline: "",
    content: "",
    image_url: "",
    category_ids: [] as string[], // 선택된 카테고리 ID 배열
  });
  const [categories, setCategories] = useState<Category[]>([]); // 전체 카테고리 목록
  const [newsCategories, setNewsCategories] = useState<string[]>([]); // 현재 뉴스의 카테고리 ID 배열
  const [showCategoryManager, setShowCategoryManager] = useState(false); // 카테고리 관리 섹션 표시 여부
  const [newCategoryName, setNewCategoryName] = useState(""); // 새 카테고리 이름
  const [isAddingCategory, setIsAddingCategory] = useState(false); // 카테고리 추가 중 상태
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 관리자 권한 확인 및 뉴스 목록 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 현재 사용자 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!user || authError) {
          router.push("/auth/login");
          return;
        }

        // 관리자 권한 확인
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (!profile?.is_admin) {
          alert("관리자 권한이 필요합니다.");
          router.push("/");
          return;
        }

        setIsAdmin(true);

        // 카테고리 목록 로드
        await loadCategories();

        // 뉴스 목록 로드
        await loadNews();
      } catch (error) {
        console.error("데이터 로드 오류:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (categoriesError) {
        console.error("카테고리 로드 오류:", categoriesError);
        return;
      }

      setCategories(categoriesData || []);
    } catch (error) {
      console.error("카테고리 로드 오류:", error);
    }
  };

  // 특정 뉴스의 카테고리 로드
  const loadNewsCategories = async (newsId: string) => {
    try {
      const { data: newsCategoriesData, error } = await supabase
        .from("news_categories")
        .select("category_id")
        .eq("news_id", newsId);

      if (error) {
        console.error("뉴스 카테고리 로드 오류:", error);
        return [];
      }

      return (newsCategoriesData || []).map((nc) => nc.category_id);
    } catch (error) {
      console.error("뉴스 카테고리 로드 오류:", error);
      return [];
    }
  };

  // 뉴스 목록 로드 (카테고리 및 작성자 정보 포함)
  const loadNews = async () => {
    try {
      // Supabase에서 직접 뉴스 목록 조회 (최신순, 카테고리 포함)
      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select(
          `
          *,
          news_categories (
            category_id,
            categories (
              id,
              name
            )
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (newsError) {
        console.error("뉴스 로드 오류:", newsError);
        alert("뉴스를 불러오는데 실패했습니다.");
        return;
      }

      // 작성자 정보 조회
      const authorIds = [
        ...new Set(
          (newsData || [])
            .map((news) => news.author_id)
            .filter((id): id is string => id !== null),
        ),
      ];

      let authorMap = new Map<
        string,
        { id: string; name: string | null; avatar_url: string | null }
      >();

      if (authorIds.length > 0) {
        const { data: authorData } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", authorIds);

        if (authorData) {
          authorData.forEach((author) => {
            authorMap.set(author.id, {
              id: author.id,
              name: author.name,
              avatar_url: author.avatar_url,
            });
          });
        }
      }

      // 뉴스 데이터에 작성자 정보 추가
      const newsWithAuthors = (newsData || []).map((news) => ({
        ...news,
        author: news.author_id ? authorMap.get(news.author_id) : undefined,
      }));

      setNewsList(newsWithAuthors);
    } catch (error) {
      console.error("뉴스 로드 오류:", error);
      alert("뉴스를 불러오는데 실패했습니다.");
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      headline: "",
      content: "",
      image_url: "",
      category_ids: [],
    });
    setNewsCategories([]);
    setImagePreview(null);
    setIsUploadingImage(false);
    setIsDragging(false);
    setEditingNews(null);
    setShowForm(false);
  };

  // 뉴스 작성/수정 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.headline.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      const url = editingNews ? `/news/api/${editingNews.id}` : "/news/api";
      const method = editingNews ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          editingNews ? "뉴스가 수정되었습니다." : "뉴스가 작성되었습니다.",
        );
        resetForm();
        await loadNews();
      } else {
        alert(result.error || "작업에 실패했습니다.");
      }
    } catch (error) {
      console.error("제출 오류:", error);
      alert("작업에 실패했습니다.");
    }
  };

  // 이미지 업로드 처리 함수
  const handleImageUpload = async (file: File) => {
    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/news/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드에 실패했습니다.");
      }

      // 업로드 성공 시 이미지 URL 설정
      setFormData((prev) => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 뉴스 수정 시작 (useCallback으로 메모이제이션하여 안정적인 참조 유지)
  const handleEdit = useCallback(async (news: News) => {
    setEditingNews(news);
    const imageUrl = news.image_url || "";

    // 해당 뉴스의 카테고리 로드
    const categoryIds = await loadNewsCategories(news.id);
    setNewsCategories(categoryIds);

    setFormData({
      headline: news.headline,
      content: news.content || "",
      image_url: imageUrl,
      category_ids: categoryIds,
    });
    // 이미지 URL이 있으면 미리보기 설정
    if (imageUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(imageUrl)) {
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    setShowForm(true);
  }, []);

  // 카테고리 체크박스 변경 핸들러
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      // 카테고리 추가
      setFormData((prev) => ({
        ...prev,
        category_ids: [...prev.category_ids, categoryId],
      }));
      setNewsCategories((prev) => [...prev, categoryId]);
    } else {
      // 카테고리 제거
      setFormData((prev) => ({
        ...prev,
        category_ids: prev.category_ids.filter((id) => id !== categoryId),
      }));
      setNewsCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  // 새 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("카테고리 이름을 입력해주세요.");
      return;
    }

    // 중복 확인
    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase(),
    );
    if (exists) {
      alert("이미 존재하는 카테고리입니다.");
      return;
    }

    setIsAddingCategory(true);

    try {
      const { data: newCategory, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("카테고리 추가 오류:", error);
        alert("카테고리 추가에 실패했습니다.");
        return;
      }

      // 카테고리 목록 새로고침
      await loadCategories();
      setNewCategoryName("");
      alert("카테고리가 추가되었습니다.");
    } catch (error) {
      console.error("카테고리 추가 오류:", error);
      alert("카테고리 추가에 실패했습니다.");
    } finally {
      setIsAddingCategory(false);
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string,
  ) => {
    if (
      !confirm(
        `정말 "${categoryName}" 카테고리를 삭제하시겠습니까?\n이 카테고리가 연결된 모든 뉴스에서도 제거됩니다.`,
      )
    ) {
      return;
    }

    try {
      // 먼저 해당 카테고리와 연결된 뉴스-카테고리 관계 삭제
      const { error: relationError } = await supabase
        .from("news_categories")
        .delete()
        .eq("category_id", categoryId);

      if (relationError) {
        console.error("뉴스-카테고리 관계 삭제 오류:", relationError);
        alert("카테고리 삭제에 실패했습니다.");
        return;
      }

      // 카테고리 삭제
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) {
        console.error("카테고리 삭제 오류:", error);
        alert("카테고리 삭제에 실패했습니다.");
        return;
      }

      // 카테고리 목록 새로고침
      await loadCategories();
      alert("카테고리가 삭제되었습니다.");
    } catch (error) {
      console.error("카테고리 삭제 오류:", error);
      alert("카테고리 삭제에 실패했습니다.");
    }
  };

  // 뉴스 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/news/api/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        alert("뉴스가 삭제되었습니다.");
        await loadNews();
      } else {
        alert(result.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // HTML 태그 제거 및 텍스트만 추출 (목록 미리보기용)
  const stripHtmlTags = (html: string | null): string => {
    if (!html) return "";
    // 간단한 HTML 태그 제거
    return html.replace(/<[^>]*>/g, "").trim();
  };

  // 본문에서 첫 번째 이미지 URL 추출
  const getFirstImageFromContent = (content: string | null): string | null => {
    if (!content) return null;

    // HTML에서 첫 번째 img 태그의 src 속성 추출
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }

    // TipTap JSON 형식인 경우 처리
    try {
      const jsonContent = JSON.parse(content);
      if (jsonContent && jsonContent.content) {
        const findImage = (nodes: any[]): string | null => {
          for (const node of nodes) {
            if (node.type === "image" && node.attrs?.src) {
              return node.attrs.src;
            }
            if (node.content && Array.isArray(node.content)) {
              const found = findImage(node.content);
              if (found) return found;
            }
          }
          return null;
        };
        return findImage(jsonContent.content);
      }
    } catch (e) {
      // JSON 파싱 실패 시 HTML로 처리
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">뉴스 관리</h1>
        </div>
        <div className="flex gap-2">
          {!showForm && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCategoryManager(!showCategoryManager)}
              >
                <Tag className="w-4 h-4 mr-2" />
                카테고리 관리
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />새 뉴스 작성
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 카테고리 관리 섹션 */}
      {showCategoryManager && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Tag className="w-5 h-5" />
                카테고리 관리
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCategoryManager(false);
                  setNewCategoryName("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 새 카테고리 추가 */}
            <div className="mb-6 pb-6 border-b">
              <label
                htmlFor="new_category"
                className="block text-sm font-medium mb-2"
              >
                새 카테고리 추가
              </label>
              <div className="flex gap-2">
                <Input
                  id="new_category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="카테고리 이름을 입력하세요"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAddingCategory) {
                      handleAddCategory();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={isAddingCategory || !newCategoryName.trim()}
                >
                  {isAddingCategory ? (
                    "추가 중..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      추가
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 카테고리 목록 */}
            <div>
              <h3 className="text-sm font-medium mb-3">카테고리 목록</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  등록된 카테고리가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteCategory(category.id, category.name)
                        }
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 작성/수정 폼 */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingNews ? "뉴스 수정" : "새 뉴스 작성"}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="headline"
                  className="block text-sm font-medium mb-2"
                >
                  제목 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  placeholder="뉴스 제목을 입력하세요"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium mb-2"
                >
                  내용
                </label>
                <RichTextEditor
                  ref={editorRef}
                  content={formData.content}
                  onChange={(html) =>
                    setFormData({ ...formData, content: html })
                  }
                  placeholder="뉴스 내용을 입력하세요..."
                  editable={true}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  카테고리
                </label>
                <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      카테고리를 불러오는 중...
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={formData.category_ids.includes(category.id)}
                          onCheckedChange={(checked: boolean) =>
                            handleCategoryChange(category.id, checked === true)
                          }
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingNews ? "수정하기" : "작성하기"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 뉴스 목록 - 카드 그리드 레이아웃 */}
      <div>
        {newsList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">게시글이 없음</p>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />새 뉴스 작성
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newsList.map((news) => {
              // 본문에서 첫 번째 이미지 추출
              const thumbnailImage = getFirstImageFromContent(news.content);

              return (
                <Card
                  key={news.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
                  onClick={() => router.push(`/news/${news.id}`)}
                >
                  {/* 이미지 영역 - 카드 상단 대부분 차지 */}
                  <div className="relative w-full aspect-4/3 overflow-hidden bg-muted">
                    {thumbnailImage ? (
                      <img
                        src={thumbnailImage}
                        alt={news.headline}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Newspaper className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                {/* 내용 영역 */}
                <CardContent className="p-4 flex-1 flex flex-col">
                  {/* 기사 제목 */}
                  <h3 className="text-base font-semibold mb-3 line-clamp-2 text-foreground leading-snug">
                    {news.headline}
                  </h3>

                  {/* 기자 정보 - 하단 */}
                  <div className="mt-auto flex items-center gap-2">
                    {news.author?.avatar_url ? (
                      <img
                        src={news.author.avatar_url}
                        alt={news.author.name || "기자"}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {news.author?.name?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {news.author?.name || "익명"} 기자
                    </span>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 메인 페이지 컴포넌트 (Suspense 경계로 감싸서 export)
 */
export default function DashboardNewsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      }
    >
      <DashboardNewsPageContent />
    </Suspense>
  );
}
