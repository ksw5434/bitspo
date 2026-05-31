"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_MARKET_TICKER_ITEMS,
  type MarketTickerItem,
  type MarketTickerResponse,
} from "@/lib/market-ticker";

/** 클라이언트 폴링 간격 (ms) — CoinGecko 무료 한도 고려 */
const TICKER_REFRESH_MS = 30_000;

/**
 * 메뉴 하단 · Sports News 상단 시장 티커 바
 * /api/market-ticker 를 주기적으로 호출해 시세를 갱신합니다.
 */
export function MarketTickerBar() {
  const [tickerItems, setTickerItems] = useState<MarketTickerItem[]>(
    DEFAULT_MARKET_TICKER_ITEMS,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchTicker = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const response = await fetch("/api/market-ticker", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as MarketTickerResponse;

      if (!data.items?.length) {
        throw new Error("빈 응답");
      }

      setTickerItems(data.items);
      setLoadError(
        data.hasPartialError ? "일부 시세를 불러오지 못했습니다." : null,
      );
    } catch (error) {
      console.error("티커 조회 오류:", error);
      setLoadError("시세를 불러오지 못했습니다. 잠시 후 다시 시도합니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTicker();
    const intervalId = window.setInterval(fetchTicker, TICKER_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchTicker]);

  return (
    <section
      className="border-b border-border bg-card/80 backdrop-blur-sm"
      aria-label="실시간 시장 시세"
    >
      <div className="container mx-auto px-2 py-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {tickerItems.map((item) => (
            <div key={item.id} className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                {item.label}
              </span>
              <span
                className={`truncate text-xs font-semibold tabular-nums sm:text-sm ${
                  isRefreshing
                    ? "text-foreground/80"
                    : "text-foreground"
                }`}
                aria-live="polite"
                aria-busy={isRefreshing}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {loadError && (
          <p className="mt-2 text-xs text-muted-foreground" role="status">
            {loadError}
          </p>
        )}
      </div>
    </section>
  );
}
