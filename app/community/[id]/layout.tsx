import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * 커뮤니티 게시글 상세 페이지의 동적 메타데이터 생성
 * SEO 최적화를 위해 각 게시글의 제목과 내용을 기반으로 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // 게시글 데이터 조회
    const { data: post, error } = await supabase
      .from("communities")
      .select("title, content, image_url, created_at")
      .eq("id", id)
      .single();

    // 게시글을 찾을 수 없는 경우 기본 메타데이터 반환
    if (error || !post) {
      return {
        title: "게시글을 찾을 수 없습니다 - 비트스포",
        description: "요청하신 게시글을 찾을 수 없습니다.",
      };
    }

    // 본문에서 텍스트 추출 (HTML 태그 제거)
    const extractText = (html: string | null): string => {
      if (!html) return "";
      // HTML 태그 제거 및 공백 정리
      return html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 200); // 최대 200자로 제한
    };

    const contentText = extractText(post.content);
    const description =
      contentText.length > 0
        ? `${contentText}...`
        : "암호화폐 관련 토론과 정보를 공유하는 비트스포 커뮤니티의 게시글입니다.";

    // 메타 description이 너무 짧으면 기본 설명으로 대체 (최소 120자 이상 권장)
    const finalDescription =
      description.length < 120
        ? `${post.title}. ${description} 비트스포 커뮤니티에서 암호화폐 관련 정보를 공유하고 토론하세요.`
        : description;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com";
    const imageUrl = post.image_url || `${siteUrl}/logo.png`;

    return {
      title: `${post.title} - 비트스포 커뮤니티`,
      description: finalDescription,
      keywords: [
        "비트코인",
        "이더리움",
        "암호화폐",
        "블록체인",
        "가상화폐",
        "코인토론",
        "암호화폐커뮤니티",
        "비트스포",
      ],
      openGraph: {
        type: "article",
        locale: "ko_KR",
        url: `${siteUrl}/community/${id}`,
        siteName: "비트스포",
        title: post.title,
        description: finalDescription,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        publishedTime: post.created_at,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: finalDescription,
        images: [imageUrl],
        creator: "@bitspo",
      },
      alternates: {
        canonical: `${siteUrl}/community/${id}`,
      },
    };
  } catch (error) {
    // 에러 발생 시 기본 메타데이터 반환
    console.error("메타데이터 생성 오류:", error);
    return {
      title: "커뮤니티 게시글 - 비트스포",
      description:
        "암호화폐 관련 토론과 정보를 공유하는 비트스포 커뮤니티의 게시글입니다.",
    };
  }
}

/**
 * 커뮤니티 게시글 상세 페이지 레이아웃
 */
export default function CommunityPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
