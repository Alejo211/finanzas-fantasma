import { NextRequest, NextResponse } from "next/server";
import { getPriceCache } from "@/lib/services/prices";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const cache = getPriceCache();
  const prices = Array.from(cache.values());

  const recentSentiment = await prisma.sentimentLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    distinct: ["symbol"],
  });

  const sentimentMap = Object.fromEntries(
    recentSentiment.map((s) => [s.symbol, { score: s.score, label: s.label, headline: s.headline }])
  );

  const assets = prices.map((p) => ({
    ...p,
    sentiment: sentimentMap[p.symbol] || null,
  }));

  return NextResponse.json({ assets });
}
