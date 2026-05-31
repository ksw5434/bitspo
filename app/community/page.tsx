"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { MessageSquare, ThumbsUp, Eye, Clock } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import {
  COMMUNITY_TAB_DESCRIPTIONS,
  COMMUNITY_TAB_LABELS,
  filterPostsByCommunityTab,
  parseCommunityTab,
} from "@/lib/community-tabs";
import { CommunitySidebar } from "@/app/_components/community-sidebar";
import type { TopPostItem } from "@/lib/community-sidebar-mock";

// 게시물 타입 정의
type Post = {
  id: string; // UUID로 변경
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  category?: string;
  image?: string; // image_url을 image로 매핑
};

// HTML 태그 제거 및 텍스트만 추출 (목록 미리보기용)
const stripHtmlTags = (html: string | null | undefined): string => {
  if (!html) return "";
  // HTML 태그 제거 및 HTML 엔티티 디코딩
  return html
    .replace(/<[^>]*>/g, "") // HTML 태그 제거
    .replace(/&nbsp;/g, " ") // &nbsp;를 공백으로 변환
    .replace(/&amp;/g, "&") // &amp;를 &로 변환
    .replace(/&lt;/g, "<") // &lt;를 <로 변환
    .replace(/&gt;/g, ">") // &gt;를 >로 변환
    .replace(/&quot;/g, '"') // &quot;를 "로 변환
    .replace(/&#39;/g, "'") // &#39;를 '로 변환
    .trim();
};

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const communitySectionTab = parseCommunityTab(searchParams.get("tab"));

  // Supabase 클라이언트를 useMemo로 메모이제이션하여 매 렌더링마다 새로 생성되지 않도록 함
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const [displayedCountRecent, setDisplayedCountRecent] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 초기 데이터 로딩 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 로그인 상태

  // 실제 데이터 상태
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);

  // 무한 스크롤 감지용 ref
  const observerTargetRecentRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_LOAD = 10;

  // 사용자 인증 상태 확인
  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("인증 상태 확인 오류:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // 인증 상태 변경 리스너 설정
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // communities 테이블에서 데이터 가져오기
  useEffect(() => {
    // Supabase 클라이언트가 없으면 로딩 상태만 해제하고 종료
    if (!supabase) {
      setIsInitialLoading(false);
      return;
    }

    let isMounted = true; // 컴포넌트 마운트 상태 추적

    const fetchPosts = async () => {
      try {
        if (!isMounted) return;
        setIsInitialLoading(true);

        // 라우트 전환 시 상태 초기화
        if (isMounted) {
          setRecentPosts([]);
          setPopularPosts([]);
        }

        // 헬퍼 함수: 게시물 데이터를 Post 타입으로 변환
        const transformPosts = (
          communitiesData: any[],
          profilesMap: Map<
            string,
            { name: string | null; avatar_url: string | null }
          >,
        ): Post[] => {
          return communitiesData.map((item: any) => {
            const profile = profilesMap.get(item.user_id);

            return {
              id: item.id,
              title: item.title,
              content: stripHtmlTags(item.content), // HTML 태그 제거하여 텍스트만 표시
              author: profile?.name || "익명",
              authorAvatar: profile?.avatar_url || undefined,
              timestamp: new Date(item.created_at).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              views: item.views || 0,
              likes: item.like_count || 0,
              comments: item.comment_count || 0,
              tags: item.tags || [],
              category: item.category || undefined,
              image: item.image_url || undefined,
            };
          });
        };

        // 최근 게시물 가져오기 (created_at 기준 내림차순)
        const { data: recentData, error: recentError } = await supabase
          .from("communities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (recentError) {
          console.error("최근 게시물 조회 오류:", {
            message: recentError.message,
            details: recentError.details,
            hint: recentError.hint,
            code: recentError.code,
          });
          setRecentPosts([]); // 에러 발생 시 빈 배열 설정
        } else if (recentData && recentData.length > 0) {
          // 작성자 user_id 목록 수집
          const userIds = [...new Set(recentData.map((item) => item.user_id))];

          // profiles 정보 한 번에 조회 (에러 발생해도 게시물은 표시)
          let profilesMap = new Map<
            string,
            { name: string | null; avatar_url: string | null }
          >();

          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, name, avatar_url")
              .in("id", userIds);

            if (profilesError) {
              console.warn(
                "프로필 조회 오류 (게시물은 표시됨):",
                profilesError,
              );
            } else if (profilesData) {
              profilesData.forEach((profile) => {
                profilesMap.set(profile.id, {
                  name: profile.name,
                  avatar_url: profile.avatar_url,
                });
              });
            }
          }

          const transformedRecentPosts = transformPosts(
            recentData,
            profilesMap,
          );
          if (isMounted) {
            setRecentPosts(transformedRecentPosts);
          }
        } else {
          if (isMounted) {
            setRecentPosts([]);
          }
        }

        // 인기 게시물 가져오기 (like_count 기준 내림차순)
        const { data: popularData, error: popularError } = await supabase
          .from("communities")
          .select("*")
          .order("like_count", { ascending: false })
          .limit(100);

        if (popularError) {
          console.error("인기 게시물 조회 오류:", {
            message: popularError.message,
            details: popularError.details,
            hint: popularError.hint,
            code: popularError.code,
          });
          setPopularPosts([]); // 에러 발생 시 빈 배열 설정
        } else if (popularData && popularData.length > 0) {
          const userIds = [...new Set(popularData.map((item) => item.user_id))];

          // profiles 정보 한 번에 조회 (에러 발생해도 게시물은 표시)
          let profilesMap = new Map<
            string,
            { name: string | null; avatar_url: string | null }
          >();

          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, name, avatar_url")
              .in("id", userIds);

            if (profilesError) {
              console.warn(
                "프로필 조회 오류 (게시물은 표시됨):",
                profilesError,
              );
            } else if (profilesData) {
              profilesData.forEach((profile) => {
                profilesMap.set(profile.id, {
                  name: profile.name,
                  avatar_url: profile.avatar_url,
                });
              });
            }
          }

          const transformedPopularPosts = transformPosts(
            popularData,
            profilesMap,
          );
          if (isMounted) {
            setPopularPosts(transformedPopularPosts);
          }
        } else {
          if (isMounted) {
            setPopularPosts([]);
          }
        }
      } catch (error) {
        console.error("게시물 데이터 로드 오류:", error);
        // 예외 발생 시에도 빈 배열 설정
        if (isMounted) {
          setRecentPosts([]);
          setPopularPosts([]);
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchPosts();

    // cleanup 함수: 컴포넌트 언마운트 시 실행
    return () => {
      isMounted = false; // 컴포넌트 언마운트 시 플래그 설정
    };
  }, [supabase]);

  // 탭 전환 시 무한 스크롤 카운트 초기화
  useEffect(() => {
    setDisplayedCountRecent(10);
    setIsLoading(false);
  }, [communitySectionTab]);

  // 탭별 게시물 필터
  const tabRecentPosts = useMemo(
    () => filterPostsByCommunityTab(recentPosts, communitySectionTab),
    [recentPosts, communitySectionTab],
  );

  // 무한 스크롤 — 최근 게시물
  useEffect(() => {
    const observerTarget = observerTargetRecentRef.current;
    if (!observerTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          displayedCountRecent < tabRecentPosts.length &&
          !isLoading
        ) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedCountRecent((prev) =>
              Math.min(prev + ITEMS_PER_LOAD, tabRecentPosts.length),
            );
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [displayedCountRecent, isLoading, tabRecentPosts.length]);

  // 표시할 게시물 데이터 계산
  const displayedRecentPosts = useMemo(
    () => tabRecentPosts.slice(0, displayedCountRecent),
    [tabRecentPosts, displayedCountRecent],
  );

  // 더 로드할 데이터가 있는지 확인
  const hasMoreRecent = displayedCountRecent < tabRecentPosts.length;

  /** 사이드바 Top Posts — Discussion 게시물만 (방명록 제외) */
  const sidebarTopPosts = useMemo<TopPostItem[]>(
    () =>
      filterPostsByCommunityTab(popularPosts, "discussion")
        .slice(0, 5)
        .map((post) => ({
        id: post.id,
        title: post.title,
        likes: post.likes,
        comments: post.comments,
        href: `/community/${post.id}`,
      })),
    [popularPosts],
  );

  // 게시물 카드 컴포넌트
  const PostCard = ({
    post,
    showImage = true,
  }: {
    post: Post;
    showImage?: boolean;
  }) => (
    <Card className="gap-0 overflow-hidden rounded-none border-0 border-b border-gray-500/50 bg-transparent py-0 shadow-none hover:shadow-none cursor-pointer group last:border-b-0">
      <CardContent className="p-0">
        <Link href={`/community/${post.id}`} className="block cursor-pointer">
          <div className="p-6 space-y-3">
            <div className="flex w-full items-center gap-3">
              {/* 작성자 아바타 */}
              <div className="size-8 shrink-0 overflow-hidden rounded-full bg-gray-200">
                {post.authorAvatar ? (
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="size-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-gray-500">
                    {post.author[0]}
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-foreground">
                  {post.author}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {post.timestamp}
                </span>
              </div>
              {/* 통계 — 아바타 행 오른쪽 끝 */}
              <div className="ml-auto flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="size-4" />
                  {post.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-4" />
                  {post.likes.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-4" />
                  {post.comments.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {/* 제목 */}
              <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>

              {/* 내용 미리보기 */}
              <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/70 transition-colors">
                {post.content}
              </p>
              {showImage && post.image && (
                <div className="w-full h-60 flex justify-start">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full object-contain object-left"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );

  /** 메인 영역 — 서브 탭별 콘텐츠 (7) */
  const renderMainContent = () => {
    if (communitySectionTab === "forum") {
      const activeTabLabel = COMMUNITY_TAB_LABELS[communitySectionTab];

      return (
        <div className="rounded-lg p-6">
          <div className="mx-auto max-w-xl space-y-3 py-12 text-center">
            <h1 className="text-2xl font-semibold">
              Community · {activeTabLabel}
            </h1>
            <p className="leading-relaxed text-muted-foreground">
              {COMMUNITY_TAB_DESCRIPTIONS[communitySectionTab]}
            </p>
            <p className="text-sm text-muted-foreground/80">
              이 섹션은 준비 중입니다.
            </p>
          </div>
        </div>
      );
    }

    const isGuestbookTab = communitySectionTab === "guestbook";
    const writeHref = isGuestbookTab
      ? "/community/write?tab=guestbook"
      : "/community/write";

    return (
      <div className="rounded-lg bg-card px-4 py-2">
        {isAuthenticated && (
          <div className="mb-4 flex justify-end">
            <Button asChild>
              <Link href={writeHref}>
                {isGuestbookTab ? "방명록 작성" : "글쓰기"}
              </Link>
            </Button>
          </div>
        )}

        {isGuestbookTab && (
          <p className="mb-4 text-sm text-muted-foreground">
            {COMMUNITY_TAB_DESCRIPTIONS.guestbook}
          </p>
        )}

        {isInitialLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">
              게시물을 불러오는 중...
            </div>
          </div>
        ) : displayedRecentPosts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">
              {isGuestbookTab ? "방명록이 없습니다." : "게시물이 없습니다."}
            </div>
          </div>
        ) : (
          <div>
            {displayedRecentPosts.map((post) => (
              <PostCard
                key={`recent-${post.id}`}
                post={post}
                showImage={!isGuestbookTab}
              />
            ))}
            {hasMoreRecent && (
              <div
                ref={observerTargetRecentRef}
                className="flex items-center justify-center py-8"
              >
                {isLoading && (
                  <div className="text-sm text-muted-foreground">
                    로딩 중...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted py-4">
      <div className="container mx-auto w-full max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          {/* 메인 콘텐츠 (7) */}
          <section className="lg:col-span-7">{renderMainContent()}</section>

          {/* 사이드바 (3) — 모든 서브 메뉴 공통 */}
          <aside className="space-y-4 lg:col-span-3 lg:sticky lg:top-[calc(var(--community-tabs-height,2.5rem)+0.75rem)] lg:self-start">
            <CommunitySidebar topPosts={sidebarTopPosts} />
          </aside>
        </div>
      </div>
    </div>
  );
}
