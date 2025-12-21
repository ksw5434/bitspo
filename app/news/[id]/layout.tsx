import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

// 동적 메타데이터 생성 함수
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    // Next.js 최신 버전에서는 params가 Promise이므로 await로 해제해야 함
    const { id } = await params;
    const supabase = await createClient();
    const { data: news } = await supabase
      .from("news")
      .select("headline, content")
      .eq("id", id)
      .single();

    if (news) {
      // HTML 태그 제거하여 description 생성
      const description = news.content
        ? news.content.replace(/<[^>]*>/g, "").substring(0, 160) + "..."
        : news.headline;

      return {
        title: `${news.headline} - 비트스포`,
        description: description,
      };
    }
  } catch (error) {
    console.error("메타데이터 생성 오류:", error);
  }

  // 기본 메타데이터
  return {
    title: "뉴스 상세 - 비트스포",
    description: "암호화폐 관련 최신 뉴스와 심층 분석을 확인하세요.",
  };
}

export default function NewsDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
