import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "뉴스 상세 - 비트스포",
  description: "뉴스 상세 내용을 확인할 수 있는 페이지입니다.",
};

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
                  <p>문의사항 help@bloomingbit.io</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span>*bloomingbit</span>
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
