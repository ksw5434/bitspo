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
  description: "비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석을 제공하는 종합 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${roboto.variable} antialiased pt-28`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
