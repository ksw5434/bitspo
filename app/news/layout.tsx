import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News - 비트스포",
  description:
    "비트스포 최신 뉴스와 시장 분석 기사를 확인하세요. 스포츠, 암호화폐 등 다양한 분야의 뉴스를 제공합니다.",
};

export default function DashboardNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





