import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader } from "@/lib/auth";
import { getPriceCache } from "@/lib/services/prices";

export async function POST(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const { symbol, name, side, quantity } = await req.json() as {
  symbol: string;
  name: string;
  side: "BUY" | "SELL";
  quantity: number;
};

  const cache = getPriceCache();
  const tick = cache.get(symbol.toUpperCase());
  if (!tick) return NextResponse.json({ error: "Precio no disponible aún" }, { status: 400 });

  const price = tick.price;
  const total = price * quantity;
  const sym = symbol.toUpperCase();

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (side === "BUY") {
    if (user.balance < total) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

    const existing = await prisma.holding.findUnique({
      where: { userId_symbol: { userId: user.id, symbol: sym } },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvg = (existing.quantity * existing.avgPrice + quantity * price) / newQty;
      await prisma.holding.update({ where: { id: existing.id }, data: { quantity: newQty, avgPrice: newAvg } });
    } else {
      await prisma.holding.create({ data: { userId: user.id, symbol: sym, name, quantity, avgPrice: price } });
    }

    await prisma.user.update({ where: { id: user.id }, data: { balance: user.balance - total } });
  }

  if (side === "SELL") {
    const holding = await prisma.holding.findUnique({
      where: { userId_symbol: { userId: user.id, symbol: sym } },
    });
    if (!holding || holding.quantity < quantity)
      return NextResponse.json({ error: "No tienes suficiente cantidad" }, { status: 400 });

    const remaining = holding.quantity - quantity;
    if (remaining < 0.000001) {
      await prisma.holding.delete({ where: { id: holding.id } });
    } else {
      await prisma.holding.update({ where: { id: holding.id }, data: { quantity: remaining } });
    }

    await prisma.user.update({ where: { id: user.id }, data: { balance: user.balance + total } });
  }

  const trade = await prisma.trade.create({
    data: { userId: user.id, symbol: sym, name, side, quantity, price, total },
  });

  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

  return NextResponse.json({ trade, balance: updatedUser?.balance });
}

export async function GET(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const trades = await prisma.trade.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ trades });
}
