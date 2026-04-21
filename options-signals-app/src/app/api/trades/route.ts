import { NextResponse } from "next/server";
import { generateSignals, generateTrades } from "@/lib/mock/generator";

export async function GET() {
  const signals = await generateSignals(new Date());
  return NextResponse.json({ trades: generateTrades(signals) });
}
