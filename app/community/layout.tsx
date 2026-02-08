import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티 - 비트스포",
  description:
    "비트코인, 이더리움 등 암호화폐 관련 토론과 정보를 공유하는 비트스포 커뮤니티입니다. 실시간 시장 분석, 투자 전략, 코인 정보를 자유롭게 나누고 소통하세요.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


