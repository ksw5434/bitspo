/** 베팅 사이트 목록 아이템 (목업) */
export type BettingSiteItem = {
  id: string;
  /** 사이트명 (1줄) */
  name: string;
  /** 프로모션 문구 (2줄) */
  promoText: string;
  /** 썸네일 placeholder 텍스트 */
  logoLabel: string;
  /** 바로가기 URL */
  siteUrl: string;
};

/** 페이지당 목록 개수 */
export const BETTING_SITES_PER_PAGE = 15;

/** Betting Sites 목업 20건 */
export const MOCK_BETTING_SITES: BettingSiteItem[] = [
  {
    id: "site-1",
    name: "BET365",
    promoText: "GET UP TO $1,400 PAID BACK IN BONUS BETS",
    logoLabel: "365",
    siteUrl: "https://example.com/bet365",
  },
  {
    id: "site-2",
    name: "DRAFTKINGS",
    promoText: "BET $5, GET $200 IN BONUS BETS IF YOU WIN",
    logoLabel: "DK",
    siteUrl: "https://example.com/draftkings",
  },
  {
    id: "site-3",
    name: "FANDUEL",
    promoText: "GET UP TO $1,000 BACK IN BONUS BETS",
    logoLabel: "FD",
    siteUrl: "https://example.com/fanduel",
  },
  {
    id: "site-4",
    name: "BETMGM",
    promoText: "FIRST BET OFFER UP TO $1,500 IN BONUS BETS",
    logoLabel: "MGM",
    siteUrl: "https://example.com/betmgm",
  },
  {
    id: "site-5",
    name: "CAESARS",
    promoText: "20X REWARD CREDITS ON YOUR FIRST WAGER",
    logoLabel: "CZR",
    siteUrl: "https://example.com/caesars",
  },
  {
    id: "site-6",
    name: "ESPN BET",
    promoText: "BET $10, GET $150 IN BONUS BETS",
    logoLabel: "ESPN",
    siteUrl: "https://example.com/espnbet",
  },
  {
    id: "site-7",
    name: "FANATICS",
    promoText: "UP TO $1,000 IN NO SWEAT BETS FOR NEW USERS",
    logoLabel: "FAN",
    siteUrl: "https://example.com/fanatics",
  },
  {
    id: "site-8",
    name: "BETRIVERS",
    promoText: "SECOND CHANCE BET UP TO $500",
    logoLabel: "BR",
    siteUrl: "https://example.com/betrivers",
  },
  {
    id: "site-9",
    name: "POINTSBET",
    promoText: "5X SECOND CHANCE BETS UP TO $100 EACH",
    logoLabel: "PB",
    siteUrl: "https://example.com/pointsbet",
  },
  {
    id: "site-10",
    name: "HARD ROCK BET",
    promoText: "NO SWEAT FIRST BET UP TO $100",
    logoLabel: "HR",
    siteUrl: "https://example.com/hardrock",
  },
  {
    id: "site-11",
    name: "BETWAY",
    promoText: "100% MATCH ON FIRST DEPOSIT UP TO $250",
    logoLabel: "BW",
    siteUrl: "https://example.com/betway",
  },
  {
    id: "site-12",
    name: "UNIBET",
    promoText: "GET UP TO $500 IN BONUS BETS",
    logoLabel: "UNI",
    siteUrl: "https://example.com/unibet",
  },
  {
    id: "site-13",
    name: "WYNNBET",
    promoText: "BET $50, GET UP TO $250 IN FREE BETS",
    logoLabel: "WYN",
    siteUrl: "https://example.com/wynnbet",
  },
  {
    id: "site-14",
    name: "SUPERBOOK",
    promoText: "RISK-FREE FIRST BET UP TO $1,000",
    logoLabel: "SB",
    siteUrl: "https://example.com/superbook",
  },
  {
    id: "site-15",
    name: "BARSTOOL",
    promoText: "GET UP TO $1,000 IN BONUS CASH",
    logoLabel: "BST",
    siteUrl: "https://example.com/barstool",
  },
  {
    id: "site-16",
    name: "FOXBET",
    promoText: "BET $10, GET UP TO $500 IN BONUS BETS",
    logoLabel: "FOX",
    siteUrl: "https://example.com/foxbet",
  },
  {
    id: "site-17",
    name: "BORGATA",
    promoText: "DEPOSIT MATCH UP TO $1,000 ON FIRST BET",
    logoLabel: "BOR",
    siteUrl: "https://example.com/borgata",
  },
  {
    id: "site-18",
    name: "RESORTS",
    promoText: "TWO NO-SWEAT BETS UP TO $50 EACH",
    logoLabel: "RST",
    siteUrl: "https://example.com/resorts",
  },
  {
    id: "site-19",
    name: "BETPARX",
    promoText: "FIRST BET INSURANCE UP TO $500",
    logoLabel: "PRX",
    siteUrl: "https://example.com/betparx",
  },
  {
    id: "site-20",
    name: "SUGARHOUSE",
    promoText: "SECOND CHANCE BET UP TO $250",
    logoLabel: "SH",
    siteUrl: "https://example.com/sugarhouse",
  },
];
