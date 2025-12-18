import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 인증 관련 페이지는 동적으로 렌더링 (prerendering 방지)
  experimental: {
    // 동적 렌더링 강제
  },
};

export default nextConfig;
