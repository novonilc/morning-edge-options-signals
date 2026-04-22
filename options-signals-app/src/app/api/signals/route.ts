import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { generateSignals, generateRegime } from "@/lib/mock/generator";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const now = new Date();
  const signals = await generateSignals(now, true);
  const regime = generateRegime(now);
  return NextResponse.json(
    { signals, regime, generatedAt: now.toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
