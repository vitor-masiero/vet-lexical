import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().trim().min(1).max(1000),
        back: z.string().trim().min(1).max(2000),
        source: z.enum(["manual", "glossary", "ai"]).optional().default("ai"),
      }),
    )
    .min(1)
    .max(50),
});

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

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Envie uma lista de cards válida." },
      { status: 400 },
    );
  }

  const created = await prisma.$transaction(
    parsed.data.cards.map((c) =>
      prisma.flashcard.create({
        data: { front: c.front, back: c.back, source: c.source },
      }),
    ),
  );

  return NextResponse.json(created, { status: 201 });
}
