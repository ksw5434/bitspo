import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * 사이트맵 생성 함수
 * 검색 엔진이 사이트의 모든 페이지를 크롤링할 수 있도록 사이트맵 제공
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com";

  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const supabase = await createClient();

    // 뉴스 페이지들 가져오기
    const { data: newsList, error: newsError } = await supabase
      .from("news")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000); // 최대 1000개까지 (사이트맵 크기 제한 고려)

    // 커뮤니티 게시글들 가져오기
    const { data: communityList, error: communityError } = await supabase
      .from("communities")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000); // 최대 1000개까지

    // 뉴스 페이지 사이트맵 생성
    const newsPages: MetadataRoute.Sitemap =
      newsList && !newsError
        ? newsList.map((news) => ({
            url: `${siteUrl}/news/${news.id}`,
            lastModified: new Date(news.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }))
        : [];

    // 커뮤니티 페이지 사이트맵 생성
    const communityPages: MetadataRoute.Sitemap =
      communityList && !communityError
        ? communityList.map((post) => ({
            url: `${siteUrl}/community/${post.id}`,
            lastModified: new Date(post.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }))
        : [];

    // 에러 발생 시 로깅 (사이트맵 생성은 계속 진행)
    if (newsError) {
      console.warn("뉴스 사이트맵 생성 중 오류:", newsError);
    }
    if (communityError) {
      console.warn("커뮤니티 사이트맵 생성 중 오류:", communityError);
    }

    // 모든 페이지 합치기
    return [...staticPages, ...newsPages, ...communityPages];
  } catch (error) {
    // 에러 발생 시 정적 페이지만 반환
    console.error("사이트맵 생성 중 오류:", error);
    return staticPages;
  }
}
