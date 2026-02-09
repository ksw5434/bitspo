import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 인증 관련 페이지는 동적으로 렌더링 (prerendering 방지)
  experimental: {
    // 동적 렌더링 강제
  },
  
  // HTTP to HTTPS 리다이렉트 설정
  async headers() {
    return [
      {
        // 모든 경로에 적용
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  
  // 리다이렉트 설정 (HTTP to HTTPS는 호스팅 플랫폼에서 처리)
  async redirects() {
    return [
      // 필요시 추가 리다이렉트 규칙을 여기에 추가
      // 예: www 제거, trailing slash 처리 등
    ];
  },
};

export default nextConfig;
