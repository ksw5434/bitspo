import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bet",
  description:
    "스포츠·암호화폐 베팅 인사이트와 가이드를 제공하는 비트스포 Bet 섹션입니다.",
};

export default function BetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
