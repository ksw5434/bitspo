import { Card, CardContent } from "@/app/_components/ui/card";

/** 경기 상태 (목업) */
type MatchStatus = "live" | "final" | "scheduled";

/** 스코어 카드 목업 데이터 */
type MockScoreCard = {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  statusLabel: string;
  matchTime: string;
};

/** 3×3 그리드용 목업 9경기 */
const MOCK_SCORE_CARDS: MockScoreCard[] = [
  {
    id: "score-1",
    league: "EPL",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homeScore: 2,
    awayScore: 1,
    status: "final",
    statusLabel: "종료",
    matchTime: "어제 22:30",
  },
  {
    id: "score-2",
    league: "La Liga",
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    homeScore: 1,
    awayScore: 1,
    status: "live",
    statusLabel: "LIVE",
    matchTime: "67'",
  },
  {
    id: "score-3",
    league: "Serie A",
    homeTeam: "Inter",
    awayTeam: "Milan",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    statusLabel: "예정",
    matchTime: "오늘 04:00",
  },
  {
    id: "score-4",
    league: "Bundesliga",
    homeTeam: "Bayern",
    awayTeam: "Dortmund",
    homeScore: 3,
    awayScore: 2,
    status: "final",
    statusLabel: "종료",
    matchTime: "어제 01:30",
  },
  {
    id: "score-5",
    league: "Ligue 1",
    homeTeam: "PSG",
    awayTeam: "Lyon",
    homeScore: 0,
    awayScore: 0,
    status: "live",
    statusLabel: "LIVE",
    matchTime: "23'",
  },
  {
    id: "score-6",
    league: "MLS",
    homeTeam: "LA Galaxy",
    awayTeam: "Inter Miami",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    statusLabel: "예정",
    matchTime: "내일 11:00",
  },
  {
    id: "score-7",
    league: "K League 1",
    homeTeam: "울산",
    awayTeam: "전북",
    homeScore: 2,
    awayScore: 2,
    status: "final",
    statusLabel: "종료",
    matchTime: "어제 19:00",
  },
  {
    id: "score-8",
    league: "UCL",
    homeTeam: "Man City",
    awayTeam: "PSG",
    homeScore: 1,
    awayScore: 0,
    status: "live",
    statusLabel: "LIVE",
    matchTime: "82'",
  },
  {
    id: "score-9",
    league: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    statusLabel: "예정",
    matchTime: "오늘 12:30",
  },
];

/** 상태별 뱃지 스타일 */
function getStatusBadgeClassName(status: MatchStatus): string {
  switch (status) {
    case "live":
      return "bg-red-500/15 text-red-600 dark:text-red-400";
    case "final":
      return "bg-muted text-muted-foreground";
    case "scheduled":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** 스코어 표시 (예정 경기는 VS) */
function formatScoreDisplay(
  homeScore: number | null,
  awayScore: number | null,
): string {
  if (homeScore === null || awayScore === null) {
    return "VS";
  }
  return `${homeScore} - ${awayScore}`;
}

interface ScoresSectionProps {
  className?: string;
}

/**
 * Scores 섹션 (목업)
 * /sports 페이지 — 컨테이너 전체 너비 3×3 스코어 카드 그리드
 */
export function ScoresSection({ className = "" }: ScoresSectionProps) {
  return (
    <section className={`w-full space-y-4 ${className}`.trim()} aria-label="Scores">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">Scores</h2>
        <span className="text-xs text-muted-foreground">목업 데이터</span>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_SCORE_CARDS.map((match) => (
          <Card
            key={match.id}
            className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {match.league}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeClassName(match.status)}`}
                >
                  {match.status === "live" && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 align-middle animate-pulse" />
                  )}
                  {match.statusLabel}
                </span>
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <p className="text-sm font-semibold truncate">{match.homeTeam}</p>
                <p className="text-sm font-semibold truncate text-muted-foreground">
                  {match.awayTeam}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <span className="text-lg font-bold tabular-nums tracking-tight">
                  {formatScoreDisplay(match.homeScore, match.awayScore)}
                </span>
                <time className="text-xs text-muted-foreground shrink-0">
                  {match.matchTime}
                </time>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
