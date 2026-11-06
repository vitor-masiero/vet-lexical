import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { searchWord } from "@/lib/ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  term: z.string().trim().min(1).max(120),
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

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Informe uma palavra para pesquisar." },
      { status: 400 },
    );
  }

  try {
    const result = await searchWord(parsed.data.term);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na pesquisa de palavra:", error);
    return NextResponse.json(
      {
        error:
          "Não foi possível pesquisar agora. Verifique a chave da IA e tente novamente.",
      },
      { status: 502 },
    );
  }
}
