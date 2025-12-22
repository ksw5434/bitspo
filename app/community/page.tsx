"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "../_components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../_components/ui/tabs";
import { Button } from "../_components/ui/button";
import { MessageSquare, ThumbsUp, Eye, Clock } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

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
  // Supabase 클라이언트를 useMemo로 메모이제이션하여 매 렌더링마다 새로 생성되지 않도록 함
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const [activeTab, setActiveTab] = useState("recent");
  const [displayedCountRecent, setDisplayedCountRecent] = useState(10);
  const [displayedCountPopular, setDisplayedCountPopular] = useState(10);
  const [displayedCountDiscussion, setDisplayedCountDiscussion] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 초기 데이터 로딩 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 로그인 상태

  // 실제 데이터 상태
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [discussionPosts, setDiscussionPosts] = useState<Post[]>([]);

  // IntersectionObserver를 위한 ref
  const observerTargetRecentRef = useRef<HTMLDivElement>(null);
  const observerTargetPopularRef = useRef<HTMLDivElement>(null);
  const observerTargetDiscussionRef = useRef<HTMLDivElement>(null);

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
    // Supabase 클라이언트가 없으면 실행하지 않음
    if (!supabase) return;

    const fetchPosts = async () => {
      try {
        setIsInitialLoading(true);

        // 라우트 전환 시 상태 초기화
        setRecentPosts([]);
        setPopularPosts([]);
        setDiscussionPosts([]);

        // 헬퍼 함수: 게시물 데이터를 Post 타입으로 변환
        const transformPosts = (
          communitiesData: any[],
          profilesMap: Map<
            string,
            { name: string | null; avatar_url: string | null }
          >
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
                profilesError
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
            profilesMap
          );
          setRecentPosts(transformedRecentPosts);
        } else {
          setRecentPosts([]);
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
                profilesError
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
            profilesMap
          );
          setPopularPosts(transformedPopularPosts);
        } else {
          setPopularPosts([]);
        }

        // 토론 게시물 가져오기 (comment_count 기준 내림차순)
        const { data: discussionData, error: discussionError } = await supabase
          .from("communities")
          .select("*")
          .order("comment_count", { ascending: false })
          .limit(100);

        if (discussionError) {
          console.error("토론 게시물 조회 오류:", {
            message: discussionError.message,
            details: discussionError.details,
            hint: discussionError.hint,
            code: discussionError.code,
          });
          setDiscussionPosts([]); // 에러 발생 시 빈 배열 설정
        } else if (discussionData && discussionData.length > 0) {
          const userIds = [
            ...new Set(discussionData.map((item) => item.user_id)),
          ];

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
                profilesError
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

          const transformedDiscussionPosts = transformPosts(
            discussionData,
            profilesMap
          );
          setDiscussionPosts(transformedDiscussionPosts);
        } else {
          setDiscussionPosts([]);
        }
      } catch (error) {
        console.error("게시물 데이터 로드 오류:", error);
        // 예외 발생 시에도 빈 배열 설정
        setRecentPosts([]);
        setPopularPosts([]);
        setDiscussionPosts([]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchPosts();

    // cleanup 함수: 컴포넌트 언마운트 시 실행
    return () => {
      // 비동기 작업 취소를 위한 플래그는 필요시 추가 가능
    };
  }, [supabase]);

  // 무한 스크롤 로직 - 최근 탭
  useEffect(() => {
    const observerTarget = observerTargetRecentRef.current;
    if (!observerTarget || activeTab !== "recent") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          displayedCountRecent < recentPosts.length &&
          !isLoading
        ) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedCountRecent((prev) =>
              Math.min(prev + ITEMS_PER_LOAD, recentPosts.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [displayedCountRecent, activeTab, isLoading, recentPosts.length]);

  // 무한 스크롤 로직 - 인기 탭
  useEffect(() => {
    const observerTarget = observerTargetPopularRef.current;
    if (!observerTarget || activeTab !== "popular") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          displayedCountPopular < popularPosts.length &&
          !isLoading
        ) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedCountPopular((prev) =>
              Math.min(prev + ITEMS_PER_LOAD, popularPosts.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [displayedCountPopular, activeTab, isLoading, popularPosts.length]);

  // 무한 스크롤 로직 - 토론 탭
  useEffect(() => {
    const observerTarget = observerTargetDiscussionRef.current;
    if (!observerTarget || activeTab !== "discussion") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          displayedCountDiscussion < discussionPosts.length &&
          !isLoading
        ) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedCountDiscussion((prev) =>
              Math.min(prev + ITEMS_PER_LOAD, discussionPosts.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [displayedCountDiscussion, activeTab, isLoading, discussionPosts.length]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setIsLoading(false);
  }, []);

  // 표시할 게시물 데이터 계산
  const displayedRecentPosts = useMemo(
    () => recentPosts.slice(0, displayedCountRecent),
    [recentPosts, displayedCountRecent]
  );

  const displayedPopularPosts = useMemo(
    () => popularPosts.slice(0, displayedCountPopular),
    [popularPosts, displayedCountPopular]
  );

  const displayedDiscussionPosts = useMemo(
    () => discussionPosts.slice(0, displayedCountDiscussion),
    [discussionPosts, displayedCountDiscussion]
  );

  // 더 로드할 데이터가 있는지 확인
  const hasMoreRecent = displayedCountRecent < recentPosts.length;
  const hasMorePopular = displayedCountPopular < popularPosts.length;
  const hasMoreDiscussion = displayedCountDiscussion < discussionPosts.length;

  // 인기 태그 목록
  const popularTags = [
    "BTC",
    "ETH",
    "SOL",
    "DeFi",
    "NFT",
    "AI",
    "거래소",
    "뉴스",
    "알트코인",
    "스테이킹",
  ];

  // 게시물 카드 컴포넌트
  const PostCard = ({ post }: { post: Post }) => (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-0">
        <Link href={`/community/${post.id}`} className="block">
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              {/* 작성자 아바타 */}
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {post.authorAvatar ? (
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                    {post.author[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {post.author}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.timestamp}
                </span>
              </div>
            </div>
            {/* 카테고리 및 태그 */}
            <div className="flex items-center gap-2">
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
            <div className="space-y-1">
              {/* 제목 */}
              <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>

              {/* 내용 미리보기 */}
              <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/70 transition-colors">
                {post.content}
              </p>
              {post.image && (
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
            {/* 작성자 정보 및 통계 */}
            <div className="flex items-center">
              {/* 통계 정보 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {post.likes.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {post.comments.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
  return (
    <div className="bg-muted py-4 min-h-screen">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 메인 콘텐츠 영역 (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-6">
              {/* 헤더: 타이틀과 탭 */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-4">커뮤니티</h1>
                <Tabs
                  defaultValue="recent"
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="bg-transparent py-0 px-1 h-auto gap-6">
                    <TabsTrigger
                      value="recent"
                      className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-t-0 data-[state=active]:border-r-0 data-[state=active]:border-l-0 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none text-muted-foreground border-b-2 border-transparent px-0 pb-2"
                    >
                      최근
                    </TabsTrigger>
                    <TabsTrigger
                      value="popular"
                      className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-t-0 data-[state=active]:border-r-0 data-[state=active]:border-l-0 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none text-muted-foreground border-b-2 border-transparent px-0 pb-2"
                    >
                      인기
                    </TabsTrigger>
                    <TabsTrigger
                      value="discussion"
                      className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-t-0 data-[state=active]:border-r-0 data-[state=active]:border-l-0 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none text-muted-foreground border-b-2 border-transparent px-0 pb-2"
                    >
                      토론
                    </TabsTrigger>
                  </TabsList>
                  {/* 탭 아래 구분선 */}
                  <div className="border-t border-gray-300/50 -translate-y-2.5"></div>

                  {/* 게시물 작성 버튼 - 로그인한 유저만 표시 */}
                  {isAuthenticated && (
                    <div className="mt-4 flex justify-end">
                      <Button asChild>
                        <Link href="/community/write">글쓰기</Link>
                      </Button>
                    </div>
                  )}

                  {/* 게시물 목록 - 최근 탭 */}
                  <TabsContent value="recent" className="mt-6">
                    {isInitialLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          게시물을 불러오는 중...
                        </div>
                      </div>
                    ) : displayedRecentPosts.length === 0 ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          게시물이 없습니다.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayedRecentPosts.map((post) => (
                          <PostCard key={`recent-${post.id}`} post={post} />
                        ))}
                        {hasMoreRecent && (
                          <div
                            ref={observerTargetRecentRef}
                            className="flex justify-center items-center py-8"
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
                  </TabsContent>

                  {/* 게시물 목록 - 인기 탭 */}
                  <TabsContent value="popular" className="mt-6">
                    {isInitialLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          게시물을 불러오는 중...
                        </div>
                      </div>
                    ) : displayedPopularPosts.length === 0 ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          게시물이 없습니다.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayedPopularPosts.map((post) => (
                          <PostCard key={`popular-${post.id}`} post={post} />
                        ))}
                        {hasMorePopular && (
                          <div
                            ref={observerTargetPopularRef}
                            className="flex justify-center items-center py-8"
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
                  </TabsContent>

                  {/* 게시물 목록 - 토론 탭 */}
                  <TabsContent value="discussion" className="mt-6">
                    {isInitialLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          게시물을 불러오는 중...
                        </div>
                      </div>
                    ) : displayedDiscussionPosts.length === 0 ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          게시물이 없습니다.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayedDiscussionPosts.map((post) => (
                          <PostCard key={`discussion-${post.id}`} post={post} />
                        ))}
                        {hasMoreDiscussion && (
                          <div
                            ref={observerTargetDiscussionRef}
                            className="flex justify-center items-center py-8"
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
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* 사이드바 (1/3) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-[calc(var(--navigation-height)+12px)] lg:self-start">
            {/* 인기 태그 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">인기 태그</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 추천 커뮤니티 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">추천 커뮤니티</h3>
              <div className="space-y-3">
                {[
                  { name: "비트코인 토론방", members: "12.5K", icon: "₿" },
                  { name: "이더리움 연구소", members: "8.3K", icon: "Ξ" },
                  { name: "디파이 투자자 모임", members: "5.7K", icon: "💎" },
                  { name: "NFT 컬렉터", members: "3.2K", icon: "🖼️" },
                ].map((community, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                        {community.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {community.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          멤버 {community.members}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      가입
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 실시간 인기 게시물 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">실시간 인기</h3>
              <div className="space-y-3">
                {displayedPopularPosts.slice(0, 5).map((post) => (
                  <Link
                    key={`sidebar-${post.id}`}
                    href={`/community/${post.id}`}
                    className="block p-2 hover:bg-muted rounded transition-colors"
                  >
                    <h4 className="text-sm font-medium line-clamp-2 mb-1">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.comments}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
