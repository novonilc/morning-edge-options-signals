import { NextResponse } from "next/server";
import { generateBacktests } from "@/lib/mock/generator";

export async function GET() {
  return NextResponse.json({ backtests: generateBacktests() });
}
