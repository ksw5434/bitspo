import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "뉴스 관리 - 비트스포",
  description: "관리자용 뉴스 작성 및 관리 페이지입니다.",
};

export default function DashboardNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





