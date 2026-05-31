import { Suspense } from "react";
import { BET_TAB_DESCRIPTIONS } from "@/lib/bet-tabs";
import { BetPageContent } from "./bet-page-content";

export default function BetPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-2 py-16">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Bet · Betting Sites
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {BET_TAB_DESCRIPTIONS["betting-sites"]}
            </p>
          </div>
        </main>
      }
    >
      <BetPageContent />
    </Suspense>
  );
}
