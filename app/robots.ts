import { MetadataRoute } from "next";

/**
 * robots.txt 생성 함수
 * 검색 엔진 크롤러에게 사이트 크롤링 규칙 제공
 * SEO 최적화를 위해 색인 가능한 페이지와 불가능한 페이지를 명확히 구분
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/", // 홈페이지 허용
          "/news", // 뉴스 목록 페이지 허용
          "/news/*", // 뉴스 상세 페이지 허용
          "/community", // 커뮤니티 목록 페이지 허용
          "/community/*", // 커뮤니티 상세 페이지 허용
        ],
        disallow: [
          "/api/", // API 라우트는 크롤링 제외
          "/dashboard/", // 대시보드 페이지는 크롤링 제외 (사용자 전용)
          "/auth/", // 인증 페이지는 크롤링 제외 (로그인/회원가입)
          "/_next/", // Next.js 내부 파일 제외
          "/*.json$", // JSON 파일 제외
          "/*?*", // 쿼리 파라미터가 있는 URL 제외 (중복 콘텐츠 방지)
        ],
      },
      // Google 봇에 대한 특별 규칙
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/news",
          "/news/*",
          "/community",
          "/community/*",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/auth/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
