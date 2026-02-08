import { MetadataRoute } from "next";

/**
 * robots.txt 생성 함수
 * 검색 엔진 크롤러에게 사이트 크롤링 규칙 제공
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // API 라우트는 크롤링 제외
          "/dashboard/", // 대시보드 페이지는 크롤링 제외
          "/auth/", // 인증 페이지는 크롤링 제외
          "/_next/", // Next.js 내부 파일 제외
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
