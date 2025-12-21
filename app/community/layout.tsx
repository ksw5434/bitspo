import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티 - 비트스포",
  description: "암호화폐 관련 토론과 정보를 공유하는 커뮤니티입니다.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


