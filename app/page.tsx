"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "./_components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./_components/ui/tabs";
import { mainPickNews, rankingNews, deepDiveNews } from "@/lib/main-data";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewsCarousel } from "./_components/news-carousel";
import { NewsSection } from "./_components/news-section";
import { DeepDiveSection } from "./_components/deep-dive-section";
import { createClient } from "@/lib/supabase/client";

// Supabase에서 가져온 뉴스 타입 정의
interface NewsFromSupabase {
  id: string;
  headline: string;
  content: string | null;
  image_url: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

// 화면에 표시할 뉴스 타입 (기존 형식과 호환)
interface DisplayNews {
  id?: string; // Supabase에서 가져온 경우 id 포함
  image: string;
  headline: string;
  timestamp: string;
}

// 타임스탬프를 "19분 전" 형식으로 변환하는 함수
function formatTimestamp(createdAt: string): string {
  try {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "방금 전";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      // 7일 이상이면 날짜 형식으로 표시
      const year = created.getFullYear();
      const month = created.getMonth() + 1;
      const day = created.getDate();
      return `${year}. ${month}. ${day}.`;
    }
  } catch (error) {
    console.error("타임스탬프 변환 오류:", error);
    return "알 수 없음";
  }
}

// 기본 placeholder 이미지 URL (안정적인 서비스 사용)
const DEFAULT_PLACEHOLDER_IMAGE = "https://via.placeholder.com/200x200?text=No+Image";

// Supabase 뉴스 데이터를 화면 표시 형식으로 변환하는 함수
function convertNewsToDisplayFormat(news: NewsFromSupabase): DisplayNews {
  return {
    id: news.id, // id 포함
    image: news.image_url || DEFAULT_PLACEHOLDER_IMAGE,
    headline: news.headline,
    timestamp: formatTimestamp(news.created_at),
  };
}

// 헤드라인에서 코인 태그 추출하는 유틸리티 함수
function extractCoinTag(headline: string): string {
  const coinKeywords: { [key: string]: string } = {
    비트코인: "BTC",
    BTC: "BTC",
    솔라나: "SOL",
    SOL: "SOL",
    이더리움: "ETH",
    ETH: "ETH",
    도지코인: "DOGE",
    DOGE: "DOGE",
    바이낸스: "BNB",
    BNB: "BNB",
    리플: "XRP",
    XRP: "XRP",
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
  return "BTC"; // 기본값
}

export default function Home() {
  // Supabase 클라이언트 생성
  const supabase = createClient();

  // Supabase에서 가져온 뉴스 데이터 상태
  const [supabaseNews, setSupabaseNews] = useState<NewsFromSupabase[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true); // 뉴스 데이터 로딩 상태
  const [newsError, setNewsError] = useState<string | null>(null); // 뉴스 로드 에러 상태

  const newsGroups = useMemo(() => {
    const groups: Array<typeof mainPickNews> = [];
    for (let i = 0; i < mainPickNews.length; i += 3) {
      const group = mainPickNews.slice(i, i + 3);
      if (group.length > 0) {
        groups.push(group);
      }
    }
    return groups;
  }, []);

  // 무한 스크롤을 위한 상태 관리
  const [displayedCountAll, setDisplayedCountAll] = useState(10); // 전체 탭에서 표시할 뉴스 개수
  const [displayedCountPick, setDisplayedCountPick] = useState(10); // PICK 탭에서 표시할 뉴스 개수
  const [activeTab, setActiveTab] = useState("all"); // 현재 활성화된 탭
  const [isLoading, setIsLoading] = useState(false); // 무한 스크롤 로딩 상태

  // Supabase에서 뉴스 데이터 가져오기
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoadingNews(true);
        setNewsError(null);

        // Supabase에서 뉴스 목록 조회 (최신순)
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .order("created_at", { ascending: false });

        if (newsError) {
          console.error("뉴스 조회 오류:", newsError);
          setNewsError("뉴스를 불러오는데 실패했습니다.");
          // 에러가 발생해도 기존 정적 데이터를 사용할 수 있도록 에러만 설정
          return;
        }

        // 데이터가 있으면 설정, 없으면 빈 배열
        setSupabaseNews(newsData || []);
      } catch (error) {
        console.error("뉴스 로드 중 예외 발생:", error);
        setNewsError("뉴스를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, [supabase]);

  // IntersectionObserver를 위한 ref
  const observerTargetAllRef = useRef<HTMLDivElement>(null);
  const observerTargetPickRef = useRef<HTMLDivElement>(null);

  // 한 번에 추가로 로드할 뉴스 개수
  const ITEMS_PER_LOAD = 10;

  // Supabase 뉴스를 화면 표시 형식으로 변환
  const displayNewsList = useMemo(() => {
    if (supabaseNews.length > 0) {
      return supabaseNews.map(convertNewsToDisplayFormat);
    }
    // Supabase 데이터가 없으면 기존 정적 데이터 사용
    return mainPickNews;
  }, [supabaseNews]);

  // 무한 스크롤 로직 - 전체 탭
  useEffect(() => {
    const observerTarget = observerTargetAllRef.current;
    if (!observerTarget || activeTab !== "all") return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 마지막 요소가 뷰포트에 들어왔고, 더 로드할 데이터가 있는 경우
        if (
          entries[0].isIntersecting &&
          displayedCountAll < displayNewsList.length &&
          !isLoading
        ) {
          setIsLoading(true);
          // 약간의 지연을 주어 자연스러운 로딩 효과 제공
          setTimeout(() => {
            setDisplayedCountAll((prev) =>
              Math.min(prev + ITEMS_PER_LOAD, displayNewsList.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      {
        threshold: 0.1, // 요소가 10% 보이면 트리거
        rootMargin: "100px", // 뷰포트 아래 100px 전에 미리 로드
      }
    );

    observer.observe(observerTarget);

    return () => {
      observer.disconnect();
    };
  }, [displayedCountAll, activeTab, isLoading, displayNewsList.length]);

  // 무한 스크롤 로직 - PICK 탭
  useEffect(() => {
    const observerTarget = observerTargetPickRef.current;
    if (!observerTarget || activeTab !== "pick") return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 마지막 요소가 뷰포트에 들어왔고, 더 로드할 데이터가 있는 경우
        if (
          entries[0].isIntersecting &&
          displayedCountPick < displayNewsList.length &&
          !isLoading
        ) {
          setIsLoading(true);
          // 약간의 지연을 주어 자연스러운 로딩 효과 제공
          setTimeout(() => {
            setDisplayedCountPick((prev) =>
              Math.min(prev + ITEMS_PER_LOAD, displayNewsList.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      {
        threshold: 0.1, // 요소가 10% 보이면 트리거
        rootMargin: "100px", // 뷰포트 아래 100px 전에 미리 로드
      }
    );

    observer.observe(observerTarget);

    return () => {
      observer.disconnect();
    };
  }, [displayedCountPick, activeTab, isLoading, displayNewsList.length]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // 탭 변경 시 로딩 상태 초기화
    setIsLoading(false);
  }, []);

  // 표시할 뉴스 데이터 계산
  const displayedNewsAll = useMemo(
    () => displayNewsList.slice(0, displayedCountAll),
    [displayNewsList, displayedCountAll]
  );

  const displayedNewsPick = useMemo(
    () => displayNewsList.slice(0, displayedCountPick),
    [displayNewsList, displayedCountPick]
  );

  // 더 로드할 데이터가 있는지 확인
  const hasMoreAll = displayedCountAll < displayNewsList.length;
  const hasMorePick = displayedCountPick < displayNewsList.length;

  return (
    <div className="bg-muted py-4 ">
      <div className="container mx-auto space-y-4">
        {/* 메인 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* 왼쪽: PICK 뉴스 섹션 */}
          <div className="lg:col-span-2 rounded-lg bg-card flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between pt-4 px-5">
              <h2 className="text-2xl font-semibold">PICK 뉴스</h2>
            </div>

            {/* 뉴스 슬라이더 */}
            <Card className="overflow-hidden p-4 border-none outline-none shadow-none flex-1 flex flex-col">
              <NewsCarousel newsGroups={newsGroups} />
            </Card>
          </div>

          {/* 오른쪽: 랭킹 뉴스 섹션 */}
          <NewsSection newsItems={rankingNews} />
        </div>

        {/* 딥다이브 섹션 */}
        <DeepDiveSection newsItems={deepDiveNews} />

        {/* 실시간 뉴스 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 왼쪽: 실시간 뉴스 (2/3) */}
          <div className="lg:col-span-2 bg-card rounded-lg p-6">
            {/* 헤더: 타이틀과 탭 */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">실시간 뉴스</h2>
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="bg-transparent py-0 px-1 h-auto gap-6">
                  <TabsTrigger
                    value="all"
                    className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-t-0 data-[state=active]:border-r-0 data-[state=active]:border-l-0 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none text-muted-foreground border-b-2 border-transparent px-0 pb-2"
                  >
                    전체
                  </TabsTrigger>
                  <TabsTrigger
                    value="pick"
                    className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-t-0 data-[state=active]:border-r-0 data-[state=active]:border-l-0 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none text-muted-foreground border-b-2 border-transparent px-0 pb-2"
                  >
                    PICK
                  </TabsTrigger>
                </TabsList>
                {/* 탭 아래 구분선 */}
                <div className="border-t border-gray-300/50 -translate-y-2.5"></div>
                {/* 날짜 표시 */}
                <div className="text-sm text-muted-foreground px-1">
                  {(() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1;
                    const day = today.getDate();
                    const weekdays = [
                      "일요일",
                      "월요일",
                      "화요일",
                      "수요일",
                      "목요일",
                      "금요일",
                      "토요일",
                    ];
                    const weekday = weekdays[today.getDay()];
                    return `오늘, ${year}. ${month}. ${day}. ${weekday}`;
                  })()}
                </div>
                {/* 뉴스 리스트 - 전체 탭 */}
                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4">
                    {/* 뉴스 로딩 중 표시 */}
                    {isLoadingNews && (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-sm text-muted-foreground">
                          뉴스를 불러오는 중...
                        </div>
                      </div>
                    )}
                    {/* 뉴스 로드 에러 표시 */}
                    {newsError && !isLoadingNews && (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-sm text-red-500">{newsError}</div>
                      </div>
                    )}
                    {/* 뉴스가 없을 때 표시 */}
                    {!isLoadingNews &&
                      !newsError &&
                      displayedNewsAll.length === 0 && (
                        <div className="flex justify-center items-center py-8">
                          <div className="text-sm text-muted-foreground">
                            표시할 뉴스가 없습니다.
                          </div>
                        </div>
                      )}
                    {/* 뉴스 리스트 표시 */}
                    {displayedNewsAll.map((news, index) => {
                      const coinTag = extractCoinTag(news.headline);
                      // Supabase에서 가져온 뉴스는 id를 사용, 없으면 index 사용
                      const newsKey =
                        (news as DisplayNews).id || `all-${index}`;
                      // 뉴스 ID가 있으면 해당 ID로 라우팅, 없으면 index 사용
                      const newsId =
                        (news as DisplayNews).id || index.toString();

                      return (
                        <Link key={newsKey} href={`/news/${newsId}`}>
                          <Card className="overflow-hidden border-none py-0 px-1 shadow-none cursor-pointer group">
                            <CardContent className="p-0">
                              <div className="flex gap-4">
                                {/* 왼쪽: 텍스트 영역 */}
                                <div className="flex-1 py-4">
                                  {/* 코인 태그 */}
                                  <div className="mb-2">
                                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                                      {coinTag}
                                    </span>
                                  </div>
                                  {/* 헤드라인 */}
                                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {news.headline}
                                  </h3>
                                  {/* 요약 텍스트 (헤드라인 일부 사용) */}
                                  <p
                                    className="text-sm text-muted-foreground mb-2 line-clamp-2 group-hover:text-muted-foreground/70 
                            transition-colors duration-300"
                                  >
                                    {news.headline.length > 220
                                      ? `${news.headline.substring(0, 220)}...`
                                      : news.headline}
                                  </p>
                                  {/* 타임스탬프 */}
                                  <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/70 transition-colors duration-300">
                                    {news.timestamp}
                                  </p>
                                </div>
                                {/* 오른쪽: 이미지 */}
                                <div className="flex-shrink-0 w-32 h-32">
                                  <img
                                    src={news.image}
                                    alt={news.headline}
                                    className="w-full h-full object-cover rounded transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => {
                                      // 이미지 로드 실패 시 대체 이미지로 변경 (무한 루프 방지)
                                      const target =
                                        e.target as HTMLImageElement;
                                      // 이미 대체 이미지인 경우 더 이상 변경하지 않음
                                      if (!target.src.includes('placeholder.com')) {
                                        target.src = DEFAULT_PLACEHOLDER_IMAGE;
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                    {/* IntersectionObserver 타겟 요소 - 전체 탭 */}
                    {hasMoreAll && (
                      <div
                        ref={observerTargetAllRef}
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
                {/* 뉴스 리스트 - PICK 탭 */}
                <TabsContent value="pick" className="mt-6">
                  <div className="space-y-4">
                    {/* 뉴스 로딩 중 표시 */}
                    {isLoadingNews && (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-sm text-muted-foreground">
                          뉴스를 불러오는 중...
                        </div>
                      </div>
                    )}
                    {/* 뉴스 로드 에러 표시 */}
                    {newsError && !isLoadingNews && (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-sm text-red-500">{newsError}</div>
                      </div>
                    )}
                    {/* 뉴스가 없을 때 표시 */}
                    {!isLoadingNews &&
                      !newsError &&
                      displayedNewsPick.length === 0 && (
                        <div className="flex justify-center items-center py-8">
                          <div className="text-sm text-muted-foreground">
                            표시할 뉴스가 없습니다.
                          </div>
                        </div>
                      )}
                    {/* 뉴스 리스트 표시 */}
                    {displayedNewsPick.map((news, index) => {
                      const coinTag = extractCoinTag(news.headline);
                      // Supabase에서 가져온 뉴스는 id를 사용, 없으면 index 사용
                      const newsKey =
                        (news as DisplayNews).id || `pick-${index}`;
                      // 뉴스 ID가 있으면 해당 ID로 라우팅, 없으면 index 사용
                      const newsId =
                        (news as DisplayNews).id || index.toString();

                      return (
                        <Link key={newsKey} href={`/news/${newsId}`}>
                          <Card className="overflow-hidden border-none py-0 px-1 shadow-none cursor-pointer group">
                            <CardContent className="p-0">
                              <div className="flex gap-4">
                                <div className="flex-1 py-4">
                                  <div className="mb-2">
                                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                                      {coinTag}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {news.headline}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-2 group-hover:text-gray-500/50 transition-colors duration-300 line-clamp-2">
                                    {news.headline.length > 50
                                      ? `${news.headline.substring(0, 50)}...`
                                      : news.headline}
                                  </p>
                                  <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/70 transition-colors duration-300">
                                    {news.timestamp}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 w-32 h-32">
                                  <img
                                    src={news.image}
                                    alt={news.headline}
                                    className="w-full h-full object-cover rounded transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => {
                                      // 이미지 로드 실패 시 대체 이미지로 변경 (무한 루프 방지)
                                      const target =
                                        e.target as HTMLImageElement;
                                      // 이미 대체 이미지인 경우 더 이상 변경하지 않음
                                      if (!target.src.includes('placeholder.com')) {
                                        target.src = DEFAULT_PLACEHOLDER_IMAGE;
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                    {/* IntersectionObserver 타겟 요소 - PICK 탭 */}
                    {hasMorePick && (
                      <div
                        ref={observerTargetPickRef}
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

          {/* 오른쪽: 사이드바 (1/3) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-[calc(var(--navigation-height)+12px)] lg:self-start">
            {/* 조회수 급상승 코인 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">조회수 급상승 코인</h3>
              <div className="flex flex-wrap gap-2">
                {["SOL", "BTC", "USDT", "ONDO", "ETH"].map((coin) => (
                  <span
                    key={coin}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                  >
                    {coin}
                  </span>
                ))}
              </div>
            </div>

            {/* 한국경제미디어그룹 정보 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center ">
                비트스포
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex flex-wrap gap-2">
                  <span>공지사항</span>
                  <span>|</span>
                  <span>기자소개</span>
                  <span>|</span>
                  <span>인재채용</span>
                  <span>|</span>
                  <span>커뮤니티 운영정책</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span>이용약관</span>
                  <span>|</span>
                  <span>개인정보처리방침</span>
                  <span>|</span>
                  <span>윤리강령</span>
                  <span>|</span>
                  <span>청소년보호정책</span>
                </div>
                <div className="pt-2">
                  <p>문의사항 help@bloomingbit.io</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span>*bloomingbit</span>
                  <span className="text-gray-400">▼</span>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    📤
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
