import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  const logs = await prisma.sentimentLog.findMany({
    where: symbol ? { symbol: symbol.toUpperCase() } : undefined,
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ logs });
}
