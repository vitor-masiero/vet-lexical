import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  front: z.string().trim().min(1).max(1000),
  back: z.string().trim().min(1).max(2000),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Frente e verso são obrigatórios." },
      { status: 400 },
    );
  }

  const existing = await prisma.flashcard.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Card não encontrado." }, { status: 404 });
  }

  const card = await prisma.flashcard.update({
    where: { id },
    data: { front: parsed.data.front, back: parsed.data.back },
  });

  return NextResponse.json(card);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.flashcard.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Card não encontrado." }, { status: 404 });
  }

  await prisma.flashcard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
