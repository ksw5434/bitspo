import { Suspense } from "react";
import { CryptoPageContent } from "./crypto-page-content";

export default function CryptoPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto w-full max-w-7xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </main>
      }
    >
      <CryptoPageContent />
    </Suspense>
  );
}
