import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  front: z.string().trim().min(1).max(1000),
  back: z.string().trim().min(1).max(2000),
  source: z.enum(["manual", "glossary", "ai"]).optional().default("manual"),
  glossaryEntryId: z.string().optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cards = await prisma.flashcard.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Frente e verso são obrigatórios." },
      { status: 400 },
    );
  }

  const card = await prisma.flashcard.create({
    data: {
      front: parsed.data.front,
      back: parsed.data.back,
      source: parsed.data.source,
      glossaryEntryId: parsed.data.glossaryEntryId ?? null,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
