import type { Metadata } from "next";
import { SectionPlaceholderPage } from "../_components/section-placeholder-page";

export const metadata: Metadata = {
  title: "Crypto",
  description:
    "비트코인, 이더리움 등 암호화폐 시세와 시장 분석을 제공하는 비트스포 Crypto 섹션입니다.",
};

export default function CryptoPage() {
  return (
    <SectionPlaceholderPage
      title="Crypto"
      description="암호화폐 시세, 시장 동향, 블록체인 뉴스를 실시간으로 확인하세요."
    />
  );
}
