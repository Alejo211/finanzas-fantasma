import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const alerts = await prisma.alert.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const { symbol, condition, threshold } = await req.json();
  const alert = await prisma.alert.create({
    data: { userId: payload.userId, symbol: symbol.toUpperCase(), condition, threshold: parseFloat(threshold) },
  });
  return NextResponse.json({ alert }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const { id, active } = await req.json();
  const exists = await prisma.alert.findFirst({ where: { id, userId: payload.userId } });
  if (!exists) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const alert = await prisma.alert.update({ where: { id }, data: { active } });
  return NextResponse.json({ alert });
}

export async function DELETE(req: NextRequest) {
  const payload = getTokenFromHeader(req.headers.get("authorization") || undefined);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await prisma.alert.deleteMany({ where: { id, userId: payload.userId } });
  return NextResponse.json({ ok: true });
}
