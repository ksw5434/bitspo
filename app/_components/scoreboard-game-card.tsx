import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreCard } from "@/lib/espn-scores";

function WinnerCaret() {
  return (
    <span
      className="inline-block size-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-foreground shrink-0"
      aria-hidden
    />
  );
}

function TeamRow({
  team,
  showScores,
}: {
  team: ScoreCard["teams"][number];
  showScores: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-h-[2.25rem]">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logoUrl}
            alt=""
            className="size-6 shrink-0 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="size-6 shrink-0 rounded-full bg-muted" aria-hidden />
        )}
        <span className="text-sm font-medium truncate">{team.name}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
        {team.isWinner && showScores && <WinnerCaret />}
        <span
          className={cn(
            "text-xl font-bold leading-none min-w-[1.75rem] text-right",
            team.isWinner && showScores && "text-foreground",
            !team.isWinner && showScores && "text-muted-foreground",
          )}
        >
          {showScores && team.score !== null ? team.score : ""}
        </span>
      </div>
    </div>
  );
}

type ScoreboardGameCardProps = {
  match: ScoreCard;
  className?: string;
};

/**
 * ESPN 스타일 스코어 카드 (2열 그리드 셀)
 */
export function ScoreboardGameCard({ match, className }: ScoreboardGameCardProps) {
  const showScores = match.status !== "scheduled";
  const statusLine =
    match.status === "live"
      ? (match.liveDetail ?? "Live")
      : match.statusText;

  const cardBody = (
    <div className={cn("flex h-full min-h-[8.5rem]", className)}>
      <div className="flex flex-1 flex-col gap-2 p-3 min-w-0">
        {match.seriesHeader && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
            {match.seriesHeader}
          </p>
        )}

        <div className="flex flex-col gap-2 flex-1 justify-center">
          <TeamRow team={match.teams[0]} showScores={showScores} />
          <TeamRow team={match.teams[1]} showScores={showScores} />
        </div>
      </div>

      <div className="flex w-[7.5rem] sm:w-[8.5rem] shrink-0 flex-col border-l border-border">
        <div className="px-2.5 py-2 text-center border-b border-border min-h-[3.25rem] flex flex-col justify-center">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              match.status === "live" && "text-red-500 dark:text-red-400",
            )}
          >
            {match.status === "live" && (
              <span className="inline-block size-1.5 rounded-full bg-red-500 mr-1 align-middle animate-pulse" />
            )}
            {statusLine}
          </p>
          {match.dateText && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {match.dateText}
            </p>
          )}
        </div>

        {match.highlight ? (
          <Link
            href={match.highlight.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex-1 min-h-[4.5rem] bg-muted/40 hover:bg-muted/60 transition-colors group"
            onClick={(event) => event.stopPropagation()}
          >
            {match.highlight.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.highlight.thumbnailUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/20" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
              <span className="flex items-center justify-center size-9 rounded-full bg-black/60 border border-white/30">
                <Play className="size-4 text-white fill-white ml-0.5" />
              </span>
            </div>
            {match.highlight.durationLabel && (
              <span className="absolute bottom-1 right-1 text-[10px] font-medium text-white bg-black/70 px-1 rounded">
                {match.highlight.durationLabel}
              </span>
            )}
            <span className="absolute bottom-1 left-1 text-[9px] font-semibold text-white/90 uppercase">
              {match.highlight.label}
            </span>
          </Link>
        ) : (
          <div className="flex-1 min-h-[4.5rem] bg-muted/20" aria-hidden />
        )}
      </div>
    </div>
  );

  if (match.gameUrl) {
    return (
      <Link
        href={match.gameUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full hover:bg-muted/20 transition-colors"
      >
        {cardBody}
      </Link>
    );
  }

  return cardBody;
}
