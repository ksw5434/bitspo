"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  filterScoreCardsByLeague,
  resolveEspnLeagueFromSportsCategory,
  type ScoreCard,
} from "@/lib/espn-scores";
import { ScoreboardGameCard } from "./scoreboard-game-card";

interface ScoresSectionProps {
  className?: string;
  categorySlug: string;
  categoryName?: string;
}

const SCORES_POLL_INTERVAL_MS = 60_000;

/**
 * Scores — ESPN-style 2-column board (English), filtered by active sports tab
 */
export function ScoresSection({
  className = "",
  categorySlug,
  categoryName,
}: ScoresSectionProps) {
  const [allMatches, setAllMatches] = useState<ScoreCard[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPartialError, setHasPartialError] = useState(false);

  const activeLeague = useMemo(
    () => resolveEspnLeagueFromSportsCategory(categorySlug, categoryName),
    [categorySlug, categoryName],
  );

  const displayedMatches = useMemo(
    () => filterScoreCardsByLeague(allMatches, activeLeague),
    [allMatches, activeLeague],
  );

  const loadScores = useCallback(async () => {
    try {
      const res = await fetch("/api/sports/scores");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load scores");
      }

      setAllMatches(json.items ?? []);
      setUpdatedAt(json.updatedAt ?? null);
      setHasPartialError(json.hasPartialError === true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scores");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void loadScores();

    const intervalId = setInterval(() => {
      void loadScores();
    }, SCORES_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadScores]);

  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date(updatedAt))
    : null;

  const sectionTitle = activeLeague
    ? `Scores · ${activeLeague}`
    : `Scores · ${categoryName ?? categorySlug}`;

  return (
    <section
      className={cn("w-full space-y-4", className)}
      aria-label={sectionTitle}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">{sectionTitle}</h2>
        <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
          {activeLeague ? (
            <span>ESPN · {activeLeague}</span>
          ) : (
            <span>Scores not available for this category</span>
          )}
          {updatedLabel && activeLeague && (
            <span>Updated {updatedLabel} ET</span>
          )}
          {hasPartialError && activeLeague && (
            <span className="text-amber-600 dark:text-amber-400">
              Some leagues failed to load
            </span>
          )}
        </div>
      </div>

      {!activeLeague ? (
        <p className="text-center text-sm text-muted-foreground py-8 rounded-lg border border-dashed border-border">
          Live scores are available on NBA, NFL, and MLB tabs only.
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 border border-border rounded-lg overflow-hidden divide-x divide-y divide-border bg-card">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`score-skeleton-${index}`}
              className="min-h-[8.5rem] p-4 space-y-3 animate-pulse"
            >
              <div className="h-3 w-2/3 rounded bg-muted" />
              <div className="h-5 w-full rounded bg-muted" />
              <div className="h-5 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : error && displayedMatches.length === 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive"
        >
          {error}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void loadScores();
            }}
            className="mt-3 block w-full underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : displayedMatches.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No {activeLeague} games to display.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 border border-border rounded-lg overflow-hidden divide-x divide-y divide-border bg-card">
          {displayedMatches.map((match) => (
            <ScoreboardGameCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  );
}
