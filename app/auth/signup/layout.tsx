import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 비트스포",
  description:
    "비트스포에 가입하여 비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석, 커뮤니티 토론을 이용하세요. 무료 회원가입으로 시작하세요.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





