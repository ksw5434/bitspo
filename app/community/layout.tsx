import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com";

export const metadata: Metadata = {
  title: "커뮤니티 - 비트스포",
  description:
    "비트코인, 이더리움 등 암호화폐 관련 토론과 정보를 공유하는 비트스포 커뮤니티입니다. 실시간 시장 분석, 투자 전략, 코인 정보를 자유롭게 나누고 소통하세요. 암호화폐 투자자들과 함께 의견을 나누고 최신 정보를 확인하세요.",
  keywords: [
    "비트코인",
    "이더리움",
    "암호화폐",
    "블록체인",
    "가상화폐",
    "코인토론",
    "암호화폐커뮤니티",
    "비트스포",
    "투자전략",
    "시장분석",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${siteUrl}/community`,
    siteName: "비트스포",
    title: "커뮤니티 - 비트스포",
    description:
      "비트코인, 이더리움 등 암호화폐 관련 토론과 정보를 공유하는 비트스포 커뮤니티입니다. 실시간 시장 분석, 투자 전략, 코인 정보를 자유롭게 나누고 소통하세요.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "비트스포 커뮤니티",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "커뮤니티 - 비트스포",
    description:
      "비트코인, 이더리움 등 암호화폐 관련 토론과 정보를 공유하는 비트스포 커뮤니티입니다.",
    images: [`${siteUrl}/logo.png`],
    creator: "@bitspo",
  },
  alternates: {
    canonical: `${siteUrl}/community`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


