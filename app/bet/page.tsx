import type { Metadata } from "next";
import { SectionPlaceholderPage } from "../_components/section-placeholder-page";

export const metadata: Metadata = {
  title: "Bet",
  description:
    "스포츠·암호화폐 베팅 인사이트와 가이드를 제공하는 비트스포 Bet 섹션입니다.",
};

export default function BetPage() {
  return (
    <SectionPlaceholderPage
      title="Bet"
      description="베팅 전략, 오즈 분석, 리스크 가이드 등 인사이트 콘텐츠를 준비하고 있습니다."
    />
  );
}
