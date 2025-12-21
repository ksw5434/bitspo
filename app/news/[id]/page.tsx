"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Share2,
  Bookmark,
  Heart,
  Frown,
  Angry,
  Zap,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/_components/ui/avatar";

// 뉴스 타입 정의
interface NewsDetail {
  id: string;
  headline: string;
  content: string | null;
  image_url: string | null;
  author_id: string | null;
  summary: string | null; // Google AI로 생성된 요약 (캐싱용)
  created_at: string;
  updated_at: string;
}

// 기자 정보 타입
interface Author {
  id: string;
  name: string | null;
  avatar_url: string | null;
  position: string | null;
  bio: string | null;
  affiliation: string | null;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  } | null;
}

// 날짜 포맷 함수
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `입력 ${ampm} ${displayHours}:${displayMinutes} ${year}. ${month}. ${day}.`;
  } catch (error) {
    return "날짜 정보 없음";
  }
}

// 헤드라인에서 코인 태그 추출
function extractCoinTag(headline: string): string {
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
}

// 반응 이모지 타입
type ReactionType = "like" | "sad" | "angry" | "surprised" | "anxious";

// 댓글 타입 정의
interface Comment {
  id: string;
  news_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  // 조인된 사용자 정보
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  // 현재 사용자가 좋아요를 눌렀는지 여부
  user_liked?: boolean;
}

// 댓글 정렬 타입
type CommentSortType = "latest" | "likes";

export default function NewsPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params?.id as string;

  // Supabase 클라이언트를 useMemo로 메모이제이션하여 매 렌더링마다 새로 생성되지 않도록 함
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    like: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    anxious: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [summaryTab, setSummaryTab] = useState<"summary" | "easy">("easy");
  const [pickNews, setPickNews] = useState<any[]>([]);
  const [hashtagNews, setHashtagNews] = useState<any[]>([]);
  const [rankingNews, setRankingNews] = useState<any[]>([]);
  // 반응 처리 중 로딩 상태 (중복 클릭 방지)
  const [isReacting, setIsReacting] = useState(false);
  // 토스트 메시지 상태
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  // 댓글 관련 상태
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSortType, setCommentSortType] =
    useState<CommentSortType>("latest");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    name: string | null;
    avatar_url: string | null;
  } | null>(null);
  // 북마크 관련 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  // 요약 관련 상태
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 뉴스 상세 정보 로드
  useEffect(() => {
    // Supabase 클라이언트가 없으면 실행하지 않음
    if (!supabase) return;

    const loadNewsDetail = async () => {
      if (!newsId) return;

      try {
        // 라우트 전환 시 상태 초기화
        setIsLoading(true);
        setNews(null);
        setAuthor(null);
        setComments([]);
        setReactions({
          like: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          anxious: 0,
        });
        setUserReaction(null);
        setIsBookmarked(false);
        setSummary(null);
        setSummaryError(null);
        setPickNews([]);
        setHashtagNews([]);
        setRankingNews([]);

        // 뉴스 상세 정보 조회 (summary는 선택적으로 조회)
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("id", newsId)
          .single();

        if (newsError) {
          console.error("뉴스 조회 오류:", newsError);
          // 더 자세한 에러 정보 로깅
          console.error("에러 상세:", {
            code: newsError.code,
            message: newsError.message,
            details: newsError.details,
            hint: newsError.hint,
          });
          return;
        }

        if (newsData) {
          setNews(newsData);

          // DB에 저장된 요약이 있으면 바로 설정 (자동 표시)
          // summary 필드가 없을 수도 있으므로 안전하게 처리
          if (newsData.summary && typeof newsData.summary === "string") {
            setSummary(newsData.summary);
          } else {
            // DB에 요약이 없으면 초기화 (버튼 클릭으로 생성 가능)
            setSummary(null);
          }

          // 기자 정보 조회
          if (newsData.author_id) {
            const { data: authorData } = await supabase
              .from("profiles")
              .select(
                "id, name, avatar_url, position, bio, affiliation, social_links"
              )
              .eq("id", newsData.author_id)
              .single();

            if (authorData) {
              setAuthor(authorData);
            }
          }
        }

        // 현재 로그인한 사용자 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 해당 뉴스의 반응 개수 집계 (타입별)
        const reactionTypes: ReactionType[] = [
          "like",
          "sad",
          "angry",
          "surprised",
          "anxious",
        ];

        // 각 반응 타입별로 개수 조회
        const reactionCounts: Record<ReactionType, number> = {
          like: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          anxious: 0,
        };

        // 모든 반응을 한 번에 가져와서 클라이언트에서 집계 (성능 최적화)
        const { data: allReactions, error: reactionsError } = await supabase
          .from("news_reactions")
          .select("reaction_type")
          .eq("news_id", newsId);

        if (!reactionsError && allReactions) {
          // 반응 타입별로 개수 집계
          allReactions.forEach((reaction) => {
            const type = reaction.reaction_type as ReactionType;
            if (reactionCounts.hasOwnProperty(type)) {
              reactionCounts[type]++;
            }
          });
        }

        // 집계된 반응 개수 설정
        setReactions(reactionCounts);

        // 현재 로그인 사용자의 반응 조회 (있다면 userReaction 설정)
        if (user) {
          const { data: userReactionData, error: userReactionError } =
            await supabase
              .from("news_reactions")
              .select("reaction_type")
              .eq("news_id", newsId)
              .eq("user_id", user.id)
              .single();

          if (!userReactionError && userReactionData) {
            setUserReaction(userReactionData.reaction_type as ReactionType);
          } else {
            // 사용자 반응이 없거나 에러인 경우 null로 설정
            setUserReaction(null);
          }

          // 현재 사용자의 북마크 상태 확인
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from("news_bookmarks")
            .select("id")
            .eq("news_id", newsId)
            .eq("user_id", user.id)
            .single();

          if (!bookmarkError && bookmarkData) {
            setIsBookmarked(true);
          } else {
            setIsBookmarked(false);
          }
        } else {
          // 로그인하지 않은 경우 userReaction을 null로 설정
          setUserReaction(null);
          setIsBookmarked(false);
        }

        // 관련 뉴스 로드 (PICK 뉴스)
        const { data: pickData } = await supabase
          .from("news")
          .select("id, headline, image_url, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (pickData) {
          setPickNews(pickData);
        }

        // 해시태그 뉴스 (최근 뉴스 중 일부)
        const { data: hashtagData } = await supabase
          .from("news")
          .select("id, headline, image_url, created_at")
          .order("created_at", { ascending: false })
          .limit(4);

        if (hashtagData) {
          setHashtagNews(hashtagData);
        }

        // 랭킹 뉴스
        const { data: rankingData } = await supabase
          .from("news")
          .select("id, headline, image_url, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (rankingData) {
          setRankingNews(rankingData);
        }
      } catch (error) {
        console.error("뉴스 상세 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNewsDetail();

    // cleanup 함수: 컴포넌트 언마운트 또는 newsId 변경 시 실행
    return () => {
      // 비동기 작업 취소를 위한 플래그는 필요시 추가 가능
    };
  }, [newsId, supabase]);

  // 요약 생성 함수 (버튼 클릭 시 호출)
  const handleSummarize = useCallback(async () => {
    if (!news?.content) {
      showToast("요약할 본문이 없습니다.", "error");
      return;
    }

    try {
      setIsLoadingSummary(true);
      setSummaryError(null);

      // 본문 내용 추출 (문자열 또는 JSONB 처리)
      let contentText = "";
      if (typeof news.content === "string") {
        contentText = news.content;
      } else if (typeof news.content === "object" && news.content !== null) {
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
            extractText(news.content) || JSON.stringify(news.content);
        } catch (e) {
          contentText = JSON.stringify(news.content);
        }
      }

      if (!contentText || contentText.trim() === "") {
        showToast("요약할 본문이 없습니다.", "error");
        return;
      }

      // 요약 API 호출
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `요약을 생성하는데 실패했습니다. (${response.status})`;
        console.error("요약 API 오류:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
        showToast("요약이 생성되었습니다.", "success");
      } else {
        throw new Error("요약 데이터를 받지 못했습니다.");
      }
    } catch (error) {
      console.error("요약 생성 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "요약을 생성하는데 실패했습니다.";
      setSummaryError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [news?.content]);

  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
    // 3초 후 자동으로 토스트 메시지 제거
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 반응 클릭 핸들러
  const handleReaction = async (type: ReactionType) => {
    // 중복 클릭 방지 (로딩 중이면 무시)
    if (isReacting || !supabase) {
      return;
    }

    try {
      setIsReacting(true);

      // 로그인 확인 (비로그인 시 로그인 페이지로 리다이렉트)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user || authError) {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        router.push("/auth/login");
        return;
      }

      // 네트워크 연결 확인
      if (!navigator.onLine) {
        showToast("인터넷 연결을 확인해주세요.", "error");
        return;
      }

      // 기존 반응 확인
      const { data: existingReaction, error: checkError } = await supabase
        .from("news_reactions")
        .select("id, reaction_type")
        .eq("news_id", newsId)
        .eq("user_id", user.id)
        .single();

      // 네트워크 오류 처리
      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116은 "결과가 없음" 오류이므로 정상적인 경우임
        console.error("반응 확인 오류:", checkError);
        showToast(
          "반응을 확인하는데 실패했습니다. 다시 시도해주세요.",
          "error"
        );
        return;
      }

      // 같은 반응 클릭 → 삭제 (DELETE)
      if (
        existingReaction &&
        existingReaction.reaction_type === type &&
        !checkError
      ) {
        const { error: deleteError } = await supabase
          .from("news_reactions")
          .delete()
          .eq("news_id", newsId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("반응 삭제 오류:", deleteError);
          // 네트워크 오류인지 확인
          const errorMessage = deleteError.message || String(deleteError) || "";
          if (
            errorMessage.includes("network") ||
            errorMessage.includes("fetch")
          ) {
            showToast(
              "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
              "error"
            );
          } else {
            showToast(
              "반응을 취소하는데 실패했습니다. 다시 시도해주세요.",
              "error"
            );
          }
          return;
        }

        // 성공 시 로컬 state 업데이트
        setUserReaction(null);
        setReactions((prev) => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1),
        }));

        // 반응 개수 재조회
        await refreshReactions();
        showToast("반응이 취소되었습니다.", "success");
      }
      // 다른 반응 클릭 → 기존 삭제 후 새 반응 생성 (DELETE + INSERT)
      else if (existingReaction && existingReaction.reaction_type !== type) {
        // 기존 반응 삭제
        const { error: deleteError } = await supabase
          .from("news_reactions")
          .delete()
          .eq("news_id", newsId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("기존 반응 삭제 오류:", deleteError);
          // 네트워크 오류인지 확인
          const errorMessage = deleteError.message || String(deleteError) || "";
          if (
            errorMessage.includes("network") ||
            errorMessage.includes("fetch")
          ) {
            showToast(
              "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
              "error"
            );
          } else {
            showToast(
              "반응을 변경하는데 실패했습니다. 다시 시도해주세요.",
              "error"
            );
          }
          return;
        }

        // 새 반응 생성
        const { data: insertData, error: insertError } = await supabase
          .from("news_reactions")
          .insert({
            news_id: newsId,
            user_id: user.id,
            reaction_type: type,
          })
          .select();

        if (insertError) {
          // 에러 객체의 모든 속성을 자세히 로깅
          console.error("반응 생성 오류 상세:", {
            error: insertError,
            errorString: JSON.stringify(insertError, null, 2),
            errorKeys: Object.keys(insertError),
            errorMessage: insertError.message,
            errorCode: insertError.code,
            errorDetails: insertError.details,
            errorHint: insertError.hint,
          });

          // 네트워크 오류인지 확인
          const errorMessage =
            insertError.message ||
            insertError.details ||
            insertError.hint ||
            String(insertError) ||
            "";

          // 에러 코드 확인
          const errorCode = insertError.code || "";

          if (
            errorMessage.includes("network") ||
            errorMessage.includes("fetch") ||
            errorMessage.includes("Failed to fetch")
          ) {
            showToast(
              "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
              "error"
            );
          } else if (
            errorCode === "23505" ||
            errorMessage.includes("duplicate")
          ) {
            // 중복 키 오류
            showToast("이미 반응을 선택하셨습니다.", "error");
          } else if (
            errorMessage.includes("permission") ||
            errorMessage.includes("policy") ||
            errorCode === "42501"
          ) {
            // 권한 오류 (RLS 정책 문제)
            showToast(
              "반응을 추가할 권한이 없습니다. 로그인 상태를 확인해주세요.",
              "error"
            );
          } else if (
            errorMessage.includes("relation") ||
            errorMessage.includes("does not exist") ||
            errorMessage.includes("table")
          ) {
            // 테이블이 존재하지 않는 경우
            console.error(
              "news_reactions 테이블이 존재하지 않습니다. 데이터베이스 스키마를 확인해주세요."
            );
            showToast(
              "데이터베이스 설정 오류가 발생했습니다. 관리자에게 문의해주세요.",
              "error"
            );
          } else {
            // 기타 오류
            showToast(
              `반응을 추가하는데 실패했습니다. ${
                errorMessage || "알 수 없는 오류"
              }`,
              "error"
            );
          }
          return;
        }

        // 삽입 성공 확인
        if (!insertData || insertData.length === 0) {
          console.warn("반응이 삽입되었지만 데이터가 반환되지 않았습니다.");
        }

        // 성공 시 로컬 state 업데이트
        const previousType = existingReaction.reaction_type as ReactionType;
        setUserReaction(type);
        setReactions((prev) => ({
          ...prev,
          [previousType]: Math.max(0, prev[previousType] - 1),
          [type]: prev[type] + 1,
        }));

        // 반응 개수 재조회
        await refreshReactions();
        showToast("반응이 변경되었습니다.", "success");
      }
      // 반응 없음 → 새 반응 생성 (INSERT)
      else {
        const { data: insertData, error: insertError } = await supabase
          .from("news_reactions")
          .insert({
            news_id: newsId,
            user_id: user.id,
            reaction_type: type,
          })
          .select();

        if (insertError) {
          // 에러 객체의 모든 속성을 자세히 로깅
          console.error("반응 생성 오류 상세:", {
            error: insertError,
            errorString: JSON.stringify(insertError, null, 2),
            errorKeys: Object.keys(insertError),
            errorMessage: insertError.message,
            errorCode: insertError.code,
            errorDetails: insertError.details,
            errorHint: insertError.hint,
          });

          // 네트워크 오류인지 확인
          const errorMessage =
            insertError.message ||
            insertError.details ||
            insertError.hint ||
            String(insertError) ||
            "";

          // 에러 코드 확인
          const errorCode = insertError.code || "";

          if (
            errorMessage.includes("network") ||
            errorMessage.includes("fetch") ||
            errorMessage.includes("Failed to fetch")
          ) {
            showToast(
              "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
              "error"
            );
          } else if (
            errorCode === "23505" ||
            errorMessage.includes("duplicate")
          ) {
            // 중복 키 오류
            showToast("이미 반응을 선택하셨습니다.", "error");
          } else if (
            errorMessage.includes("permission") ||
            errorMessage.includes("policy") ||
            errorCode === "42501"
          ) {
            // 권한 오류 (RLS 정책 문제)
            showToast(
              "반응을 추가할 권한이 없습니다. 로그인 상태를 확인해주세요.",
              "error"
            );
          } else if (
            errorMessage.includes("relation") ||
            errorMessage.includes("does not exist") ||
            errorMessage.includes("table")
          ) {
            // 테이블이 존재하지 않는 경우
            console.error(
              "news_reactions 테이블이 존재하지 않습니다. 데이터베이스 스키마를 확인해주세요."
            );
            showToast(
              "데이터베이스 설정 오류가 발생했습니다. 관리자에게 문의해주세요.",
              "error"
            );
          } else {
            // 기타 오류
            showToast(
              `반응을 추가하는데 실패했습니다. ${
                errorMessage || "알 수 없는 오류"
              }`,
              "error"
            );
          }
          return;
        }

        // 삽입 성공 확인
        if (!insertData || insertData.length === 0) {
          console.warn("반응이 삽입되었지만 데이터가 반환되지 않았습니다.");
        }

        // 성공 시 로컬 state 업데이트
        setUserReaction(type);
        setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));

        // 반응 개수 재조회
        await refreshReactions();
        showToast("반응이 추가되었습니다.", "success");
      }
    } catch (error) {
      console.error("반응 처리 중 오류 발생:", error);
      // 예상치 못한 오류 처리
      if (error instanceof Error) {
        const errorMessage = error.message || String(error) || "";
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          showToast(
            "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
            "error"
          );
        } else {
          showToast(
            "반응 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
            "error"
          );
        }
      } else {
        // 에러 객체가 아닌 경우 (빈 객체 등)
        const errorString = String(error) || "알 수 없는 오류";
        if (errorString.includes("network") || errorString.includes("fetch")) {
          showToast(
            "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
            "error"
          );
        } else {
          showToast(
            "반응 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
            "error"
          );
        }
      }
    } finally {
      setIsReacting(false);
    }
  };

  // 반응 개수 재조회 함수 (중복 코드 제거를 위해 별도 함수로 분리)
  const refreshReactions = async () => {
    if (!supabase) return;

    try {
      // 모든 반응을 한 번에 가져와서 클라이언트에서 집계
      const { data: allReactions, error: reactionsError } = await supabase
        .from("news_reactions")
        .select("reaction_type")
        .eq("news_id", newsId);

      if (!reactionsError && allReactions) {
        // 반응 타입별로 개수 집계
        const reactionCounts: Record<ReactionType, number> = {
          like: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          anxious: 0,
        };

        allReactions.forEach((reaction) => {
          const type = reaction.reaction_type as ReactionType;
          if (reactionCounts.hasOwnProperty(type)) {
            reactionCounts[type]++;
          }
        });

        // 집계된 반응 개수 설정
        setReactions(reactionCounts);
      }
    } catch (error) {
      console.error("반응 개수 재조회 오류:", error);
    }
  };

  // 댓글 목록 조회 함수 (useCallback으로 최적화)
  const loadComments = useCallback(async () => {
    if (!newsId || !supabase) return;

    try {
      // 현재 사용자 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);

      // 현재 사용자 프로필 정보 조회
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.warn("현재 사용자 프로필 조회 오류:", profileError);
          // 프로필이 없어도 기본 정보로 설정
          setCurrentUserProfile({
            name: user.email?.split("@")[0] || null,
            avatar_url: null,
          });
        } else if (profileData) {
          setCurrentUserProfile({
            name: profileData.name || user.email?.split("@")[0] || null,
            avatar_url: profileData.avatar_url,
          });
        } else {
          // 프로필 데이터가 없는 경우
          setCurrentUserProfile({
            name: user.email?.split("@")[0] || null,
            avatar_url: null,
          });
        }
      } else {
        setCurrentUserProfile(null);
      }

      // 댓글 조회
      let query = supabase
        .from("news_comments")
        .select("*")
        .eq("news_id", newsId);

      // 정렬 타입에 따라 정렬
      if (commentSortType === "latest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("like_count", { ascending: false });
      }

      const { data: commentsData, error } = await query;

      if (error) {
        // 에러 상세 정보 로깅
        console.error("댓글 조회 오류:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          errorString: JSON.stringify(error, null, 2),
        });

        // 테이블이 존재하지 않는 경우 조용히 처리 (아직 스키마가 생성되지 않았을 수 있음)
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist") ||
          error.message?.includes("relation")
        ) {
          console.warn(
            "news_comments 테이블이 아직 생성되지 않았습니다. 데이터베이스 스키마를 확인해주세요."
          );
          setComments([]);
          return;
        }

        // 기타 에러는 사용자에게 알리지 않고 조용히 처리
        setComments([]);
        return;
      }

      // 댓글이 없으면 빈 배열 설정
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // 사용자 프로필 정보 조회 (별도 쿼리)
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];

      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        if (profilesError) {
          console.warn("프로필 조회 오류 (댓글은 표시됨):", profilesError);
        } else if (profilesData) {
          // 프로필 데이터를 맵으로 변환 (빠른 조회를 위해)
          profilesMap = new Map(profilesData.map((p) => [p.id, p]));
        }
      }

      // 현재 사용자가 좋아요를 눌렀는지 확인
      if (user && commentsData.length > 0) {
        const commentIds = commentsData.map((c) => c.id);
        const { data: likesData, error: likesError } = await supabase
          .from("news_comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in("comment_id", commentIds);

        // 좋아요 조회 에러는 조용히 처리 (테이블이 없을 수 있음)
        if (likesError) {
          console.warn("댓글 좋아요 조회 오류:", likesError);
        }

        const likedCommentIds = new Set(
          likesData?.map((l) => l.comment_id) || []
        );

        // 댓글에 프로필 정보와 user_liked 속성 추가
        const commentsWithProfiles = commentsData.map((comment) => {
          const profile = profilesMap.get(comment.user_id);
          return {
            ...comment,
            profiles: profile
              ? {
                  id: profile.id,
                  email: "", // profiles 테이블에는 email이 없음
                  full_name: profile.name || null,
                  avatar_url: profile.avatar_url,
                }
              : {
                  id: comment.user_id,
                  email: "",
                  full_name: null,
                  avatar_url: null,
                },
            user_liked: likedCommentIds.has(comment.id),
          };
        });

        setComments(commentsWithProfiles);
      } else {
        // 로그인하지 않은 경우에도 프로필 정보 추가
        const commentsWithProfiles = commentsData.map((comment) => {
          const profile = profilesMap.get(comment.user_id);
          return {
            ...comment,
            profiles: profile
              ? {
                  id: profile.id,
                  email: "", // profiles 테이블에는 email이 없음
                  full_name: profile.name || null,
                  avatar_url: profile.avatar_url,
                }
              : {
                  id: comment.user_id,
                  email: "",
                  full_name: null,
                  avatar_url: null,
                },
            user_liked: false,
          };
        });

        setComments(commentsWithProfiles);
      }
    } catch (error) {
      console.error("댓글 로드 오류:", error);
    }
  }, [newsId, supabase, commentSortType]);

  // 댓글 로드 (별도 useEffect로 분리)
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // 댓글 작성 함수
  const handleSubmitComment = async () => {
    if (!supabase) return;

    // 로그인 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // 댓글 내용 검증
    const trimmedContent = commentText.trim();
    if (!trimmedContent || trimmedContent.length === 0) {
      showToast("댓글 내용을 입력해주세요.", "error");
      return;
    }

    if (trimmedContent.length > 1000) {
      showToast("댓글은 1000자 이하로 작성해주세요.", "error");
      return;
    }

    try {
      setIsSubmittingComment(true);

      // 댓글 삽입
      const { data: newComment, error } = await supabase
        .from("news_comments")
        .insert({
          news_id: newsId,
          user_id: user.id,
          content: trimmedContent,
        })
        .select("*")
        .single();

      if (error) {
        console.error("댓글 작성 오류:", error);
        showToast("댓글 작성에 실패했습니다.", "error");
        return;
      }

      // 성공 시 프로필 정보 조회
      if (newComment) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.warn("프로필 조회 오류 (댓글은 표시됨):", profileError);
        }

        const commentWithProfile = {
          ...newComment,
          profiles: profileData
            ? {
                id: profileData.id,
                email: user.email || "", // auth.users에서 가져온 email 사용
                full_name:
                  profileData.name || user.email?.split("@")[0] || null,
                avatar_url: profileData.avatar_url,
              }
            : {
                id: user.id,
                email: user.email || "",
                full_name: user.email?.split("@")[0] || null,
                avatar_url: null,
              },
          user_liked: false,
        };

        setComments((prev) => [commentWithProfile, ...prev]);
        setCommentText("");
        showToast("댓글이 작성되었습니다.", "success");
      }
    } catch (error) {
      console.error("댓글 작성 중 오류:", error);
      showToast("댓글 작성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 삭제 함수
  const handleDeleteComment = async (commentId: string) => {
    if (!supabase || !confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("news_comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("댓글 삭제 오류:", error);
        showToast("댓글 삭제에 실패했습니다.", "error");
        return;
      }

      // 성공 시 댓글 목록에서 제거
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      showToast("댓글이 삭제되었습니다.", "success");
    } catch (error) {
      console.error("댓글 삭제 중 오류:", error);
      showToast("댓글 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 댓글 좋아요 토글 함수
  const handleToggleCommentLike = async (commentId: string) => {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const isLiked = comment.user_liked;

      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from("news_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) {
          console.error("좋아요 취소 오류:", error);
          return;
        }

        // 로컬 상태 업데이트
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  like_count: Math.max(0, c.like_count - 1),
                  user_liked: false,
                }
              : c
          )
        );
      } else {
        // 좋아요 추가
        const { error } = await supabase.from("news_comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });

        if (error) {
          console.error("좋아요 추가 오류:", error);
          return;
        }

        // 로컬 상태 업데이트
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, like_count: c.like_count + 1, user_liked: true }
              : c
          )
        );
      }
    } catch (error) {
      console.error("좋아요 처리 중 오류:", error);
    }
  };

  // 댓글 정렬 변경 함수
  const handleSortChange = (sortType: CommentSortType) => {
    setCommentSortType(sortType);
    // 정렬 변경 시 댓글 다시 로드
    loadComments();
  };

  // 공유 기능 핸들러
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/news/${newsId}`;
    const shareTitle = news?.headline || "뉴스 기사";
    const shareText = news?.headline || "이 뉴스를 확인해보세요!";

    try {
      // 웹 공유 API 지원 여부 확인
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        showToast("공유되었습니다.", "success");
      } else {
        // 웹 공유 API를 지원하지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);
        showToast("링크가 클립보드에 복사되었습니다.", "success");
      }
    } catch (error: any) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if (error.name !== "AbortError") {
        console.error("공유 오류:", error);
        // 클립보드 복사로 대체 시도
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast("링크가 클립보드에 복사되었습니다.", "success");
        } catch (clipboardError) {
          showToast("공유에 실패했습니다. 다시 시도해주세요.", "error");
        }
      }
    }
  };

  // 북마크 토글 핸들러
  const handleToggleBookmark = async () => {
    if (!supabase) return;

    // 로그인 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // 중복 클릭 방지
    if (isBookmarking) {
      return;
    }

    try {
      setIsBookmarking(true);

      if (isBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from("news_bookmarks")
          .delete()
          .eq("news_id", newsId)
          .eq("user_id", user.id);

        if (error) {
          console.error("북마크 삭제 오류:", error);
          showToast("북마크 삭제에 실패했습니다.", "error");
          return;
        }

        setIsBookmarked(false);
        showToast("북마크가 해제되었습니다.", "success");
      } else {
        // 북마크 추가
        const { error } = await supabase.from("news_bookmarks").insert({
          news_id: newsId,
          user_id: user.id,
        });

        if (error) {
          console.error("북마크 추가 오류:", error);
          // 중복 키 오류는 이미 북마크된 것으로 처리
          if (error.code === "23505") {
            setIsBookmarked(true);
            showToast("이미 북마크된 기사입니다.", "success");
          } else {
            showToast("북마크 추가에 실패했습니다.", "error");
          }
          return;
        }

        setIsBookmarked(true);
        showToast("북마크에 추가되었습니다.", "success");
      }
    } catch (error) {
      console.error("북마크 처리 중 오류:", error);
      showToast("북마크 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBookmarking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <div className="text-muted-foreground">뉴스를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <div className="text-muted-foreground">
              뉴스를 찾을 수 없습니다.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coinTag = extractCoinTag(news.headline);

  return (
    <div className="bg-muted py-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 영역 (왼쪽 2/3) */}
          <div className="lg:col-span-2 bg-card rounded-lg p-6">
            {/* 카테고리 */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                ✔ PICK 뉴스
              </span>
            </div>

            {/* 제목 */}
            <h1 className="text-3xl font-bold mb-6 leading-tight">
              {news.headline}
            </h1>

            {/* 메타데이터 */}
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span>{formatDate(news.created_at)}</span>
              <span>기사출처</span>
              {author && (
                <span className="font-medium text-foreground">
                  {author.name || "기자"}{" "}
                  {author.position ? `· ${author.position}` : ""}
                </span>
              )}
            </div>

            {/* 공유/북마크 아이콘 */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleShare}
                title="공유하기"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${isBookmarked ? "text-primary" : ""}`}
                onClick={handleToggleBookmark}
                disabled={isBookmarking}
                title={isBookmarked ? "북마크 해제" : "북마크 추가"}
              >
                <Bookmark
                  className={`h-4 w-4 transition-all ${
                    isBookmarked ? "fill-primary" : ""
                  } ${isBookmarking ? "animate-pulse" : ""}`}
                />
              </Button>
            </div>

            {/* 요약 섹션 */}
            <div className="mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <Tabs
                value={summaryTab}
                onValueChange={(v) => setSummaryTab(v as "summary" | "easy")}
              >
                <TabsList className="bg-transparent mb-4 h-auto p-0 gap-0">
                  <TabsTrigger
                    value="summary"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-gray-400 rounded-none px-4 py-2"
                  >
                    요약
                  </TabsTrigger>
                  <TabsTrigger
                    value="easy"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-4 py-2"
                  >
                    쉬운해석
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded">
                      new
                    </span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-0">
                  <div className="space-y-4">
                    {/* 요약 버튼 (요약이 없을 때만 표시) */}
                    {!summary && !isLoadingSummary && (
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          onClick={handleSummarize}
                          disabled={isLoadingSummary || !news?.content}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          게시글 요약
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          버튼을 클릭하여 AI 요약을 생성하세요
                        </p>
                      </div>
                    )}

                    {/* 로딩 상태 */}
                    {isLoadingSummary && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span>요약을 생성하는 중...</span>
                      </div>
                    )}

                    {/* 에러 상태 */}
                    {summaryError && !isLoadingSummary && (
                      <div className="text-sm text-red-500">
                        <p>{summaryError}</p>
                        <button
                          onClick={handleSummarize}
                          className="mt-2 text-xs underline hover:no-underline"
                        >
                          다시 시도
                        </button>
                      </div>
                    )}

                    {/* 요약 결과 */}
                    {summary && !isLoadingSummary && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                        <h3 className="font-bold mb-2 text-sm">요약:</h3>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {summary}
                        </p>
                        {/* 요약 재생성 버튼 */}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSummarize}
                            disabled={isLoadingSummary}
                            className="text-xs"
                          >
                            다시 요약하기
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="easy" className="mt-0">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      {news.headline.includes("XRP") ||
                      news.headline.includes("리플")
                        ? "XRP는 ETF 상장 호재에도 불구하고 고래들의 매도세로 인해 지지부진한 모습을 보이고 있습니다. 계속되는 공급량 증가로 인해 가격이 $1.50-$1.66까지 하락할 수 있습니다."
                        : news.content
                        ? news.content.length > 300
                          ? `${news.content.substring(0, 300)}...`
                          : news.content
                        : "쉬운 해석 정보가 없습니다."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      ①STAT AI 유의사항
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* 차트 이미지 (있는 경우) */}
            {news.image_url && (
              <div className="mb-8">
                <img
                  src={news.image_url}
                  alt={news.headline}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  사진=크립토퀸트 갈무리
                </p>
              </div>
            )}

            {/* 본문 */}
            <div className="mb-8 prose prose-sm max-w-none">
              <div
                className="text-base leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html:
                    news.content?.replace(/\n/g, "<br />") ||
                    "본문 내용이 없습니다.",
                }}
              />
            </div>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                #ETF
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                #분석
              </span>
              <span className="px-4 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                {coinTag}
              </span>
            </div>

            {/* 기자 정보 */}
            {author && (
              <div className="mb-8 pb-8 border-b">
                <div className="flex items-start gap-4">
                  {/* 아바타 */}
                  {author.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={author.name || "기자"}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {(author.name || "기자")[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* 기자 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-lg">
                        {author.name || "기자"}
                        {author.position && (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            {author.position}
                          </span>
                        )}
                      </p>
                    </div>

                    {author.affiliation && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {author.affiliation}
                      </p>
                    )}

                    {author.bio && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {author.bio}
                      </p>
                    )}

                    {/* SNS 링크 */}
                    {author.social_links && (
                      <div className="flex gap-3 mt-3">
                        {author.social_links.twitter && (
                          <a
                            href={author.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Twitter
                          </a>
                        )}
                        {author.social_links.linkedin && (
                          <a
                            href={author.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                        {author.social_links.github && (
                          <a
                            href={author.social_links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 사용자 상호작용 */}
            <div className="mb-8">
              <p className="text-sm font-medium mb-4">
                뉴스에 대한 의견과 질문을 자유롭게 남겨보세요!
              </p>
              <Button variant="outline" className="mb-6">
                이 뉴스로 커뮤니티 글쓰기
              </Button>

              {/* 반응 이모지 */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">
                  방금 읽은 기사 어떠셨나요?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReaction("like")}
                    disabled={isReacting}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                      userReaction === "like"
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    } ${
                      isReacting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <Heart
                      className={`h-6 w-6 transition-all ${
                        userReaction === "like"
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      } ${isReacting ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs">좋아요</span>
                    <span className="text-xs font-medium">
                      {reactions.like}
                    </span>
                  </button>
                  <button
                    onClick={() => handleReaction("sad")}
                    disabled={isReacting}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                      userReaction === "sad"
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    } ${
                      isReacting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <Frown
                      className={`h-6 w-6 transition-all ${
                        userReaction === "sad"
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      } ${isReacting ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs">슬퍼요</span>
                    <span className="text-xs font-medium">{reactions.sad}</span>
                  </button>
                  <button
                    onClick={() => handleReaction("angry")}
                    disabled={isReacting}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                      userReaction === "angry"
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    } ${
                      isReacting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <Angry
                      className={`h-6 w-6 transition-all ${
                        userReaction === "angry"
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      } ${isReacting ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs">화나요</span>
                    <span className="text-xs font-medium">
                      {reactions.angry}
                    </span>
                  </button>
                  <button
                    onClick={() => handleReaction("surprised")}
                    disabled={isReacting}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                      userReaction === "surprised"
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    } ${
                      isReacting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <Zap
                      className={`h-6 w-6 transition-all ${
                        userReaction === "surprised"
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      } ${isReacting ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs">놀랐어요</span>
                    <span className="text-xs font-medium">
                      {reactions.surprised}
                    </span>
                  </button>
                  <button
                    onClick={() => handleReaction("anxious")}
                    disabled={isReacting}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                      userReaction === "anxious"
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    } ${
                      isReacting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <AlertCircle
                      className={`h-6 w-6 transition-all ${
                        userReaction === "anxious"
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      } ${isReacting ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs">불안해요</span>
                    <span className="text-xs font-medium">
                      {reactions.anxious}
                    </span>
                  </button>
                </div>
              </div>

              {/* 토스트 메시지 */}
              {toastMessage && (
                <div
                  className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all animate-in slide-in-from-bottom-5 ${
                    toastMessage.type === "success"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {toastMessage.message}
                    </span>
                    <button
                      onClick={() => setToastMessage(null)}
                      className="ml-2 text-white/80 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* 댓글 섹션 */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      댓글 {comments.length}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          commentSortType === "likes" ? "default" : "ghost"
                        }
                        size="sm"
                        className="h-8"
                        onClick={() => handleSortChange("likes")}
                      >
                        공감순
                      </Button>
                      <Button
                        variant={
                          commentSortType === "latest" ? "default" : "ghost"
                        }
                        size="sm"
                        className="h-8"
                        onClick={() => handleSortChange("latest")}
                      >
                        최신순
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 댓글 작성 영역 */}
                {currentUser ? (
                  <div className="mb-4">
                    <div className="flex gap-3">
                      {/* 현재 로그인한 사용자 아바타 */}
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {currentUserProfile?.avatar_url &&
                        currentUserProfile.avatar_url.trim() !== "" ? (
                          <AvatarImage
                            src={currentUserProfile.avatar_url}
                            alt={currentUserProfile.name || "사용자"}
                            onError={(e) => {
                              // 이미지 로드 실패 시 fallback 표시
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : null}
                        <AvatarFallback>
                          {currentUserProfile?.name?.[0]?.toUpperCase() ||
                            currentUser.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Textarea
                        placeholder="댓글을 남겨보세요"
                        className="min-h-[100px] flex-1"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={isSubmittingComment}
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleSubmitComment}
                        disabled={isSubmittingComment || !commentText.trim()}
                        size="sm"
                      >
                        {isSubmittingComment ? "작성 중..." : "댓글 작성"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <Textarea
                      placeholder="로그인 후 댓글을 남겨보세요"
                      className="min-h-[100px] cursor-pointer"
                      disabled
                      onClick={() => router.push("/auth/login")}
                    />
                  </div>
                )}

                {/* 댓글 목록 */}
                {comments.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        아직 댓글이 없습니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-b pb-4 last:border-b-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              {comment.profiles?.avatar_url &&
                              comment.profiles.avatar_url.trim() !== "" ? (
                                <AvatarImage
                                  src={comment.profiles.avatar_url}
                                  alt={comment.profiles.full_name || "사용자"}
                                  onError={(e) => {
                                    // 이미지 로드 실패 시 fallback 표시
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              ) : null}
                              <AvatarFallback>
                                {(comment.profiles?.full_name || "U")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {comment.profiles?.full_name || "익명"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </p>
                            </div>
                          </div>
                          {currentUser?.id === comment.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              삭제
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleToggleCommentLike(comment.id)}
                          >
                            <Heart
                              className={`h-4 w-4 mr-1 ${
                                comment.user_liked
                                  ? "text-primary fill-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            공감 {comment.like_count}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 (오른쪽 1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* PICK 뉴스 */}
            <Card className="bg-card">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">✔ PICK 뉴스</h3>
                <div className="space-y-4">
                  {pickNews.map((item, index) => (
                    <Link key={item.id} href={`/news/${item.id}`}>
                      <div className="flex gap-3 cursor-pointer hover:opacity-70 transition-opacity">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 mb-1">
                            {item.headline}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.created_at).split(" ")[1]}
                          </p>
                        </div>
                        {item.image_url && (
                          <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.headline}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">1 / 2</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 해시태그 뉴스 */}
            <Card className="bg-card">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">해시태그 뉴스</h3>
                <div className="space-y-3">
                  {hashtagNews.slice(0, 4).map((item) => (
                    <Link key={item.id} href={`/news/${item.id}`}>
                      <div className="flex gap-3 cursor-pointer hover:opacity-70 transition-opacity">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              AVA
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                              BlackRock
                            </span>
                          </div>
                          <p className="text-sm font-medium line-clamp-2">
                            {item.headline}
                          </p>
                        </div>
                        {item.image_url && (
                          <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                            <img
                              src={item.image_url}
                              alt={item.headline}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 랭킹뉴스 */}
            <Card className="bg-card">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">랭킹뉴스</h3>
                <div className="space-y-3">
                  {rankingNews.map((item, index) => (
                    <Link key={item.id} href={`/news/${item.id}`}>
                      <div className="flex items-start gap-3 cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                              PICK
                            </span>
                          </div>
                          <p className="text-sm font-medium line-clamp-2 mb-1">
                            {item.headline}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.created_at).split(" ")[1]}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">1 / 4</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
