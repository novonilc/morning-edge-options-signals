import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { generateSignals, generateTrades } from "@/lib/mock/generator";

export async function GET(request: NextRequest) {
  // Optional: allow force refresh via query parameter ?refresh=true
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
  
  const signals = await generateSignals(new Date(), forceRefresh);
  return NextResponse.json({ trades: generateTrades(signals) });
}
