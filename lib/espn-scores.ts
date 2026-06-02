/**
 * ESPN 비공식 scoreboard API → /sports Scores UI (English, ESPN-style layout)
 */

export type ScoreMatchStatus = "live" | "final" | "scheduled";

export type ScoreTeamRow = {
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  score: number | null;
  isWinner: boolean;
};

export type ScoreHighlight = {
  thumbnailUrl: string | null;
  durationLabel: string | null;
  label: string;
  href: string;
};

export type ScoreCard = {
  id: string;
  league: "NBA" | "NFL" | "MLB";
  /** e.g. "East Finals - Game 6" or "IND wins series 4-2" */
  seriesHeader: string | null;
  teams: [ScoreTeamRow, ScoreTeamRow];
  status: ScoreMatchStatus;
  statusText: string;
  dateText: string;
  liveDetail: string | null;
  highlight: ScoreHighlight | null;
  gameUrl: string | null;
};

export type SportsScoresResponse = {
  items: ScoreCard[];
  updatedAt: string;
  hasPartialError?: boolean;
};

/** 스포츠 카테고리 slug → ESPN 리그 */
const SLUG_TO_ESPN_LEAGUE: Record<string, ScoreCard["league"]> = {
  nba: "NBA",
  nfl: "NFL",
  mlb: "MLB",
};

export function resolveEspnLeagueFromSportsCategory(
  categorySlug: string,
  categoryName?: string,
): ScoreCard["league"] | null {
  const fromSlug = SLUG_TO_ESPN_LEAGUE[categorySlug.trim().toLowerCase()];
  if (fromSlug) {
    return fromSlug;
  }

  const normalizedName = categoryName?.trim().toUpperCase();
  if (
    normalizedName === "NBA" ||
    normalizedName === "NFL" ||
    normalizedName === "MLB"
  ) {
    return normalizedName;
  }

  return null;
}

export function filterScoreCardsByLeague(
  items: ScoreCard[],
  league: ScoreCard["league"] | null,
): ScoreCard[] {
  if (!league) {
    return [];
  }
  return items.filter((item) => item.league === league);
}

type EspnLeagueConfig = {
  league: ScoreCard["league"];
  url: string;
};

const ESPN_LEAGUES: EspnLeagueConfig[] = [
  {
    league: "NFL",
    url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  },
  {
    league: "NBA",
    url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  },
  {
    league: "MLB",
    url: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  },
];

const DISPLAY_TIMEZONE = "America/New_York";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_GAMES_PER_LEAGUE = 16;

type EspnStatusType = {
  state?: string;
  completed?: boolean;
  shortDetail?: string;
  detail?: string;
  description?: string;
};

type EspnSeriesCompetitor = {
  id?: string;
  wins?: number;
};

type EspnSeries = {
  summary?: string;
  completed?: boolean;
  totalCompetitions?: number;
  competitors?: EspnSeriesCompetitor[];
};

type EspnCompetitor = {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
};

type EspnHighlight = {
  headline?: string;
  thumbnail?: string;
  duration?: number;
  links?: {
    web?: { href?: string };
    mobile?: { source?: { href?: string } };
  };
};

type EspnLink = {
  rel?: string[];
  href?: string;
  text?: string;
};

type EspnCompetition = {
  date?: string;
  notes?: Array<{ type?: string; headline?: string }>;
  series?: EspnSeries;
  status?: {
    type?: EspnStatusType;
    displayClock?: string;
    period?: number;
  };
  competitors?: EspnCompetitor[];
  highlights?: EspnHighlight[];
};

type EspnEvent = {
  id?: string;
  date?: string;
  shortName?: string;
  links?: EspnLink[];
  competitions?: EspnCompetition[];
};

type EspnScoreboardResponse = {
  events?: EspnEvent[];
};

function parseScoreValue(score: string | undefined): number | null {
  if (score === undefined || score === "") return null;
  const parsed = Number.parseInt(score, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapMatchStatus(statusType: EspnStatusType | undefined): {
  status: ScoreMatchStatus;
  statusText: string;
} {
  const state = statusType?.state ?? "";

  if (state === "in") {
    return { status: "live", statusText: "Live" };
  }

  if (state === "post" || statusType?.completed === true) {
    return { status: "final", statusText: "Final" };
  }

  return { status: "scheduled", statusText: "Scheduled" };
}

/** May 31 (Sun) */
function formatGameDateEnglish(eventDateIso?: string): string {
  if (!eventDateIso) {
    return "";
  }

  try {
    const date = new Date(eventDateIso);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DISPLAY_TIMEZONE,
      month: "short",
      day: "numeric",
      weekday: "short",
    }).formatToParts(date);

    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";

    return `${month} ${day} (${weekday})`;
  } catch {
    return "";
  }
}

function formatDuration(seconds: number | undefined): string | null {
  if (seconds === undefined || seconds <= 0) {
    return null;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function findEventLink(links: EspnLink[] | undefined, rel: string): string | null {
  const match = links?.find((link) => link.rel?.includes(rel) && link.href);
  return match?.href ?? null;
}

function buildSeriesHeaderFromCompetition(
  competition: EspnCompetition,
  competitors: EspnCompetitor[],
): string | null {
  const noteHeadline = competition.notes?.[0]?.headline?.trim();
  if (noteHeadline) {
    return noteHeadline;
  }

  const series = competition.series;
  if (!series) {
    return null;
  }

  if (series.summary?.trim() && !series.summary.toLowerCase().startsWith("series starts")) {
    return series.summary.trim();
  }

  if (series.competitors && series.competitors.length >= 2 && series.totalCompetitions) {
    const teamByEspnId = new Map(
      competitors.map((c) => [c.team?.id ?? "", c]),
    );

    const seriesRows = series.competitors
      .map((sc) => {
        const team = teamByEspnId.get(sc.id ?? "");
        return {
          abbrev:
            team?.team?.abbreviation ??
            team?.team?.shortDisplayName?.slice(0, 3).toUpperCase() ??
            "TBD",
          wins: sc.wins ?? 0,
        };
      })
      .filter((row) => row.abbrev !== "TBD");

    if (seriesRows.length >= 2) {
      const totalGamesPlayed = seriesRows.reduce((sum, row) => sum + row.wins, 0);
      const gameNumber = Math.min(
        totalGamesPlayed + (series.completed ? 0 : 1),
        series.totalCompetitions,
      );
      const leader = [...seriesRows].sort((a, b) => b.wins - a.wins)[0];
      const trailer = [...seriesRows].sort((a, b) => b.wins - a.wins)[1];

      if (gameNumber > 0 && leader && trailer) {
        return `Game ${gameNumber} (${leader.abbrev} wins ${leader.wins} - ${trailer.wins})`;
      }
    }
  }

  return null;
}

function buildHighlight(
  competition: EspnCompetition,
  eventLinks: EspnLink[] | undefined,
): ScoreHighlight | null {
  const clip = competition.highlights?.[0];
  const recapHref = findEventLink(eventLinks, "recap");
  const summaryHref = findEventLink(eventLinks, "summary");

  const href =
    clip?.links?.web?.href ??
    clip?.links?.mobile?.source?.href ??
    recapHref ??
    summaryHref;

  if (!href) {
    return null;
  }

  return {
    thumbnailUrl: clip?.thumbnail ?? null,
    durationLabel: formatDuration(clip?.duration),
    label: clip?.headline ? "Highlights" : "Game Story",
    href,
  };
}

function buildTeamRow(
  competitor: EspnCompetitor,
  status: ScoreMatchStatus,
  explicitWinner?: boolean,
): ScoreTeamRow {
  const score = parseScoreValue(competitor.score);
  const isWinner =
    status === "final" && (explicitWinner === true || competitor.winner === true);

  return {
    name:
      competitor.team?.displayName ??
      competitor.team?.shortDisplayName ??
      "Team",
    abbreviation: competitor.team?.abbreviation ?? "—",
    logoUrl: competitor.team?.logo ?? null,
    score: status === "scheduled" ? null : score,
    isWinner,
  };
}

function orderCompetitors(competitors: EspnCompetitor[]): [EspnCompetitor, EspnCompetitor] | null {
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) {
    return null;
  }
  return [home, away];
}

function buildLiveDetail(
  status: ScoreMatchStatus,
  competitionStatus: EspnCompetition["status"],
  statusType: EspnStatusType | undefined,
): string | null {
  if (status !== "live") {
    return null;
  }

  const clock = competitionStatus?.displayClock;
  const period = competitionStatus?.period;

  if (clock && clock !== "0.0" && clock !== "0:00") {
    if (period) {
      return `Q${period} ${clock}`;
    }
    return clock;
  }

  return statusType?.shortDetail ?? "Live";
}

function normalizeEspnEvent(
  event: EspnEvent,
  league: ScoreCard["league"],
): ScoreCard | null {
  const competition = event.competitions?.[0];
  if (!competition?.competitors?.length) {
    return null;
  }

  const ordered = orderCompetitors(competition.competitors);
  if (!ordered) {
    return null;
  }

  const [topTeam, bottomTeam] = ordered;
  const statusType = competition.status?.type;
  const { status, statusText } = mapMatchStatus(statusType);

  const topRow = buildTeamRow(topTeam, status, topTeam.winner);
  const bottomRow = buildTeamRow(bottomTeam, status, bottomTeam.winner);

  if (status === "final") {
    const topScore = topRow.score ?? 0;
    const bottomScore = bottomRow.score ?? 0;
    if (topScore > bottomScore) {
      topRow.isWinner = true;
      bottomRow.isWinner = false;
    } else if (bottomScore > topScore) {
      bottomRow.isWinner = true;
      topRow.isWinner = false;
    }
  }

  const eventDate = competition.date ?? event.date;

  return {
    id: `${league}-${event.id ?? event.shortName ?? "game"}`,
    league,
    seriesHeader: buildSeriesHeaderFromCompetition(competition, competition.competitors),
    teams: [topRow, bottomRow],
    status,
    statusText,
    dateText: formatGameDateEnglish(eventDate),
    liveDetail: buildLiveDetail(status, competition.status, statusType),
    highlight: buildHighlight(competition, event.links),
    gameUrl: findEventLink(event.links, "summary"),
  };
}

async function fetchLeagueScoreboard(
  config: EspnLeagueConfig,
): Promise<ScoreCard[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(config.url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "bitspo/1.0 (sports-scores)",
      },
      next: { revalidate: 45 },
    });

    if (!response.ok) {
      throw new Error(`ESPN ${config.league} HTTP ${response.status}`);
    }

    const data = (await response.json()) as EspnScoreboardResponse;
    const cards: ScoreCard[] = [];

    for (const event of data.events ?? []) {
      const card = normalizeEspnEvent(event, config.league);
      if (card) {
        cards.push(card);
      }
    }

    const statusOrder: Record<ScoreMatchStatus, number> = {
      live: 0,
      scheduled: 1,
      final: 2,
    };

    cards.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return cards.slice(0, MAX_GAMES_PER_LEAGUE);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchEspnSportsScores(): Promise<SportsScoresResponse> {
  const results = await Promise.allSettled(
    ESPN_LEAGUES.map((config) => fetchLeagueScoreboard(config)),
  );

  const items: ScoreCard[] = [];
  let hasPartialError = false;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      hasPartialError = true;
      console.error(
        `ESPN ${ESPN_LEAGUES[index].league} scoreboard 오류:`,
        result.reason,
      );
    }
  });

  const leagueOrder: Record<ScoreCard["league"], number> = {
    NFL: 0,
    NBA: 1,
    MLB: 2,
  };
  items.sort((a, b) => leagueOrder[a.league] - leagueOrder[b.league]);

  return {
    items,
    updatedAt: new Date().toISOString(),
    hasPartialError: hasPartialError && items.length > 0,
  };
}
