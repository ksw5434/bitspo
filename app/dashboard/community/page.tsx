"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import {
  RichTextEditor,
  RichTextEditorRef,
} from "@/app/_components/rich-text-editor";
import {
  MessageSquare,
  Plus,
  X,
  Image as ImageIcon,
  Tag,
  Trash2,
  Loader2,
} from "lucide-react";

/**
 * 커뮤니티 게시글 타입 정의
 */
interface Community {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  views: number;
  like_count: number;
  comment_count: number;
}

/**
 * 쿼리 파라미터 처리 컴포넌트 (Suspense 경계 내에서 사용)
 */
function EditQueryHandler({
  isAdmin,
  communityList,
  onEdit,
  router,
}: {
  isAdmin: boolean;
  communityList: Community[];
  onEdit: (community: Community) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAdmin && communityList.length > 0) {
      const editId = searchParams.get("edit");
      if (editId) {
        const communityToEdit = communityList.find(
          (community) => community.id === editId
        );
        if (communityToEdit) {
          onEdit(communityToEdit);
          // URL에서 쿼리 파라미터 제거
          router.replace("/dashboard/community");
        }
      }
    }
  }, [isAdmin, communityList, searchParams, router, onEdit]);

  return null;
}

/**
 * 관리자 커뮤니티 게시판 페이지
 */
function DashboardCommunityPageContent() {
  const router = useRouter();
  const [communityList, setCommunityList] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    image_url: "",
  });
  const [categories, setCategories] = useState<string[]>([]); // 전체 카테고리 목록
  const [showCategoryManager, setShowCategoryManager] = useState(false); // 카테고리 관리 섹션 표시 여부
  const [newCategoryName, setNewCategoryName] = useState(""); // 새 카테고리 이름
  const [isAddingCategory, setIsAddingCategory] = useState(false); // 카테고리 추가 중 상태
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]); // 인기 태그 목록
  const [isLoadingTags, setIsLoadingTags] = useState(false); // 태그 로딩 상태
  const [customTagInput, setCustomTagInput] = useState(""); // 커스텀 태그 입력
  const editorRef = useRef<RichTextEditorRef>(null);

  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 관리자 권한 확인 및 커뮤니티 목록 로드
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
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);

        // 카테고리 목록 로드
        await loadCategories();

        // 인기 태그 로드
        await loadPopularTags();

        // 커뮤니티 목록 로드
        await loadCommunities();
      } catch (error) {
        console.error("데이터 로드 오류:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 카테고리 목록 로드 (기존 게시글에서 고유한 카테고리 추출)
  const loadCategories = async () => {
    try {
      const { data: communitiesData, error } = await supabase
        .from("communities")
        .select("category")
        .not("category", "is", null);

      if (error) {
        console.error("카테고리 로드 오류:", error);
        return;
      }

      // 고유한 카테고리 추출
      const uniqueCategories = Array.from(
        new Set(
          (communitiesData || [])
            .map((item) => item.category)
            .filter((cat): cat is string => cat !== null)
        )
      ).sort();

      setCategories(uniqueCategories);
    } catch (error) {
      console.error("카테고리 로드 오류:", error);
    }
  };

  // 인기 태그 로드
  const loadPopularTags = async () => {
    try {
      setIsLoadingTags(true);

      const { data: communitiesData, error } = await supabase
        .from("communities")
        .select("tags")
        .not("tags", "is", null);

      if (error) {
        console.error("태그 조회 오류:", error);
        return;
      }

      if (!communitiesData || communitiesData.length === 0) {
        setPopularTags([]);
        return;
      }

      // 모든 태그를 하나의 배열로 합치기
      const allTags: string[] = [];
      communitiesData.forEach((item) => {
        if (item.tags && Array.isArray(item.tags)) {
          allTags.push(...item.tags);
        }
      });

      // 태그 빈도수 계산
      const tagCountMap = new Map<string, number>();
      allTags.forEach((tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag) {
          tagCountMap.set(trimmedTag, (tagCountMap.get(trimmedTag) || 0) + 1);
        }
      });

      // 빈도수 기준으로 정렬하고 상위 50개 추출
      const sortedTags = Array.from(tagCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([tag]) => tag);

      setPopularTags(sortedTags);
    } catch (error) {
      console.error("태그 로드 오류:", error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // 커뮤니티 목록 로드
  const loadCommunities = async () => {
    try {
      const { data: communitiesData, error } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("커뮤니티 로드 오류:", error);
        alert("커뮤니티 게시글을 불러오는데 실패했습니다.");
        return;
      }

      setCommunityList(communitiesData || []);
    } catch (error) {
      console.error("커뮤니티 로드 오류:", error);
      alert("커뮤니티 게시글을 불러오는데 실패했습니다.");
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "",
      tags: [],
      image_url: "",
    });
    setImagePreview(null);
    setIsUploadingImage(false);
    setIsDragging(false);
    setEditingCommunity(null);
    setShowForm(false);
    setCustomTagInput("");
  };

  // 커뮤니티 작성/수정 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!formData.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      const url = editingCommunity
        ? `/dashboard/community/api/${editingCommunity.id}`
        : "/dashboard/community/api";
      const method = editingCommunity ? "PUT" : "POST";

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
          editingCommunity
            ? "게시글이 수정되었습니다."
            : "게시글이 작성되었습니다."
        );
        resetForm();
        await loadCommunities();
        await loadCategories(); // 카테고리 목록 새로고침
        await loadPopularTags(); // 태그 목록 새로고침
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

      const response = await fetch("/dashboard/community/api/upload-image", {
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
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 커뮤니티 수정 시작
  const handleEdit = useCallback(async (community: Community) => {
    setEditingCommunity(community);
    const imageUrl = community.image_url || "";

    setFormData({
      title: community.title,
      content: community.content || "",
      category: community.category || "",
      tags: community.tags || [],
      image_url: imageUrl,
    });

    // 이미지 URL이 있으면 미리보기 설정
    if (imageUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(imageUrl)) {
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    setShowForm(true);
  }, []);

  // 태그 토글
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

    if (!trimmedTag) {
      alert("태그를 입력해주세요.");
      return;
    }

    if (trimmedTag.length > 20) {
      alert("태그는 최대 20자까지 입력할 수 있습니다.");
      return;
    }

    if (formData.tags.includes(trimmedTag)) {
      alert("이미 추가된 태그입니다.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, trimmedTag],
    }));
    setCustomTagInput("");
  };

  // 새 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("카테고리 이름을 입력해주세요.");
      return;
    }

    // 중복 확인
    const exists = categories.some(
      (cat) => cat.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (exists) {
      alert("이미 존재하는 카테고리입니다.");
      return;
    }

    setIsAddingCategory(true);

    try {
      // 카테고리는 실제로 게시글이 생성될 때 저장되므로, 여기서는 목록에만 추가
      // 실제로는 빈 게시글을 만들거나, 별도 테이블이 필요할 수 있음
      // 일단 목록에만 추가하고, 실제 사용 시 저장되도록 함
      setCategories((prev) => [...prev, newCategoryName.trim()].sort());
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
  const handleDeleteCategory = async (categoryName: string) => {
    if (
      !confirm(
        `정말 "${categoryName}" 카테고리를 삭제하시겠습니까?\n이 카테고리를 사용하는 모든 게시글에서도 제거됩니다.`
      )
    ) {
      return;
    }

    try {
      // 해당 카테고리를 사용하는 모든 게시글의 카테고리를 null로 변경
      const { error } = await supabase
        .from("communities")
        .update({ category: null })
        .eq("category", categoryName);

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

  // 커뮤니티 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/dashboard/community/api/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        alert("게시글이 삭제되었습니다.");
        await loadCommunities();
        await loadCategories(); // 카테고리 목록 새로고침
        await loadPopularTags(); // 태그 목록 새로고침
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
    return html.replace(/<[^>]*>/g, "").trim();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
          <MessageSquare className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">커뮤니티 관리</h1>
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
                <Plus className="w-4 h-4 mr-2" />새 게시글 작성
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
                      key={category}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category)}
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
                {editingCommunity ? "게시글 수정" : "새 게시글 작성"}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium mb-2"
                >
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">태그</label>
                {isLoadingTags ? (
                  <div className="text-sm text-muted-foreground mb-2">
                    태그를 불러오는 중...
                  </div>
                ) : popularTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {popularTags.map((tag) => (
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
                ) : (
                  <div className="text-sm text-muted-foreground mb-2">
                    아직 등록된 태그가 없습니다.
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="태그 입력 후 엔터로 추가 (최대 20자)"
                    className="text-sm"
                    maxLength={20}
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomTagAdd(customTagInput);
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
              <div>
                <label
                  htmlFor="image_url"
                  className="block text-sm font-medium mb-2"
                >
                  대표이미지
                </label>
                <div className="space-y-2">
                  {/* 드래그 앤 드롭 영역 */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${
                      isUploadingImage ? "opacity-50 pointer-events-none" : ""
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);

                      const files = Array.from(e.dataTransfer.files);
                      const imageFile = files.find((file) =>
                        file.type.startsWith("image/")
                      );

                      if (imageFile) {
                        await handleImageUpload(imageFile);
                      }
                    }}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="대표이미지 미리보기"
                            className="max-w-full h-auto max-h-64 rounded-lg border-2 border-border"
                            onError={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, image_url: "" });
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, image_url: "" });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  await handleImageUpload(file);
                                }
                              };
                              input.click();
                            }}
                            disabled={isUploadingImage}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            이미지 변경
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (formData.image_url && editorRef.current) {
                                editorRef.current.insertImage(
                                  formData.image_url
                                );
                              }
                            }}
                            disabled={!formData.image_url}
                            title="에디터에 이미지 삽입"
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            에디터에 삽입
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              이미지를 드래그 앤 드롭하거나 클릭하여 선택하세요
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              지원 형식: JPG, PNG, GIF, WEBP, SVG (최대 10MB)
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement)
                                .files?.[0];
                              if (file) {
                                await handleImageUpload(file);
                              }
                            };
                            input.click();
                          }}
                          disabled={isUploadingImage}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          이미지 선택
                        </Button>
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          이미지 업로드 중...
                        </p>
                      </div>
                    )}
                  </div>
                  {/* URL 직접 입력 (선택사항) */}
                  <div className="flex gap-2">
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData({ ...formData, image_url: url });
                        // URL이 유효한 이미지 URL인지 확인하여 미리보기 표시
                        if (
                          url &&
                          /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)
                        ) {
                          setImagePreview(url);
                        } else if (!url) {
                          setImagePreview(null);
                        }
                      }}
                      placeholder="또는 이미지 URL을 직접 입력하세요"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCommunity ? "수정하기" : "작성하기"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 커뮤니티 목록 */}
      <div className="space-y-4">
        {communityList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">게시글이 없습니다</p>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />새 게시글 작성
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          communityList.map((community) => (
            <Card
              key={community.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* 이미지 */}
                  {community.image_url && (
                    <div className="flex-shrink-0 w-32 h-32">
                      <img
                        src={community.image_url}
                        alt={community.title}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold line-clamp-2">
                        {community.title}
                      </h3>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/community/${community.id}`)
                          }
                        >
                          보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(community)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(community.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {community.content && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {stripHtmlTags(community.content)}
                      </p>
                    )}
                    {/* 카테고리 및 태그 표시 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {community.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {community.category}
                        </span>
                      )}
                      {community.tags &&
                        community.tags.length > 0 &&
                        community.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        작성일: {formatDate(community.created_at)}
                        {community.updated_at !== community.created_at && (
                          <span className="ml-2">
                            (수정: {formatDate(community.updated_at)})
                          </span>
                        )}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>조회 {community.views || 0}</span>
                        <span>좋아요 {community.like_count || 0}</span>
                        <span>댓글 {community.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 쿼리 파라미터 처리 (Suspense 경계 내) */}
      <Suspense fallback={null}>
        <EditQueryHandler
          isAdmin={isAdmin}
          communityList={communityList}
          onEdit={handleEdit}
          router={router}
        />
      </Suspense>
    </div>
  );
}

/**
 * 메인 페이지 컴포넌트 (Suspense 경계로 감싸서 export)
 */
export default function DashboardCommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <DashboardCommunityPageContent />
    </Suspense>
  );
}
