import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { generateFlashcards } from "@/lib/ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateSchema = z.object({
  context: z.string().trim().min(3).max(4000),
  count: z.number().int().min(1).max(20).optional().default(8),
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

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Informe um contexto/assunto para gerar os cards." },
      { status: 400 },
    );
  }

  try {
    const cards = await generateFlashcards(parsed.data.context, parsed.data.count);
    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Erro ao gerar flashcards:", error);
    return NextResponse.json(
      { error: "Não foi possível gerar os flashcards. Tente reformular." },
      { status: 502 },
    );
  }
}
