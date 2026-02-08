import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "./_components/header";
import Footer from "./_components/footer";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // Roboto 폰트의 다양한 굵기 설정
});

export const metadata: Metadata = {
  title: {
    default: "비트스포 - 암호화폐 뉴스 플랫폼",
    template: "%s | 비트스포",
  },
  description:
    "비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석을 제공하는 종합 플랫폼입니다. 실시간 암호화폐 시세, 전문가 분석, 커뮤니티 토론까지 한 곳에서 만나보세요.",
  keywords: [
    "비트코인",
    "이더리움",
    "암호화폐",
    "블록체인",
    "가상화폐",
    "코인뉴스",
    "암호화폐뉴스",
    "비트스포",
  ],
  authors: [{ name: "비트스포" }],
  creator: "비트스포",
  publisher: "비트스포",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "비트스포",
    title: "비트스포 - 암호화폐 뉴스 플랫폼",
    description:
      "비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석을 제공하는 종합 플랫폼입니다. 실시간 암호화폐 시세, 전문가 분석, 커뮤니티 토론까지 한 곳에서 만나보세요.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "비트스포 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "비트스포 - 암호화폐 뉴스 플랫폼",
    description:
      "비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석을 제공하는 종합 플랫폼입니다.",
    images: ["/logo.png"],
    creator: "@bitspo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="lkswNHerzCZ9k+NDEZ//Cg"
          async
        ></script>
      </head>
      <body className={`${roboto.variable} antialiased pt-28`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
