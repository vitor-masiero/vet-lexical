import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  term: z.string().trim().min(1).max(200),
  definition: z.string().trim().min(1),
  examples: z.array(z.string()).default([]),
  synonyms: z.array(z.string()).default([]),
  note: z.string().trim().optional().default(""),
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
      { error: "Termo e definição são obrigatórios." },
      { status: 400 },
    );
  }

  const existing = await prisma.glossaryEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  const entry = await prisma.glossaryEntry.update({
    where: { id },
    data: {
      term: parsed.data.term,
      definition: parsed.data.definition,
      examples: parsed.data.examples,
      synonyms: parsed.data.synonyms,
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json(entry);
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

  const existing = await prisma.glossaryEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  await prisma.glossaryEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
