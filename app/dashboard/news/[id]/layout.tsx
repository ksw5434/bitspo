import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "뉴스 상세 - 비트스포",
  description: "뉴스 상세 내용을 확인하고 관리할 수 있는 페이지입니다.",
};

export default function DashboardNewsDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


