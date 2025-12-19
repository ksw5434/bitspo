"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { RichTextEditor } from "@/app/_components/rich-text-editor";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";

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
 * 뉴스 상세 페이지
 */
export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 뉴스 상세 정보 로드
  useEffect(() => {
    const loadNewsDetail = async () => {
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

        // Supabase에서 직접 뉴스 상세 정보 조회
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("id", newsId)
          .single();

        if (newsError) {
          console.error("뉴스 조회 오류:", newsError);
          alert("뉴스를 불러오는데 실패했습니다.");
          router.push("/dashboard/news");
          return;
        }

        if (!newsData) {
          alert("뉴스를 찾을 수 없습니다.");
          router.push("/dashboard/news");
          return;
        }

        setNews(newsData);
      } catch (error) {
        console.error("뉴스 상세 로드 오류:", error);
        alert("뉴스를 불러오는데 실패했습니다.");
        router.push("/dashboard/news");
      } finally {
        setIsLoading(false);
      }
    };

    if (newsId) {
      loadNewsDetail();
    }
  }, [newsId, router, supabase]);

  // 뉴스 삭제
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/dashboard/news/api/${newsId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        alert("뉴스가 삭제되었습니다.");
        router.push("/dashboard/news");
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !news) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/news")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>
      </div>

      {/* 뉴스 상세 카드 */}
      <Card>
        <CardContent className="p-6">
          {/* 헤더: 제목과 액션 버튼 */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-3xl font-bold flex-1 pr-4">{news.headline}</h1>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/news?edit=${news.id}`)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                수정
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </div>
          </div>

          {/* 이미지 */}
          {news.image_url && (
            <div className="mb-6">
              <img
                src={news.image_url}
                alt={news.headline}
                className="w-full h-auto rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          )}

          {/* 내용 */}
          {news.content && (
            <div className="mb-6">
              <RichTextEditor
                content={news.content}
                editable={false}
                placeholder=""
              />
            </div>
          )}

          {/* 작성 정보 */}
          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              작성일: {formatDate(news.created_at)}
              {news.updated_at !== news.created_at && (
                <span className="ml-2">
                  (수정: {formatDate(news.updated_at)})
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

