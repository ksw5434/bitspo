import type { Metadata } from "next";
import { SectionPlaceholderPage } from "../_components/section-placeholder-page";

export const metadata: Metadata = {
  title: "Sports",
  description:
    "스포츠 뉴스, 경기 일정, 분석 콘텐츠를 제공하는 비트스포 Sports 섹션입니다.",
};

export default function SportsPage() {
  return (
    <SectionPlaceholderPage
      title="Sports"
      description="스포츠 최신 소식, 경기 하이라이트, 전문가 분석을 한곳에서 만나보세요."
    />
  );
}
