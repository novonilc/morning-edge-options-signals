import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { generateSignals, generateRegime } from "@/lib/mock/generator";

export async function GET(request: NextRequest) {
  const now = new Date();
  // Optional: allow force refresh via query parameter ?refresh=true
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
  
  const signals = await generateSignals(now, forceRefresh);
  const regime = generateRegime(now);
  return NextResponse.json({ signals, regime, generatedAt: now.toISOString() });
}
