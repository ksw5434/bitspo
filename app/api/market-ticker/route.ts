import { NextResponse } from "next/server";
import { fetchMarketTickerData } from "@/lib/market-ticker";

export const revalidate = 30;

/**
 * 실시간 시장 티커 API (BTC, ETH, USD/EUR, NASDAQ)
 * 서버에서 외부 API를 호출해 CORS·키 노출을 방지합니다.
 */
export async function GET() {
  try {
    const data = await fetchMarketTickerData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("market-ticker API 오류:", error);
    return NextResponse.json(
      { error: "시장 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
