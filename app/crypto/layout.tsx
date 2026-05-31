import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto",
  description:
    "비트코인, 이더리움 등 암호화폐 시세와 시장 분석을 제공하는 비트스포 Crypto 섹션입니다.",
};

export default function CryptoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
