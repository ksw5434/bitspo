/** 헤더·사이드바 등에서 공통으로 사용하는 트렌딩 코인 목록 */
export const TRENDING_COINS = ["SOL", "BTC", "USDT", "ONDO", "ETH"] as const;

interface TrendingCoinsSectionProps {
  className?: string;
}

/**
 * Trending Coins 사이드바 섹션
 */
export function TrendingCoinsSection({
  className = "",
}: TrendingCoinsSectionProps) {
  return (
    <div className={`bg-card rounded-lg p-4 ${className}`.trim()}>
      <h3 className="text-lg font-semibold mb-4">Trending Coins</h3>
      <div className="flex flex-wrap gap-2">
        {TRENDING_COINS.map((coin) => (
          <span
            key={coin}
            className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            {coin}
          </span>
        ))}
      </div>
    </div>
  );
}
