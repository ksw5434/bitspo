import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { NewsImage } from "@/app/dashboard/news/news-image";

// 랭킹 뉴스 아이템 타입 정의
interface RankingNewsItem {
  rank: number;
  image: string;
  headline: string;
  timestamp: string;
}

// 뉴스 섹션 컴포넌트 Props 타입
interface NewsSectionProps {
  newsItems: RankingNewsItem[];
}

export function NewsSection({ newsItems }: NewsSectionProps) {
  return (
    <div className="lg:col-span-1 space-y-2 py-4 bg-card rounded-lg flex flex-col">
      <h2 className="text-2xl font-bold px-4">랭킹 뉴스</h2>
      <div className="space-y-0 flex-1 flex flex-col">
        {newsItems.map((news) => (
          <Card
            key={news.rank}
            className="outline-none shadow-none border-none"
          >
            <CardContent className="py-1 px-4">
              <div className="flex gap-4">
                {/* 랭킹 번호 */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded">
                  {news.rank}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold line-clamp-2 mb-2">
                    {news.headline}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {news.timestamp}
                  </p>
                </div>
                {/* 이미지 */}
                <div className="size-16">
                  <NewsImage src={news.image} alt={news.headline} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {/* 페이지네이션 */}
        <div className="flex items-center justify-center gap-2 my-4">
          <Button variant="outline" size="sm" disabled>
            &lt;
          </Button>
          <span className="text-sm text-muted-foreground">1 / 4</span>
          <Button variant="outline" size="sm">
            &gt;
          </Button>
        </div>
      </div>
    </div>
  );
}
