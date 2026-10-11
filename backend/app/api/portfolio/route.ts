import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader } from "@/lib/auth";
import { getPriceCache } from "@/lib/services/prices";

export async function GET(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  const holdings = await prisma.holding.findMany({ where: { userId: payload.userId } });
  const cache = getPriceCache();

  const enriched = holdings.map((h) => {
    const tick = cache.get(h.symbol);
    const currentPrice = tick?.price ?? h.avgPrice;
    const totalInvested = h.quantity * h.avgPrice;
    const totalValue = h.quantity * currentPrice;
    return { ...h, currentPrice, totalInvested, totalValue, pnl: totalValue - totalInvested, pnlPercent: ((totalValue - totalInvested) / totalInvested) * 100 };
  });

  return NextResponse.json({ holdings: enriched, balance: user?.balance ?? 0 });
}
