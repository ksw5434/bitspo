import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * 뉴스 상세 페이지의 동적 메타데이터 생성
 * SEO 최적화를 위해 각 뉴스의 제목과 내용을 기반으로 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // 뉴스 데이터 조회
    const { data: news, error } = await supabase
      .from("news")
      .select("headline, content, image_url, created_at")
      .eq("id", id)
      .single();

    // 뉴스를 찾을 수 없는 경우 기본 메타데이터 반환
    if (error || !news) {
      return {
        title: "뉴스를 찾을 수 없습니다 - 비트스포",
        description: "요청하신 뉴스를 찾을 수 없습니다.",
      };
    }

    // 본문에서 텍스트 추출 (HTML 태그 제거)
    const extractText = (html: string | null): string => {
      if (!html) return "";
      // HTML 태그 제거 및 공백 정리
      return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    };

    const contentText = extractText(news.content);

    // 메타 description 생성 (120-160자 권장, 최대 160자)
    let description = "";
    if (contentText.length > 0) {
      // 내용이 충분히 긴 경우
      if (contentText.length >= 120) {
        description = contentText.substring(0, 160).trim();
        // 문장이 중간에 끊기지 않도록 마지막 공백이나 구두점에서 자름
        const lastSpace = description.lastIndexOf(" ");
        const lastPeriod = description.lastIndexOf(".");
        const cutPoint = Math.max(lastSpace, lastPeriod);
        if (cutPoint > 100) {
          description = description.substring(0, cutPoint + 1);
        }
      } else {
        // 내용이 짧은 경우 헤드라인과 함께 조합
        description = `${news.headline}. ${contentText} 비트스포에서 암호화폐 최신 뉴스와 시장 분석을 확인하세요.`;
      }
    } else {
      // 내용이 없는 경우 기본 설명 사용
      description = `${news.headline}. 비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석을 제공하는 비트스포의 뉴스입니다. 전문가 분석과 실시간 시세 정보를 확인하세요.`;
    }

    // 최종 description 길이 확인 및 보정 (최소 120자, 최대 160자)
    const finalDescription =
      description.length < 120
        ? `${description} 비트스포에서 암호화폐 최신 뉴스를 확인하세요.`
        : description.length > 160
          ? description.substring(0, 157).trim() + "..."
          : description;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bitspo.com";
    const imageUrl = news.image_url || `${siteUrl}/logo.png`;

    return {
      title: `${news.headline} - 비트스포`,
      description: finalDescription,
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
      openGraph: {
        type: "article",
        locale: "ko_KR",
        url: `${siteUrl}/news/${id}`,
        siteName: "비트스포",
        title: news.headline,
        description: finalDescription,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: news.headline,
          },
        ],
        publishedTime: news.created_at,
      },
      twitter: {
        card: "summary_large_image",
        title: news.headline,
        description: finalDescription,
        images: [imageUrl],
        creator: "@bitspo",
      },
      alternates: {
        canonical: `${siteUrl}/news/${id}`,
      },
    };
  } catch (error) {
    // 에러 발생 시 기본 메타데이터 반환
    console.error("메타데이터 생성 오류:", error);
    return {
      title: "뉴스 상세 - 비트스포",
      description:
        "비트코인, 이더리움 등 암호화폐 최신 뉴스와 시장 분석을 제공하는 비트스포의 뉴스입니다.",
    };
  }
}

/**
 * 뉴스 상세 페이지 레이아웃 - 네이버 스포츠 스타일
 * 본문(2/3) + 사이드바(1/3) 구조
 */
export default function NewsDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted min-h-screen">
      <div className="container mx-auto px-4 py-4">
        {/* 네이버 스포츠 스타일 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 본문 영역 (2/3) */}
          <div className="lg:col-span-2">{children}</div>

          {/* 사이드바 영역 (1/3) - 모바일에서는 아래로 배치 */}
          <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-[calc(var(--navigation-height)+12px)] lg:self-start">
            {/* 조회수 급상승 코인 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">조회수 급상승 코인</h3>
              <div className="flex flex-wrap gap-2">
                {["SOL", "BTC", "USDT", "ONDO", "ETH"].map((coin) => (
                  <span
                    key={coin}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {coin}
                  </span>
                ))}
              </div>
            </div>

            {/* 비트스포 정보 */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                비트스포
              </h3>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex flex-wrap gap-2">
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    공지사항
                  </span>
                  <span>|</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    기자소개
                  </span>
                  <span>|</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    인재채용
                  </span>
                  <span>|</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    커뮤니티 운영정책
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    이용약관
                  </span>
                  <span>|</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    개인정보처리방침
                  </span>
                  <span>|</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    윤리강령
                  </span>
                  <span>|</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    청소년보호정책
                  </span>
                </div>
                <div className="pt-2">
                  <p>문의사항 help@bitspo.io</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span>*bitspo</span>
                  <span className="text-gray-400">▼</span>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    📤
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
