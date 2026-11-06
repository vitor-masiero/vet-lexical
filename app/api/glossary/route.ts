import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const glossarySchema = z.object({
  term: z.string().trim().min(1).max(200),
  definition: z.string().trim().min(1),
  examples: z.array(z.string()).default([]),
  synonyms: z.array(z.string()).default([]),
  note: z.string().trim().optional().default(""),
});

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const entries = await prisma.glossaryEntry.findMany({
    where: q
      ? {
          OR: [
            { term: { contains: q, mode: "insensitive" } },
            { definition: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
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

  const parsed = glossarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Termo e definição são obrigatórios." },
      { status: 400 },
    );
  }

  const entry = await prisma.glossaryEntry.create({
    data: {
      term: parsed.data.term,
      definition: parsed.data.definition,
      examples: parsed.data.examples,
      synonyms: parsed.data.synonyms,
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
