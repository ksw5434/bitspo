/**
 * 시장 티커(코인·환율·지수) 타입 및 포맷 유틸
 */

export interface MarketTickerItem {
  id: string;
  label: string;
  /** 표시용 포맷된 값 (예: $78,197.80) */
  value: string;
  /** 원시 숫자 (정렬·변동 표시 등 확장용) */
  raw: number | null;
}

export interface MarketTickerResponse {
  items: MarketTickerItem[];
  updatedAt: string;
  /** 일부 소스 실패 시 true */
  hasPartialError?: boolean;
}

/** 티커 스켈레톤용 라벨 목록 (UI와 API 순서 동기화) */
export const MARKET_TICKER_LABELS = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "XRP/USD",
  "BNB/USD",
  "DOGE/USD",
  "ADA/USD",
  "LINK/USD",
  "USD/EUR",
  "USD/GBP",
  "USD/JPY",
  "USD/KRW",
  "NASDAQ",
  "S&P 500",
  "Dow Jones",
  "KOSPI",
] as const;

/** USD 금액 포맷 (코인·지수) */
export function formatUsdPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/** 소액·저가 코인용 (4자리 소수) */
export function formatUsdPricePrecise(price: number): string {
  if (price >= 1) {
    return formatUsdPrice(price);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(price);
}

/** USD/EUR·GBP 등 (1 USD = n 외화) */
export function formatUsdForexRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate);
}

/** USD/JPY */
export function formatUsdJpyRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

/** USD/KRW */
export function formatUsdKrwRate(rate: number): string {
  return `₩${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(rate)}`;
}

/** 주가 지수 */
export function formatIndexPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/** KOSPI 등 원화 지수 */
export function formatKospiIndex(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(price);
}

/** 헤더 티커 기본값 (API 로드 전·조회 실패 시 표시) */
export const DEFAULT_MARKET_TICKER_ITEMS: MarketTickerItem[] = [
  {
    id: "btc-usd",
    label: "BTC/USD",
    raw: 74091.0,
    value: formatUsdPrice(74091.0),
  },
  {
    id: "eth-usd",
    label: "ETH/USD",
    raw: 2031.02,
    value: formatUsdPrice(2031.02),
  },
  {
    id: "sol-usd",
    label: "SOL/USD",
    raw: 83.14,
    value: formatUsdPrice(83.14),
  },
  {
    id: "xrp-usd",
    label: "XRP/USD",
    raw: 1.34,
    value: formatUsdPricePrecise(1.34),
  },
  {
    id: "bnb-usd",
    label: "BNB/USD",
    raw: 733.08,
    value: formatUsdPrice(733.08),
  },
  {
    id: "doge-usd",
    label: "DOGE/USD",
    raw: 0.1011,
    value: formatUsdPricePrecise(0.1011),
  },
  {
    id: "ada-usd",
    label: "ADA/USD",
    raw: 0.2382,
    value: formatUsdPricePrecise(0.2382),
  },
  {
    id: "link-usd",
    label: "LINK/USD",
    raw: 9.24,
    value: formatUsdPrice(9.24),
  },
  {
    id: "usd-eur",
    label: "USD/EUR",
    raw: 0.8588,
    value: formatUsdForexRate(0.8588),
  },
  {
    id: "usd-gbp",
    label: "USD/GBP",
    raw: 0.7448,
    value: formatUsdForexRate(0.7448),
  },
  {
    id: "usd-jpy",
    label: "USD/JPY",
    raw: 159.27,
    value: formatUsdJpyRate(159.27),
  },
  {
    id: "usd-krw",
    label: "USD/KRW",
    raw: 1506,
    value: formatUsdKrwRate(1506),
  },
  {
    id: "nasdaq",
    label: "NASDAQ",
    raw: 26972.62,
    value: formatIndexPrice(26972.62),
  },
  {
    id: "sp500",
    label: "S&P 500",
    raw: 7580.06,
    value: formatIndexPrice(7580.06),
  },
  {
    id: "dow",
    label: "Dow Jones",
    raw: 51032.46,
    value: formatIndexPrice(51032.46),
  },
  {
    id: "kospi",
    label: "KOSPI",
    raw: 8476.15,
    value: formatKospiIndex(8476.15),
  },
];

/** API 조회 실패 항목을 기본값으로 보완 */
export function mergeWithDefaultTickerItems(
  items: MarketTickerItem[],
): MarketTickerItem[] {
  const defaultById = new Map(
    DEFAULT_MARKET_TICKER_ITEMS.map((item) => [item.id, item]),
  );

  return items.map((item) => {
    if (item.raw !== null) {
      return item;
    }

    return defaultById.get(item.id) ?? item;
  });
}

const COINGECKO_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "ripple",
  "binancecoin",
  "dogecoin",
  "cardano",
  "chainlink",
] as const;

const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS.join(",")}&vs_currencies=usd`;

const FRANKFURTER_URL =
  "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,KRW";

const YAHOO_INDICES: { id: string; label: string; symbol: string }[] = [
  { id: "nasdaq", label: "NASDAQ", symbol: "%5EIXIC" },
  { id: "sp500", label: "S&P 500", symbol: "%5EGSPC" },
  { id: "dow", label: "Dow Jones", symbol: "%5EDJI" },
  { id: "kospi", label: "KOSPI", symbol: "%5EKS11" },
];

const FETCH_OPTIONS: RequestInit = {
  next: { revalidate: 30 },
  headers: { Accept: "application/json" },
};

const YAHOO_HEADERS = {
  ...FETCH_OPTIONS.headers,
  "User-Agent": "Mozilla/5.0 (compatible; BitspoMarketTicker/1.0)",
};

type CoinGeckoPriceMap = Partial<
  Record<(typeof COINGECKO_IDS)[number], { usd?: number }>
>;

/** CoinGecko에서 주요 코인 USD 시세 */
async function fetchCryptoUsdPrices(): Promise<CoinGeckoPriceMap> {
  try {
    const response = await fetch(COINGECKO_URL, FETCH_OPTIONS);
    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }
    return (await response.json()) as CoinGeckoPriceMap;
  } catch (error) {
    console.error("코인 시세 조회 실패:", error);
    return {};
  }
}

/** Frankfurter에서 USD 기준 환율 */
async function fetchUsdForexRates(): Promise<{
  eur: number | null;
  gbp: number | null;
  jpy: number | null;
  krw: number | null;
}> {
  try {
    const response = await fetch(FRANKFURTER_URL, FETCH_OPTIONS);
    if (!response.ok) {
      throw new Error(`Frankfurter HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
      rates?: { EUR?: number; GBP?: number; JPY?: number; KRW?: number };
    };
    const rates = data.rates ?? {};
    return {
      eur: typeof rates.EUR === "number" ? rates.EUR : null,
      gbp: typeof rates.GBP === "number" ? rates.GBP : null,
      jpy: typeof rates.JPY === "number" ? rates.JPY : null,
      krw: typeof rates.KRW === "number" ? rates.KRW : null,
    };
  } catch (error) {
    console.error("환율 조회 실패:", error);
    return { eur: null, gbp: null, jpy: null, krw: null };
  }
}

/** Yahoo Finance 지수 시세 */
async function fetchYahooIndex(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { ...FETCH_OPTIONS, headers: YAHOO_HEADERS },
    );
    if (!response.ok) {
      throw new Error(`Yahoo Finance HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
    };
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" ? price : null;
  } catch (error) {
    console.error(`지수 조회 실패 (${symbol}):`, error);
    return null;
  }
}

async function fetchAllIndices(): Promise<Record<string, number | null>> {
  const results = await Promise.all(
    YAHOO_INDICES.map(async (index) => ({
      id: index.id,
      price: await fetchYahooIndex(index.symbol),
    })),
  );
  return Object.fromEntries(results.map((r) => [r.id, r.price]));
}

function buildTickerItem(
  id: string,
  label: string,
  raw: number | null,
  formatter: (value: number) => string,
): MarketTickerItem {
  return {
    id,
    label,
    raw,
    value: raw !== null ? formatter(raw) : "—",
  };
}

function readCoinPrice(
  data: CoinGeckoPriceMap,
  coinId: (typeof COINGECKO_IDS)[number],
): number | null {
  const price = data[coinId]?.usd;
  return typeof price === "number" ? price : null;
}

/** 외부 API 병렬 조회 후 티커 응답 생성 */
export async function fetchMarketTickerData(): Promise<MarketTickerResponse> {
  const [crypto, forex, indices] = await Promise.all([
    fetchCryptoUsdPrices(),
    fetchUsdForexRates(),
    fetchAllIndices(),
  ]);

  const items: MarketTickerItem[] = [
    buildTickerItem(
      "btc-usd",
      "BTC/USD",
      readCoinPrice(crypto, "bitcoin"),
      formatUsdPrice,
    ),
    buildTickerItem(
      "eth-usd",
      "ETH/USD",
      readCoinPrice(crypto, "ethereum"),
      formatUsdPrice,
    ),
    buildTickerItem(
      "sol-usd",
      "SOL/USD",
      readCoinPrice(crypto, "solana"),
      formatUsdPrice,
    ),
    buildTickerItem(
      "xrp-usd",
      "XRP/USD",
      readCoinPrice(crypto, "ripple"),
      formatUsdPricePrecise,
    ),
    buildTickerItem(
      "bnb-usd",
      "BNB/USD",
      readCoinPrice(crypto, "binancecoin"),
      formatUsdPrice,
    ),
    buildTickerItem(
      "doge-usd",
      "DOGE/USD",
      readCoinPrice(crypto, "dogecoin"),
      formatUsdPricePrecise,
    ),
    buildTickerItem(
      "ada-usd",
      "ADA/USD",
      readCoinPrice(crypto, "cardano"),
      formatUsdPricePrecise,
    ),
    buildTickerItem(
      "link-usd",
      "LINK/USD",
      readCoinPrice(crypto, "chainlink"),
      formatUsdPrice,
    ),
    buildTickerItem("usd-eur", "USD/EUR", forex.eur, formatUsdForexRate),
    buildTickerItem("usd-gbp", "USD/GBP", forex.gbp, formatUsdForexRate),
    buildTickerItem("usd-jpy", "USD/JPY", forex.jpy, formatUsdJpyRate),
    buildTickerItem("usd-krw", "USD/KRW", forex.krw, formatUsdKrwRate),
    buildTickerItem(
      "nasdaq",
      "NASDAQ",
      indices.nasdaq ?? null,
      formatIndexPrice,
    ),
    buildTickerItem(
      "sp500",
      "S&P 500",
      indices.sp500 ?? null,
      formatIndexPrice,
    ),
    buildTickerItem(
      "dow",
      "Dow Jones",
      indices.dow ?? null,
      formatIndexPrice,
    ),
    buildTickerItem(
      "kospi",
      "KOSPI",
      indices.kospi ?? null,
      formatKospiIndex,
    ),
  ];

  const hasPartialError = items.some((item) => item.raw === null);

  return {
    items: mergeWithDefaultTickerItems(items),
    updatedAt: new Date().toISOString(),
    hasPartialError,
  };
}
