import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports",
  description:
    "NBA, NFL, MLB, GOLF 스포츠 뉴스와 경기 정보를 제공하는 비트스포 Sports 섹션입니다.",
};

export default function SportsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
