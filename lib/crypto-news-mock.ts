import type { NewsCardGridItem } from "@/app/_components/news-card-grid";
import type { RankingNewsItem } from "@/app/_components/news-section";
import { getRandomPlaceholderImage } from "@/lib/placeholder-image";

/** Crypto 뉴스 목업 원본 */
type CryptoNewsMockSource = {
  id: string;
  headline: string;
  authorName: string;
  daysAgo: number;
};

const CRYPTO_NEWS_MOCK_SOURCES: CryptoNewsMockSource[] = [
  {
    id: "crypto-mock-1",
    headline: "Bitcoin Surges Past $100K as ETF Inflows Hit Record High",
    authorName: "Alex Kim",
    daysAgo: 0,
  },
  {
    id: "crypto-mock-2",
    headline: "Ethereum Upgrade Boosts Network Speed and Lowers Gas Fees",
    authorName: "Sarah Lee",
    daysAgo: 0,
  },
  {
    id: "crypto-mock-3",
    headline: "Solana DeFi TVL Climbs 18% in Weekly Rally",
    authorName: "Mike Chen",
    daysAgo: 1,
  },
  {
    id: "crypto-mock-4",
    headline: "SEC Delays Decision on Spot XRP ETF Application",
    authorName: "Emily Park",
    daysAgo: 1,
  },
  {
    id: "crypto-mock-5",
    headline: "Whale Moves 12,000 BTC to Cold Storage Amid Volatility",
    authorName: "James Wilson",
    daysAgo: 2,
  },
  {
    id: "crypto-mock-6",
    headline: "Stablecoin Market Cap Tops $180B for First Time",
    authorName: "Lisa Brown",
    daysAgo: 2,
  },
  {
    id: "crypto-mock-7",
    headline: "Layer-2 Networks Process Record 50M Daily Transactions",
    authorName: "David Park",
    daysAgo: 3,
  },
  {
    id: "crypto-mock-8",
    headline: "Crypto Mining Difficulty Hits All-Time High After Halving",
    authorName: "Anna Martinez",
    daysAgo: 3,
  },
  {
    id: "crypto-mock-9",
    headline: "Major Bank Launches Custody Service for Digital Assets",
    authorName: "Tom Anderson",
    daysAgo: 4,
  },
  {
    id: "crypto-mock-10",
    headline: "NFT Trading Volume Rebounds on Ethereum and Solana",
    authorName: "Rachel Green",
    daysAgo: 4,
  },
  {
    id: "crypto-mock-11",
    headline: "Fed Rate Outlook Lifts Risk Appetite for Altcoins",
    authorName: "Chris Taylor",
    daysAgo: 5,
  },
  {
    id: "crypto-mock-12",
    headline: "Binance Lists New AI Token Pair With High Volume",
    authorName: "Nina Patel",
    daysAgo: 5,
  },
  {
    id: "crypto-mock-13",
    headline: "Cross-Chain Bridge Exploit Sparks Security Debate",
    authorName: "Kevin Moore",
    daysAgo: 6,
  },
  {
    id: "crypto-mock-14",
    headline: "Dogecoin Jumps 12% After Celebrity Social Media Post",
    authorName: "Julia Scott",
    daysAgo: 6,
  },
  {
    id: "crypto-mock-15",
    headline: "Institutional Investors Increase BTC Allocation in Q1",
    authorName: "Brian Hall",
    daysAgo: 7,
  },
  {
    id: "crypto-mock-16",
    headline: "Cardano Smart Contract Activity Reaches New Milestone",
    authorName: "Sophie Turner",
    daysAgo: 7,
  },
  {
    id: "crypto-mock-17",
    headline: "Crypto Tax Rules Tighten in Major European Markets",
    authorName: "Mark Evans",
    daysAgo: 8,
  },
  {
    id: "crypto-mock-18",
    headline: "Meme Coin Sector Dominates Weekly Gainers List",
    authorName: "Hannah Kim",
    daysAgo: 8,
  },
  {
    id: "crypto-mock-19",
    headline: "Bitcoin Dominance Rises as Altcoins Pull Back",
    authorName: "Ryan Cooper",
    daysAgo: 9,
  },
  {
    id: "crypto-mock-20",
    headline: "Web3 Gaming Tokens Rally on New Partnership News",
    authorName: "Olivia Reed",
    daysAgo: 9,
  },
];

/** daysAgo 기준 ISO 날짜 생성 */
function createMockDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/** 상대 시간 라벨 (TOP News용) */
function formatMockRelativeTime(daysAgo: number): string {
  if (daysAgo <= 0) return "방금 전";
  if (daysAgo === 1) return "1일 전";
  if (daysAgo < 7) return `${daysAgo}일 전`;
  return `${daysAgo + 3}일 전`;
}

/** 메인 그리드용 Crypto 뉴스 목업 (20건) */
export const MOCK_CRYPTO_NEWS_GRID: NewsCardGridItem[] =
  CRYPTO_NEWS_MOCK_SOURCES.map((item) => ({
    id: item.id,
    headline: item.headline,
    content: null,
    image_url: getRandomPlaceholderImage(item.id, 400, 300),
    created_at: createMockDate(item.daysAgo),
    author: {
      name: item.authorName,
      avatar_url: null,
    },
  }));

/** 사이드바 TOP News 목업 (상위 5건) */
export const MOCK_CRYPTO_TOP_NEWS: RankingNewsItem[] =
  CRYPTO_NEWS_MOCK_SOURCES.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    image: getRandomPlaceholderImage(item.id, 200, 200),
    headline: item.headline,
    timestamp: formatMockRelativeTime(item.daysAgo),
  }));
