/** Top Communities 목업 아이템 */
export type TopCommunityItem = {
  id: string;
  name: string;
  memberCountLabel: string;
  icon: string;
};

/** Top Posts 목업 아이템 */
export type TopPostItem = {
  id: string;
  title: string;
  likes: number;
  comments: number;
  href?: string;
};

/** Top Communities 목업 (5건) */
export const MOCK_TOP_COMMUNITIES: TopCommunityItem[] = [
  { id: "tc-1", name: "Bitcoin Talk", memberCountLabel: "12.5K", icon: "₿" },
  { id: "tc-2", name: "Ethereum Lab", memberCountLabel: "8.3K", icon: "Ξ" },
  { id: "tc-3", name: "DeFi Investors", memberCountLabel: "5.7K", icon: "💎" },
  { id: "tc-4", name: "NFT Collectors", memberCountLabel: "3.2K", icon: "🖼️" },
  { id: "tc-5", name: "Altcoin Radar", memberCountLabel: "2.1K", icon: "📡" },
];

/** Top Posts 목업 (5건) */
export const MOCK_TOP_POSTS: TopPostItem[] = [
  {
    id: "tp-1",
    title: "Bitcoin ETF Inflows Hit Record — What's Next for BTC?",
    likes: 342,
    comments: 89,
    href: "#",
  },
  {
    id: "tp-2",
    title: "Best DeFi Yields This Week: A Community Roundup",
    likes: 218,
    comments: 56,
    href: "#",
  },
  {
    id: "tp-3",
    title: "Ethereum Gas Fees Drop After Latest Network Upgrade",
    likes: 175,
    comments: 41,
    href: "#",
  },
  {
    id: "tp-4",
    title: "Beginner's Guide: How to Read On-Chain Data",
    likes: 132,
    comments: 37,
    href: "#",
  },
  {
    id: "tp-5",
    title: "Solana vs Ethereum — Long-Term Holders Debate",
    likes: 98,
    comments: 62,
    href: "#",
  },
];
