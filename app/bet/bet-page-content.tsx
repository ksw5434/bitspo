"use client";

import { useSearchParams } from "next/navigation";
import { BettingSitesBoard } from "@/app/_components/betting-sites-board";
import { SectionPlaceholderPage } from "../_components/section-placeholder-page";
import {
  BET_TAB_DESCRIPTIONS,
  BET_TAB_LABELS,
  parseBetTab,
} from "@/lib/bet-tabs";

export function BetPageContent() {
  const searchParams = useSearchParams();
  const activeBetTab = parseBetTab(searchParams.get("tab"));
  const activeTabLabel = BET_TAB_LABELS[activeBetTab];

  if (activeBetTab === "betting-sites") {
    return (
      <main className="container mx-auto w-full max-w-7xl px-4 py-8">
        <BettingSitesBoard className="w-full" />
      </main>
    );
  }

  return (
    <SectionPlaceholderPage
      title={`Bet · ${activeTabLabel}`}
      description={BET_TAB_DESCRIPTIONS[activeBetTab]}
    />
  );
}
