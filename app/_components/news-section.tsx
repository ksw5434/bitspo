import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { NewsImage } from "@/app/news/news-image";

// TOP News 아이템 타입 정의
export interface RankingNewsItem {
  rank: number;
  image: string;
  headline: string;
  timestamp: string;
  href?: string;
}

// 뉴스 섹션 컴포넌트 Props 타입
interface NewsSectionProps {
  newsItems: RankingNewsItem[];
  className?: string;
  /** 페이지네이션 표시 여부 (사이드바 등 소량 목록에서는 false) */
  showPagination?: boolean;
}

export function NewsSection({
  newsItems,
  className = "",
  showPagination = true,
}: NewsSectionProps) {
  return (
    <div
      className={`space-y-2 py-4 bg-card rounded-lg flex flex-col ${className}`.trim()}
    >
      <h2 className="text-2xl font-bold px-4">TOP News</h2>
      <div className="space-y-0 flex-1 flex flex-col">
        {newsItems.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            표시할 뉴스가 없습니다.
          </p>
        ) : (
          newsItems.map((news) => (
            <Card
              key={news.rank}
              className="outline-none shadow-none border-none"
            >
              <CardContent className="py-1 px-4">
                {news.href ? (
                  <Link href={news.href} className="flex gap-4 group cursor-pointer">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded">
                      {news.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {news.headline}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {news.timestamp}
                      </p>
                    </div>
                    <div className="size-16 shrink-0">
                      <NewsImage
                        src={news.image}
                        alt={news.headline}
                        newsId={`ranking-${news.rank}`}
                      />
                    </div>
                  </Link>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded">
                      {news.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-2 mb-2">
                        {news.headline}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {news.timestamp}
                      </p>
                    </div>
                    <div className="size-16 shrink-0">
                      <NewsImage
                        src={news.image}
                        alt={news.headline}
                        newsId={`ranking-${news.rank}`}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
        {showPagination && newsItems.length > 0 && (
          <div className="flex items-center justify-center gap-2 my-4">
            <Button variant="outline" size="sm" disabled>
              &lt;
            </Button>
            <span className="text-sm text-muted-foreground">1 / 4</span>
            <Button variant="outline" size="sm">
              &gt;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
