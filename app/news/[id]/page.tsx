"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/_components/ui/button";
import { RichTextEditor } from "@/app/_components/rich-text-editor";
import {
  Heart,
  Frown,
  Angry,
  Star,
  MessageSquare,
  Share2,
  Volume2,
  Type,
  ArrowLeft,
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
}

/**
 * 작성자 프로필 타입 정의
 */
interface AuthorProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

/**
 * 공감 타입 정의
 */
type ReactionType = "like" | "sad" | "angry" | "fan" | "follow";

/**
 * 뉴스 상세 페이지 - 네이버 스포츠 스타일
 */
export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  const [news, setNews] = useState<News | null>(null);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    like: 0,
    sad: 0,
    angry: 0,
    fan: 0,
    follow: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);

  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 뉴스 상세 정보 로드
  useEffect(() => {
    const loadNewsDetail = async () => {
      try {
        setIsLoading(true);

        // Supabase에서 뉴스 상세 정보 조회 (인증 불필요)
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("id", newsId)
          .single();

        if (newsError || !newsData) {
          console.error("뉴스 조회 오류:", newsError);
          router.push("/");
          return;
        }

        setNews(newsData);

        // 작성자 프로필 정보 조회
        if (newsData.author_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .eq("id", newsData.author_id)
            .single();

          if (profileData) {
            setAuthorProfile(profileData);
          }
        }

        // 현재 사용자 확인 (공감 기능용)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 사용자의 공감 정보 조회 (추후 구현 가능)
          // const { data: reactionData } = await supabase
          //   .from("news_reactions")
          //   .select("reaction_type")
          //   .eq("news_id", newsId)
          //   .eq("user_id", user.id)
          //   .single();
          // if (reactionData) {
          //   setUserReaction(reactionData.reaction_type);
          // }
        }
      } catch (error) {
        console.error("뉴스 상세 로드 오류:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (newsId) {
      loadNewsDetail();
    }
  }, [newsId, router, supabase]);

  // 날짜 포맷팅 (네이버 스포츠 스타일)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // 오늘 날짜인지 확인
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      if (diffInMinutes < 1) {
        return "방금 전";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      }
    }

    // 날짜 형식: 2026. 1. 31. 오후 9:25
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour >= 12 ? "오후" : "오전";
    const displayHour = hour % 12 || 12;

    return `${year}. ${month}. ${day}. ${ampm} ${displayHour}:${minute.toString().padStart(2, "0")}`;
  };

  // 공감 버튼 클릭 핸들러
  const handleReaction = async (type: ReactionType) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/auth/login");
      return;
    }

    // 이미 같은 반응을 눌렀으면 취소
    if (userReaction === type) {
      setUserReaction(null);
      setReactions((prev) => ({
        ...prev,
        [type]: Math.max(0, prev[type] - 1),
      }));
    } else {
      // 이전 반응이 있으면 취소하고 새 반응 추가
      if (userReaction) {
        setReactions((prev) => ({
          ...prev,
          [userReaction]: Math.max(0, prev[userReaction] - 1),
        }));
      }
      setUserReaction(type);
      setReactions((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
    }

    // TODO: Supabase에 반응 저장
  };

  // 공유하기
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news?.headline,
          text: news?.headline,
          url: window.location.href,
        });
      } catch (error) {
        // 사용자가 공유를 취소한 경우 무시
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="bg-card rounded-lg p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">뉴스를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6">
        {/* 뒤로가기 버튼 */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </Button>
        </div>

        {/* 기사 제목 */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
          {news.headline}
        </h1>

        {/* 입력 날짜 및 기사원문 링크 */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>입력</span>
          <span className="font-medium">{formatDate(news.created_at)}</span>
        </div>

        {/* 공감 버튼 영역 */}
        <div className="border-y border-border py-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium mr-2">공감</span>
            {/* 좋아요 */}
            <button
              onClick={() => handleReaction("like")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                userReaction === "like"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>좋아요</span>
              {reactions.like > 0 && (
                <span className="ml-1">{reactions.like}</span>
              )}
            </button>
            {/* 슬퍼요 */}
            <button
              onClick={() => handleReaction("sad")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                userReaction === "sad"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <Frown className="w-4 h-4" />
              <span>슬퍼요</span>
              {reactions.sad > 0 && (
                <span className="ml-1">{reactions.sad}</span>
              )}
            </button>
            {/* 화나요 */}
            <button
              onClick={() => handleReaction("angry")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                userReaction === "angry"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <Angry className="w-4 h-4" />
              <span>화나요</span>
              {reactions.angry > 0 && (
                <span className="ml-1">{reactions.angry}</span>
              )}
            </button>
            {/* 팬이에요 */}
            <button
              onClick={() => handleReaction("fan")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                userReaction === "fan"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>팬이에요</span>
              {reactions.fan > 0 && (
                <span className="ml-1">{reactions.fan}</span>
              )}
            </button>
            {/* 후속기사 원해요 */}
            <button
              onClick={() => handleReaction("follow")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                userReaction === "follow"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>후속기사 원해요</span>
              {reactions.follow > 0 && (
                <span className="ml-1">{reactions.follow}</span>
              )}
            </button>
          </div>
        </div>

        {/* 유틸리티 버튼 (텍스트 음성 변환, 글자 크기 변경, 공유하기) */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Volume2 className="w-4 h-4" />
            <span>텍스트 음성 변환</span>
          </button>
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Type className="w-4 h-4" />
            <span>글자 크기 변경</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>공유하기</span>
          </button>
        </div>

        {/* 본문 이미지 */}
        {news.image_url && (
          <div className="mb-8">
            <img
              src={news.image_url}
              alt={news.headline}
              className="w-full h-auto rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {/* 이미지 캡션 (선택사항) */}
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {news.headline}
            </p>
          </div>
        )}

        {/* 본문 내용 */}
        {news.content && (
          <div className="mb-8">
            <div className="text-base leading-relaxed text-foreground">
              <RichTextEditor
                content={news.content}
                editable={false}
                placeholder=""
              />
            </div>
          </div>
        )}

        {/* 본문의 검색 링크 안내 */}
        <div className="border-t border-border pt-6 mb-8">
          <p className="text-xs text-muted-foreground">
            본문의 검색 링크는 AI 자동 인식으로 제공됩니다. 일부에 대해서는
            미제공될 수 있고 동일한 명칭이 다수 존재하는 경우에는 전체 검색
            결과로 연결될 수 있습니다.
          </p>
        </div>

        {/* 작성자 정보 */}
        {authorProfile && (
          <div className="border-t border-border pt-6 mb-8">
            <div className="flex items-center gap-3">
              {authorProfile.avatar_url ? (
                <img
                  src={authorProfile.avatar_url}
                  alt={authorProfile.name || "작성자"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {authorProfile.name?.[0] || "?"}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {authorProfile.name || "익명"}
                  </span>
                  <span className="text-sm text-muted-foreground">기자</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    구독 0
                  </button>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    응원 0
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 관련 기사 섹션 (추후 구현 가능) */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4">관련 기사</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              관련 기사가 없습니다.
            </p>
          </div>
        </div>
    </div>
  );
}
