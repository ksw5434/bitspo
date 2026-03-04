"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Share2,
  Bookmark,
  ThumbsUp,
  MessageSquare,
  Eye,
  Clock,
  ChevronLeft,
  Heart,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/_components/ui/avatar";

// 게시글 타입 정의
interface Post {
  id: string; // UUID
  title: string;
  content: string;
  user_id: string;
  author?: string;
  authorAvatar?: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// 댓글 타입 정의
interface Comment {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  user_liked?: boolean;
}

// 댓글 정렬 타입
type CommentSortType = "latest" | "likes";

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
    return `${year}. ${month}. ${day}. ${ampm} ${displayHours}:${displayMinutes}`;
  } catch (error) {
    return "날짜 정보 없음";
  }
}

// 날짜만 포맷하는 함수 (시간 제외)
function formatDateOnly(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
  } catch (error) {
    return "날짜 정보 없음";
  }
}

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  // Supabase 클라이언트를 useMemo로 메모이제이션하여 매 렌더링마다 새로 생성되지 않도록 함
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

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

  // 토스트 메시지 상태
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 관련 게시글 상태
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  // 작성자 여부 확인
  const [isAuthor, setIsAuthor] = useState(false);
  // 관리자 여부 (관리자는 타인 게시글도 수정/삭제 가능)
  const [isAdmin, setIsAdmin] = useState(false);
  // 삭제 확인 다이얼로그
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // 작성자 통계 정보
  const [authorStats, setAuthorStats] = useState<{
    postCount: number;
    commentCount: number;
  } | null>(null);
  // 작성자 프로필 정보
  const [authorProfile, setAuthorProfile] = useState<{
    name: string | null;
    avatar_url: string | null;
  } | null>(null);
  // 작성자가 작성한 다른 게시글 목록
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  // 작성자가 작성한 댓글 목록
  const [authorComments, setAuthorComments] = useState<Comment[]>([]);

  // 게시글 로드
  useEffect(() => {
    // Supabase 클라이언트가 없으면 실행하지 않음
    if (!supabase) return;

    const loadPost = async () => {
      if (!postId) return;

      try {
        // 라우트 전환 시 상태 초기화
        setIsLoading(true);
        setPost(null);
        setComments([]);
        setIsLiked(false);
        setIsBookmarked(false);
        setLikeCount(0);
        setIsAuthor(false);
        setAuthorProfile(null);
        setAuthorStats(null);
        setAuthorPosts([]);
        setAuthorComments([]);
        setRelatedPosts([]);

        // 실제 데이터베이스에서 게시글 조회 (profiles join 제거)
        const { data: postData, error: postError } = await supabase
          .from("communities")
          .select("*")
          .eq("id", postId)
          .single();

        if (postError || !postData) {
          console.error("게시글 조회 오류:", {
            message: postError?.message,
            details: postError?.details,
            hint: postError?.hint,
            code: postError?.code,
          });
          router.push("/community");
          return;
        }

        // 작성자 프로필 정보 별도 조회
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", postData.user_id)
          .single();

        // 작성자 프로필 정보 저장
        if (profileData) {
          setAuthorProfile({
            name: profileData.name,
            avatar_url:
              profileData.avatar_url && profileData.avatar_url.trim() !== ""
                ? profileData.avatar_url
                : null,
          });
        } else {
          setAuthorProfile({
            name: null,
            avatar_url: null,
          });
        }

        if (profileError) {
          console.warn("작성자 프로필 조회 오류:", profileError);
        }

        // 작성자 통계 정보 조회 (게시글 수, 댓글 수)
        const [postCountResult, commentCountResult] = await Promise.all([
          supabase
            .from("communities")
            .select("*", { count: "exact", head: true })
            .eq("user_id", postData.user_id),
          supabase
            .from("community_comments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", postData.user_id),
        ]);

        // 통계 정보 저장 (에러 발생 시 0으로 설정)
        setAuthorStats({
          postCount: postCountResult.count ?? 0,
          commentCount: commentCountResult.count ?? 0,
        });

        if (postCountResult.error) {
          console.warn("작성자 게시글 수 조회 오류:", postCountResult.error);
        }
        if (commentCountResult.error) {
          console.warn("작성자 댓글 수 조회 오류:", commentCountResult.error);
        }

        // 조회수 증가 (비동기로 처리, 에러 무시)
        (async () => {
          try {
            await supabase
              .from("communities")
              .update({ views: (postData.views || 0) + 1 })
              .eq("id", postId);
          } catch {
            // 조회수 증가 실패는 무시
          }
        })();

        // 현재 로그인한 사용자 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUser(user);

        // 작성자 여부 확인
        if (user && postData.user_id === user.id) {
          setIsAuthor(true);
        }

        // 관리자 여부 확인
        if (user) {
          const { data: adminProfile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();
          setIsAdmin(!!adminProfile?.is_admin);
        }

        // 게시글 데이터 변환
        const post: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          user_id: postData.user_id,
          author: profileData?.name || "익명",
          authorAvatar: profileData?.avatar_url || undefined,
          timestamp: postData.created_at,
          views: postData.views || 0,
          likes: postData.like_count || 0,
          comments: postData.comment_count || 0,
          tags: postData.tags || [],
          category: postData.category || undefined,
          image_url: postData.image_url || undefined,
          created_at: postData.created_at,
          updated_at: postData.updated_at,
        };

        setPost(post);
        setLikeCount(post.likes);

        // 좋아요 및 북마크 상태 확인
        if (user) {
          // 좋아요 상태 확인 (maybeSingle 사용 - 데이터가 없어도 에러 발생 안 함)
          const { data: likeData, error: likeError } = await supabase
            .from("community_likes")
            .select("id")
            .eq("community_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();

          // 에러가 발생해도 조용히 처리 (테이블이 없을 수 있음)
          if (likeError && likeError.code !== "PGRST116") {
            console.warn("좋아요 상태 조회 오류:", likeError);
          }

          setIsLiked(!!likeData);

          // 북마크 상태 확인 (maybeSingle 사용 - 데이터가 없어도 에러 발생 안 함)
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from("community_bookmarks")
            .select("id")
            .eq("community_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();

          // 에러가 발생해도 조용히 처리 (테이블이 없을 수 있음)
          if (bookmarkError && bookmarkError.code !== "PGRST116") {
            console.warn("북마크 상태 조회 오류:", bookmarkError);
          }

          setIsBookmarked(!!bookmarkData);
        }

        // 작성자가 작성한 다른 게시글 목록 로드 (현재 게시글 제외)
        const { data: authorPostsData } = await supabase
          .from("communities")
          .select(
            "id, title, content, image_url, like_count, comment_count, views, created_at, user_id, tags, category"
          )
          .eq("user_id", postData.user_id)
          .neq("id", postId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (authorPostsData && authorPostsData.length > 0) {
          const authorPostsList = authorPostsData.map((item) => {
            return {
              id: item.id,
              title: item.title,
              content: item.content.substring(0, 150) + "...",
              user_id: item.user_id,
              author: profileData?.name || "익명",
              authorAvatar: profileData?.avatar_url || undefined,
              timestamp: item.created_at,
              views: item.views || 0,
              likes: item.like_count || 0,
              comments: item.comment_count || 0,
              tags: item.tags || [],
              category: item.category || undefined,
              image_url: item.image_url || undefined,
              created_at: item.created_at,
              updated_at: item.created_at,
            };
          }) as Post[];
          setAuthorPosts(authorPostsList);
        } else {
          setAuthorPosts([]);
        }

        // 작성자가 작성한 댓글 목록 로드
        const { data: authorCommentsData, error: authorCommentsError } =
          await supabase
            .from("community_comments")
            .select("*, communities(id, title)")
            .eq("user_id", postData.user_id)
            .order("created_at", { ascending: false })
            .limit(5);

        if (authorCommentsError) {
          console.warn("작성자 댓글 조회 오류:", authorCommentsError);
          setAuthorComments([]);
        } else if (authorCommentsData && authorCommentsData.length > 0) {
          // 댓글에 프로필 정보 추가
          const commentsWithProfiles = authorCommentsData.map((comment) => {
            return {
              ...comment,
              profiles: profileData
                ? {
                    id: postData.user_id,
                    email: "",
                    full_name: profileData.name,
                    avatar_url: profileData.avatar_url,
                  }
                : null,
              user_liked: false,
            };
          }) as Comment[];
          setAuthorComments(commentsWithProfiles);
        } else {
          setAuthorComments([]);
        }

        // 관련 게시글 로드 (같은 카테고리 또는 태그)
        const { data: relatedData } = await supabase
          .from("communities")
          .select(
            "id, title, content, image_url, like_count, comment_count, created_at, user_id"
          )
          .neq("id", postId)
          .order("created_at", { ascending: false })
          .limit(3);

        if (relatedData && relatedData.length > 0) {
          // 관련 게시글 작성자들의 user_id 수집
          const relatedUserIds = [
            ...new Set(relatedData.map((item) => item.user_id)),
          ];

          // profiles 정보 한 번에 조회
          const { data: relatedProfilesData } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .in("id", relatedUserIds);

          // profiles를 Map으로 변환
          const relatedProfilesMap = new Map<
            string,
            { name: string | null; avatar_url: string | null }
          >();
          if (relatedProfilesData) {
            relatedProfilesData.forEach((profile) => {
              relatedProfilesMap.set(profile.id, {
                name: profile.name,
                avatar_url: profile.avatar_url,
              });
            });
          }

          const related = relatedData.map((item) => {
            const profile = relatedProfilesMap.get(item.user_id);
            return {
              id: item.id,
              title: item.title,
              content: item.content.substring(0, 100) + "...",
              user_id: item.user_id,
              author: profile?.name || "익명",
              authorAvatar: profile?.avatar_url || undefined,
              timestamp: item.created_at,
              views: 0,
              likes: item.like_count || 0,
              comments: item.comment_count || 0,
              tags: [],
              category: undefined,
              image_url: item.image_url || undefined,
              created_at: item.created_at,
              updated_at: item.created_at,
            };
          }) as Post[];
          setRelatedPosts(related);
        }
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        showToast("게시글을 불러오는데 실패했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();

    // cleanup 함수: 컴포넌트 언마운트 또는 postId 변경 시 실행
    return () => {
      // 비동기 작업 취소를 위한 플래그는 필요시 추가 가능
    };
  }, [postId, supabase]);

  // 댓글 로드 함수
  const loadComments = useCallback(async () => {
    if (!postId || !supabase) return;

    try {
      // 현재 사용자 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);

      // 현재 사용자 프로필 정보 조회
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setCurrentUserProfile({
            name: profileData.name,
            avatar_url: profileData.avatar_url,
          });
        }
      }

      // 실제 데이터베이스에서 댓글 조회 (profiles join 제거)
      let query = supabase
        .from("community_comments")
        .select("*")
        .eq("community_id", postId);

      // 정렬 타입에 따라 정렬
      if (commentSortType === "latest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("like_count", { ascending: false });
      }

      const { data: commentsData, error } = await query;

      // 에러 처리 개선
      if (error) {
        // 테이블이 존재하지 않는 경우 조용히 처리
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist") ||
          error.message?.includes("relation") ||
          error.message?.includes("table")
        ) {
          console.warn(
            "community_comments 테이블이 아직 생성되지 않았습니다. 데이터베이스 스키마를 확인해주세요."
          );
          setComments([]);
          return;
        }

        // 기타 에러는 상세 정보와 함께 로깅
        console.error("댓글 조회 오류:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        setComments([]);
        return;
      }

      // 데이터가 없는 경우 빈 배열 설정
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // 댓글 작성자들의 user_id 수집
      const commentUserIds = [...new Set(commentsData.map((c) => c.user_id))];

      // profiles 정보 한 번에 조회
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", commentUserIds);

      // profiles를 Map으로 변환
      const profilesMap = new Map<
        string,
        { name: string | null; avatar_url: string | null }
      >();
      if (profilesData) {
        profilesData.forEach((profile) => {
          profilesMap.set(profile.id, {
            name: profile.name,
            avatar_url: profile.avatar_url,
          });
        });
      }

      // 현재 사용자가 좋아요를 눌렀는지 확인
      if (user && commentsData.length > 0) {
        const commentIds = commentsData.map((c) => c.id);

        // 좋아요 조회 (에러 발생 시 조용히 처리)
        const { data: likesData, error: likesError } = await supabase
          .from("community_comment_likes")
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
                  id: comment.user_id,
                  email: "", // 필요시 추가 조회
                  full_name: profile.name,
                  avatar_url: profile.avatar_url,
                }
              : null,
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
                  id: comment.user_id,
                  email: "",
                  full_name: profile.name,
                  avatar_url: profile.avatar_url,
                }
              : null,
            user_liked: false,
          };
        });

        setComments(commentsWithProfiles);
      }
    } catch (error) {
      // 예상치 못한 에러 처리
      console.error("댓글 로드 중 예외 발생:", error);
      setComments([]);
    }
  }, [postId, commentSortType, supabase]);

  // 댓글 로드
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // 좋아요 처리
  const handleLike = async () => {
    if (isLiking || !supabase) return;

    try {
      setIsLiking(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from("community_likes")
          .delete()
          .eq("community_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        showToast("좋아요를 취소했습니다.", "success");
      } else {
        // 좋아요 추가
        const { error } = await supabase.from("community_likes").insert({
          community_id: postId,
          user_id: user.id,
        });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        showToast("좋아요를 눌렀습니다.", "success");
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      showToast("좋아요 처리에 실패했습니다.", "error");
    } finally {
      setIsLiking(false);
    }
  };

  // 북마크 처리
  const handleBookmark = async () => {
    if (isBookmarking || !supabase) return;

    try {
      setIsBookmarking(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      if (isBookmarked) {
        // 북마크 해제
        const { error } = await supabase
          .from("community_bookmarks")
          .delete()
          .eq("community_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        setIsBookmarked(false);
        showToast("북마크를 해제했습니다.", "success");
      } else {
        // 북마크 추가
        const { error } = await supabase.from("community_bookmarks").insert({
          community_id: postId,
          user_id: user.id,
        });

        if (error) throw error;

        setIsBookmarked(true);
        showToast("북마크에 추가했습니다.", "success");
      }
    } catch (error) {
      console.error("북마크 처리 오류:", error);
      showToast("북마크 처리에 실패했습니다.", "error");
    } finally {
      setIsBookmarking(false);
    }
  };

  // 공유 처리
  const handleShare = async () => {
    try {
      if (navigator.share && post) {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100),
          url: window.location.href,
        });
      } else {
        // 공유 API를 지원하지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        showToast("링크가 클립보드에 복사되었습니다.", "success");
      }
    } catch (error) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("공유 오류:", error);
        showToast("공유에 실패했습니다.", "error");
      }
    }
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

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

      // 실제 데이터베이스에 댓글 저장
      const { data: newComment, error } = await supabase
        .from("community_comments")
        .insert({
          community_id: postId,
          user_id: user.id,
          content: trimmedContent,
        })
        .select("*")
        .single();

      if (error) throw error;

      if (newComment) {
        // 작성자 프로필 정보 조회
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", user.id)
          .single();

        // 댓글 목록에 추가
        const comment: Comment = {
          ...newComment,
          profiles: profileData
            ? {
                id: user.id,
                email: "",
                full_name: profileData.name,
                avatar_url: profileData.avatar_url,
              }
            : null,
          user_liked: false,
        };

        setComments((prev) => [comment, ...prev]);
        setCommentText("");
        showToast("댓글이 작성되었습니다.", "success");

        // 댓글 개수 업데이트 (로컬 상태)
        if (post) {
          setPost({
            ...post,
            comments: post.comments + 1,
          });
        }
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      showToast("댓글 작성에 실패했습니다.", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 좋아요 처리
  const handleCommentLike = async (commentId: string) => {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.user_liked;

    try {
      if (wasLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from("community_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from("community_comment_likes")
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // 로컬 상태 업데이트
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              user_liked: !wasLiked,
              like_count: wasLiked ? c.like_count - 1 : c.like_count + 1,
            };
          }
          return c;
        })
      );
    } catch (error) {
      console.error("댓글 좋아요 처리 오류:", error);
      showToast("좋아요 처리에 실패했습니다.", "error");
    }
  };

  // 게시글 수정
  const handleEdit = () => {
    router.push(`/community/${postId}/edit`);
  };

  // 게시글 삭제 (작성자: Supabase 직접, 관리자: API 사용)
  const handleDelete = async () => {
    if (!post) return;

    try {
      setIsDeleting(true);

      if (isAdmin) {
        // 관리자는 API로 삭제 (타인 게시글도 삭제 가능)
        const response = await fetch(
          `/dashboard/community/api/${postId}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "삭제에 실패했습니다.");
        }
      } else if (supabase && currentUser) {
        // 작성자는 본인 게시글만 Supabase로 삭제
        const { error } = await supabase
          .from("communities")
          .delete()
          .eq("id", postId)
          .eq("user_id", currentUser.id);

        if (error) throw error;
      } else {
        throw new Error("삭제 권한이 없습니다.");
      }

      showToast("게시글이 삭제되었습니다.", "success");
      setTimeout(() => {
        router.push("/community");
      }, 1000);
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      showToast(
        error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.",
        "error"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 토스트 메시지 표시
  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

  if (!post) {
    return (
      <div className="bg-muted py-4 min-h-screen">
        <div className="container mx-auto">
          <div className="bg-card rounded-lg p-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                게시글을 찾을 수 없습니다.
              </p>
              <Button asChild>
                <Link href="/community">커뮤니티로 돌아가기</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted py-4 min-h-screen">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 메인 콘텐츠 영역 (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* 뒤로가기 버튼 */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>

            {/* 게시글 카드 */}
            <Card className="bg-card">
              <CardContent className="p-6 space-y-6">
                {/* 작성자 정보 */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={post.authorAvatar}
                      alt={post.author || "익명"}
                    />
                    <AvatarFallback>
                      {(post.author || "익명")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{post.author || "익명"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(post.timestamp)}
                    </div>
                  </div>
                </div>

                {/* 카테고리 및 태그 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {post.category && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary">
                      {post.category}
                    </span>
                  )}
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 제목 */}
                <h1 className="text-3xl font-bold">{post.title}</h1>

                {/* 통계 정보 */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {likeCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {comments.length.toLocaleString()}
                  </span>
                </div>

                {/* 본문 내용 */}
                <div className="prose max-w-none">
                  {post.image_url && (
                    <div className="mb-6">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                  <div
                    className="text-foreground"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      onClick={handleLike}
                      disabled={isLiking}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                      />
                      좋아요 ({likeCount})
                    </Button>
                    <Button
                      variant={isBookmarked ? "default" : "outline"}
                      onClick={handleBookmark}
                      disabled={isBookmarking}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          isBookmarked ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* 작성자 또는 관리자일 때 수정/삭제 버튼 표시 */}
                  {(isAuthor || isAdmin) && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handleEdit}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 댓글 섹션 */}
            <Card className="bg-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    댓글 ({comments.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        commentSortType === "latest" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCommentSortType("latest")}
                    >
                      최신순
                    </Button>
                    <Button
                      variant={
                        commentSortType === "likes" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCommentSortType("likes")}
                    >
                      좋아요순
                    </Button>
                  </div>
                </div>

                {/* 댓글 작성 폼 */}
                <div className="space-y-2">
                  <div className="flex gap-3">
                    {/* 현재 로그인한 사용자 아바타 */}
                    {currentUser && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {currentUserProfile?.avatar_url ? (
                          <AvatarImage
                            src={currentUserProfile.avatar_url}
                            alt={currentUserProfile.name || "사용자"}
                          />
                        ) : null}
                        <AvatarFallback>
                          {currentUserProfile?.name?.[0]?.toUpperCase() ||
                            currentUser.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Textarea
                      placeholder="댓글을 입력하세요..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={isSubmittingComment || !commentText.trim()}
                    >
                      {isSubmittingComment ? "작성 중..." : "댓글 작성"}
                    </Button>
                  </div>
                </div>

                {/* 댓글 목록 */}
                <div className="space-y-4 mt-6">
                  {comments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      아직 댓글이 없습니다.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 pb-4 border-b last:border-0"
                      >
                        <Avatar className="w-8 h-8">
                          {comment.profiles?.avatar_url ? (
                            <AvatarImage
                              src={comment.profiles.avatar_url}
                              alt={comment.profiles.full_name || "사용자"}
                            />
                          ) : null}
                          <AvatarFallback>
                            {comment.profiles?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.profiles?.full_name || "익명"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => handleCommentLike(comment.id)}
                            >
                              <ThumbsUp
                                className={`w-3 h-3 mr-1 ${
                                  comment.user_liked ? "fill-current" : ""
                                }`}
                              />
                              {comment.like_count}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 (1/3) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-[calc(var(--navigation-height)+12px)] lg:self-start">
            {/* 작성자 정보 카드 */}
            {post && (
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    {/* 왼쪽: 아바타와 사용자명 */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        {authorProfile?.avatar_url &&
                        authorProfile.avatar_url.trim() !== "" ? (
                          <AvatarImage
                            src={authorProfile.avatar_url}
                            alt={authorProfile.name || post.author || "익명"}
                            onError={(e) => {
                              // 이미지 로드 실패 시 fallback 표시
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(authorProfile?.name ||
                            post.author ||
                            "익명")[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-base flex items-center gap-1.5">
                          <span className="truncate">
                            {authorProfile?.name || post.author || "익명"}
                          </span>
                          <span className="flex-shrink-0">🇰🇷</span>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 시작하기 버튼 */}
                    {!currentUser && (
                      <Button
                        size="sm"
                        className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 h-auto flex-shrink-0 ml-2"
                        onClick={() => router.push("/auth/login")}
                      >
                        3초 만에 시작하기 🚀
                      </Button>
                    )}
                  </div>

                  {/* 작성자 통계 */}
                  <div className="space-y-2">
                    {/* 작성자가 작성한 다른 게시글 목록 */}
                    {post && authorPosts.length > 0 && (
                      <Card className="bg-card py-2">
                        <CardContent className="p-2">
                          <h3 className="font-semibold text-base mb-4">
                            {authorProfile?.name || post.author || "작성자"}의
                            다른 게시글({(authorStats?.postCount ?? 0) - 1})
                          </h3>
                          <div className="space-y-2">
                            {authorPosts.map((authorPost) => (
                              <Link
                                key={authorPost.id}
                                href={`/community/${authorPost.id}`}
                                className="block group"
                              >
                                <div className="flex rounded-lgitems-center justify-between py-1 px-2 border  hover:bg-muted/50 transition-colors">
                                  {/* 게시글 제목 */}
                                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                    {authorPost.title}
                                  </h4>

                                  {/* 날짜 */}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {formatDateOnly(authorPost.created_at)}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 작성자가 작성한 댓글 목록 */}
                    {post && authorComments.length > 0 && (
                      <Card className="bg-card py-2">
                        <CardContent className="px-2 py-1">
                          <h3 className="font-semibold text-base mb-2">
                            {authorProfile?.name || post.author || "작성자"}의
                            댓글({authorStats?.commentCount || 0})
                          </h3>
                          <div className="space-y-2">
                            {authorComments.map((comment) => {
                              // 댓글이 속한 게시글 정보 추출
                              const commentPost = (comment as any).communities;
                              return (
                                <Link
                                  key={comment.id}
                                  href={`/community/${comment.community_id}`}
                                  className="block group"
                                >
                                  <div className="flex items-center justify-between gap-2 py-1 px-2 border rounded-lg hover:bg-muted/50 transition-colors">
                                    {/* 댓글 내용 */}
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {comment.content}
                                    </p>
                                    {/* 날짜 및 좋아요 */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>
                                        {formatDateOnly(comment.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
