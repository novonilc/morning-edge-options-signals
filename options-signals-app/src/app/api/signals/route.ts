import { NextResponse } from "next/server";
import { generateSignals, generateRegime } from "@/lib/mock/generator";

export async function GET() {
  const now = new Date();
  const signals = await generateSignals(now);
  const regime = generateRegime(now);
  return NextResponse.json({ signals, regime, generatedAt: now.toISOString() });
}
