"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { Newspaper, Plus, Edit2, Trash2, X } from "lucide-react";

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
}

/**
 * 관리자 뉴스 게시판 페이지
 */
export default function DashboardNewsPage() {
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
  });

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
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);

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

  // 뉴스 목록 로드
  const loadNews = async () => {
    try {
      const response = await fetch("/dashboard/news/api");
      const result = await response.json();

      if (response.ok) {
        setNewsList(result.data || []);
      } else {
        alert(result.error || "뉴스를 불러오는데 실패했습니다.");
      }
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
    });
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
      const url = editingNews
        ? `/dashboard/news/api/${editingNews.id}`
        : "/dashboard/news/api";
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
          editingNews ? "뉴스가 수정되었습니다." : "뉴스가 작성되었습니다."
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

  // 뉴스 수정 시작
  const handleEdit = (news: News) => {
    setEditingNews(news);
    setFormData({
      headline: news.headline,
      content: news.content || "",
      image_url: news.image_url || "",
    });
    setShowForm(true);
  };

  // 뉴스 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/dashboard/news/api/${id}`, {
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
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />새 뉴스 작성
          </Button>
        )}
      </div>

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
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="뉴스 내용을 입력하세요"
                  rows={6}
                />
              </div>
              <div>
                <label
                  htmlFor="image_url"
                  className="block text-sm font-medium mb-2"
                >
                  이미지 URL
                </label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
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

      {/* 뉴스 목록 */}
      <div className="space-y-4">
        {newsList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">작성된 뉴스가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          newsList.map((news) => (
            <Card key={news.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* 이미지 */}
                  {news.image_url && (
                    <div className="flex-shrink-0 w-32 h-32">
                      <img
                        src={news.image_url}
                        alt={news.headline}
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
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {news.headline}
                    </h3>
                    {news.content && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {news.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        작성일: {formatDate(news.created_at)}
                        {news.updated_at !== news.created_at && (
                          <span className="ml-2">
                            (수정: {formatDate(news.updated_at)})
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(news)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(news.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
