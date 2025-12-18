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

// 게시물 타입 정의
type Post = {
  id: number;
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
  image?: string;
};

// 더미 데이터 생성 함수
const generateDummyPosts = (
  count: number,
  category: string = "recent"
): Post[] => {
  const categories = [
    "비트코인",
    "이더리움",
    "솔라나",
    "디파이",
    "NFT",
    "메타버스",
  ];
  const tags = ["BTC", "ETH", "SOL", "DeFi", "NFT", "AI", "거래소", "뉴스"];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `${
      category === "popular"
        ? "인기 "
        : category === "discussion"
        ? "토론 "
        : ""
    }게시물 제목 ${i + 1}: 암호화폐 시장 동향 분석`,
    content: `이것은 게시물 ${
      i + 1
    }의 내용입니다. 암호화폐 시장의 최신 동향과 분석을 제공합니다. 블록체인 기술과 디지털 자산에 대한 심층적인 정보를 다룹니다.`,
    author: `사용자${i + 1}`,
    authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${
      i + 1
    }`,
    timestamp: new Date(Date.now() - i * 3600000).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    views: Math.floor(Math.random() * 10000) + 100,
    likes: Math.floor(Math.random() * 500) + 10,
    comments: Math.floor(Math.random() * 100) + 5,
    tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
    category: categories[Math.floor(Math.random() * categories.length)],
    image: `https://picsum.photos/400/250?${Date.now()}`,
  }));
};

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("recent");
  const [displayedCountRecent, setDisplayedCountRecent] = useState(10);
  const [displayedCountPopular, setDisplayedCountPopular] = useState(10);
  const [displayedCountDiscussion, setDisplayedCountDiscussion] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // 더미 데이터 생성
  const recentPosts = useMemo(() => generateDummyPosts(50, "recent"), []);
  const popularPosts = useMemo(() => generateDummyPosts(50, "popular"), []);
  const discussionPosts = useMemo(
    () => generateDummyPosts(50, "discussion"),
    []
  );

  // IntersectionObserver를 위한 ref
  const observerTargetRecentRef = useRef<HTMLDivElement>(null);
  const observerTargetPopularRef = useRef<HTMLDivElement>(null);
  const observerTargetDiscussionRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_LOAD = 10;

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
        <Link href={`/community/post/${post.id}`} className="block">
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
              <div className="w-full h-60 flex justify-start">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full object-contain object-left"
                />
              </div>
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

                  {/* 게시물 작성 버튼 */}
                  <div className="mt-4 flex justify-end">
                    <Button asChild>
                      <Link href="/community/write">글쓰기</Link>
                    </Button>
                  </div>

                  {/* 게시물 목록 - 최근 탭 */}
                  <TabsContent value="recent" className="mt-6">
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
                  </TabsContent>

                  {/* 게시물 목록 - 인기 탭 */}
                  <TabsContent value="popular" className="mt-6">
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
                  </TabsContent>

                  {/* 게시물 목록 - 토론 탭 */}
                  <TabsContent value="discussion" className="mt-6">
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
                    href={`/community/post/${post.id}`}
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
