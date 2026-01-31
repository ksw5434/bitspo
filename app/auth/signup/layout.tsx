import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 비트스포",
  description: "비트스포에 가입하여 암호화폐 뉴스와 커뮤니티를 이용하세요.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





