import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.glossaryEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  // Evita duplicar um card já gerado a partir desta palavra.
  const existing = await prisma.flashcard.findFirst({
    where: { glossaryEntryId: id },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const card = await prisma.flashcard.create({
    data: {
      front: entry.term,
      back: entry.definition,
      source: "glossary",
      glossaryEntryId: entry.id,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
