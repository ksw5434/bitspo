"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "./_components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./_components/ui/tabs";
import { rankingNews, deepDiveNews } from "@/lib/main-data";
import { NewsCarousel } from "./_components/news-carousel";
import { NewsSection } from "./_components/news-section";
import { DeepDiveSection } from "./_components/deep-dive-section";
import { createClient } from "@/lib/supabase/client";
import { NewsImage } from "./news/news-image";
import {
  getRandomPlaceholderLarge,
  getRandomPlaceholderThumbnail,
} from "@/lib/placeholder-image";

// 뉴스 아이템 타입 정의
type NewsItem = {
  id: string;
  image: string;
  headline: string;
  timestamp: string;
};

export default function Home() {
  // Supabase 클라이언트 생성 (브라우저에서만)
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  // PICK 뉴스 데이터 상태
  const [mainPickNews, setMainPickNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // 실시간 뉴스 데이터 상태 (전체 및 PICK)
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [pickNews, setPickNews] = useState<NewsItem[]>([]);
  const [isLoadingRealtimeNews, setIsLoadingRealtimeNews] = useState(true);

  // 날짜를 상대 시간으로 변환하는 함수 (예: "3시간 전", "1일 전")
  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return "방금 전";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else if (diffInDays < 7) {
        return `${diffInDays}일 전`;
      } else {
        // 7일 이상이면 날짜 표시
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}. ${month}. ${day}.`;
      }
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return "날짜 불명";
    }
  };

  // 본문에서 첫 번째 이미지 URL 추출하는 함수
  const getFirstImageFromContent = (content: string | null): string | null => {
    if (!content) return null;

    // TipTap JSON 형식인 경우 우선 처리 (더 정확함)
    try {
      const jsonContent = JSON.parse(content);
      if (jsonContent && jsonContent.content) {
        const findImage = (nodes: any[]): string | null => {
          for (const node of nodes) {
            // 이미지 노드인 경우 src 속성 확인
            if (node.type === "image" && node.attrs?.src) {
              const imageSrc = node.attrs.src;
              // 유효한 이미지 URL인지 확인 (빈 문자열이나 null 제외)
              if (imageSrc && imageSrc.trim() !== "") {
                return imageSrc;
              }
            }
            // 하위 노드 재귀 탐색
            if (node.content && Array.isArray(node.content)) {
              const found = findImage(node.content);
              if (found) return found;
            }
          }
          return null;
        };
        const imageFromJson = findImage(jsonContent.content);
        if (imageFromJson) return imageFromJson;
      }
    } catch (e) {
      // JSON 파싱 실패 시 HTML로 처리
    }

    // HTML에서 첫 번째 img 태그의 src 속성 추출
    // 다양한 속성 지원: src, data-src, data-lazy-src 등
    const imgPatterns = [
      /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
      /<img[^>]+data-src=["']([^"']+)["'][^>]*>/i,
      /<img[^>]+data-lazy-src=["']([^"']+)["'][^>]*>/i,
    ];

    for (const pattern of imgPatterns) {
      const imgMatch = content.match(pattern);
      if (imgMatch && imgMatch[1]) {
        const imageSrc = imgMatch[1];
        // 유효한 이미지 URL인지 확인
        if (
          imageSrc &&
          imageSrc.trim() !== "" &&
          !imageSrc.startsWith("data:")
        ) {
          return imageSrc;
        }
      }
    }

    return null;
  };

  // Supabase에서 뉴스 데이터 가져오기
  useEffect(() => {
    if (!supabase) return;

    const loadNews = async () => {
      try {
        setIsLoadingNews(true);

        // 뉴스 목록 조회 (최신순, PICK 뉴스 우선)
        // is_pick이 true인 뉴스 또는 최신 뉴스 중 상위 9개 가져오기
        const { data: newsData, error } = await supabase
          .from("news")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(9); // PICK 뉴스는 최대 9개 (3개씩 3그룹)

        if (error) {
          console.error("뉴스 로드 오류:", error);
          // 에러 발생 시 빈 배열로 설정
          setMainPickNews([]);
          return;
        }

        // Supabase 데이터를 NewsCarousel 형식으로 변환
        const transformedNews: NewsItem[] = (newsData || []).map((news) => {
          // 본문에서 첫 번째 이미지 추출 (우선순위: content 첫 이미지 > image_url > 랜덤 placeholder)
          const firstImageFromContent = getFirstImageFromContent(news.content);
          const thumbnailImage =
            firstImageFromContent ||
            news.image_url ||
            getRandomPlaceholderLarge(news.id);

          return {
            id: news.id,
            image: thumbnailImage,
            headline: news.headline || "제목 없음",
            timestamp: formatRelativeTime(news.created_at),
          };
        });

        setMainPickNews(transformedNews);
      } catch (error) {
        console.error("뉴스 로드 중 예외 발생:", error);
        setMainPickNews([]);
      } finally {
        setIsLoadingNews(false);
      }
    };

    loadNews();
  }, [supabase]);

  // 실시간 뉴스 데이터 가져오기 (전체 및 PICK)
  useEffect(() => {
    if (!supabase) return;

    const loadRealtimeNews = async () => {
      try {
        setIsLoadingRealtimeNews(true);

        // 전체 뉴스 조회 (최신순, 제한 없음)
        const { data: allNewsData, error: allError } = await supabase
          .from("news")
          .select("*")
          .order("created_at", { ascending: false });

        // 전체 뉴스 데이터 변환
        if (allError) {
          console.error("전체 뉴스 로드 오류:", allError);
          setAllNews([]);
        } else {
          const transformedAllNews: NewsItem[] = (allNewsData || []).map(
            (news) => {
              // 본문에서 첫 번째 이미지 추출 (우선순위 1)
              const firstImageFromContent = getFirstImageFromContent(
                news.content,
              );
              // 본문에 이미지가 없을 때만 image_url 또는 랜덤 placeholder 사용
              const thumbnailImage =
                firstImageFromContent ||
                news.image_url ||
                getRandomPlaceholderThumbnail(news.id);

              return {
                id: news.id,
                image: thumbnailImage,
                headline: news.headline || "제목 없음",
                timestamp: formatRelativeTime(news.created_at),
              };
            },
          );
          setAllNews(transformedAllNews);
        }

        // PICK 뉴스 조회 (is_pick이 true인 뉴스, 최신순)
        // is_pick 필드가 없을 수 있으므로 에러 처리
        try {
          const pickResult = await supabase
            .from("news")
            .select("*")
            .eq("is_pick", true)
            .order("created_at", { ascending: false });

          if (pickResult.error) {
            // is_pick 컬럼이 없거나 RLS 등으로 인한 예상 가능한 오류 - 조용히 처리
            setPickNews([]);
          } else {
            // PICK 뉴스 데이터 변환
            const pickNewsData = pickResult.data || [];
            const transformedPickNews: NewsItem[] = pickNewsData.map((news) => {
              // 본문에서 첫 번째 이미지 추출 (우선순위 1)
              const firstImageFromContent = getFirstImageFromContent(
                news.content,
              );
              // 본문에 이미지가 없을 때만 image_url 또는 랜덤 placeholder 사용
              const thumbnailImage =
                firstImageFromContent ||
                news.image_url ||
                getRandomPlaceholderThumbnail(news.id);

              return {
                id: news.id,
                image: thumbnailImage,
                headline: news.headline || "제목 없음",
                timestamp: formatRelativeTime(news.created_at),
              };
            });
            setPickNews(transformedPickNews);
          }
        } catch (err) {
          // is_pick 필드가 없는 경우 빈 배열로 처리
          console.warn(
            "PICK 뉴스 조회 실패 (is_pick 필드가 없을 수 있음):",
            err,
          );
          setPickNews([]);
        }
      } catch (error) {
        console.error("실시간 뉴스 로드 중 예외 발생:", error);
        setAllNews([]);
        setPickNews([]);
      } finally {
        setIsLoadingRealtimeNews(false);
      }
    };

    loadRealtimeNews();
  }, [supabase]);

  // mainPickNews를 3개씩 묶어서 newsGroups 생성
  const newsGroups: NewsItem[][] = [];
  for (let i = 0; i < mainPickNews.length; i += 3) {
    newsGroups.push(mainPickNews.slice(i, i + 3));
  }

  return (
    <div className="bg-muted py-4 ">
      <div className="container mx-auto space-y-4">
        {/* 메인 페이지 제목 (SEO를 위한 H1 태그) */}
        <h1 className="sr-only">비트스포 - 암호화폐 온라인 스포츠</h1>

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
              {isLoadingNews ? (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">뉴스를 불러오는 중...</p>
                </div>
              ) : newsGroups.length === 0 ? (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">
                    표시할 뉴스가 없습니다.
                  </p>
                </div>
              ) : (
                <NewsCarousel newsGroups={newsGroups} />
              )}
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
              <Tabs defaultValue="all" className="w-full">
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
                  {isLoadingRealtimeNews ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        뉴스를 불러오는 중...
                      </p>
                    </div>
                  ) : allNews.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        표시할 뉴스가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allNews.map((news) => (
                        <Link key={news.id} href={`/news/${news.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer border-none shadow-none bg-transparent">
                            <CardContent className="p-0">
                              <div className="flex gap-4">
                                {/* 썸네일 이미지 */}
                                <div className="shrink-0 w-24 h-24 rounded overflow-hidden bg-muted">
                                  <NewsImage
                                    src={news.image}
                                    alt={news.headline}
                                    newsId={news.id}
                                  />
                                </div>
                                {/* 제목과 시간 */}
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                  <h3 className="text-base font-semibold line-clamp-2 mb-2 text-foreground hover:text-primary transition-colors">
                                    {news.headline}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {news.timestamp}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>
                {/* 뉴스 리스트 - PICK 탭 */}
                <TabsContent value="pick" className="mt-6">
                  {isLoadingRealtimeNews ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        뉴스를 불러오는 중...
                      </p>
                    </div>
                  ) : pickNews.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        표시할 PICK 뉴스가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pickNews.map((news) => (
                        <Link key={news.id} href={`/news/${news.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer border-none shadow-none bg-transparent">
                            <CardContent className="p-0">
                              <div className="flex gap-4">
                                {/* 썸네일 이미지 */}
                                <div className="shrink-0 w-24 h-24 rounded overflow-hidden bg-muted">
                                  <NewsImage
                                    src={news.image}
                                    alt={news.headline}
                                    newsId={news.id}
                                  />
                                </div>
                                {/* 제목과 시간 */}
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                  <h3 className="text-base font-semibold line-clamp-2 mb-2 text-foreground hover:text-primary transition-colors">
                                    {news.headline}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {news.timestamp}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
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
