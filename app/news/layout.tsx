import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "뉴스 관리 - 비트스포",
  description:
    "비트스포 관리자용 뉴스 작성 및 관리 페이지입니다. 암호화폐 최신 뉴스와 시장 분석 기사를 작성하고 관리할 수 있습니다.",
};

export default function DashboardNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





