import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Cliente da IA (opencode Go) — isolado aqui para facilitar troca de provedor.
// Endpoint: https://opencode.ai/inference/go/openai/v1/chat/completions
// ---------------------------------------------------------------------------

const opencodeGo = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/inference/go/openai/v1",
  apiKey: process.env.OPENCODE_API_KEY,
  headers: {
    "User-Agent": "veterinaria-estudos/1.0",
  },
});

const model = opencodeGo(process.env.AI_MODEL ?? "mimo-v2.5");

// ---------------------------------------------------------------------------
// Schemas de saída
// ---------------------------------------------------------------------------

export const wordDefinitionSchema = z.object({
  termo: z.string().default(""),
  definicao: z.string(),
  exemplos: z.array(z.string()).default([]),
  sinonimos: z.array(z.string()).default([]),
  observacao: z.string().optional().default(""),
});

export type WordDefinition = z.infer<typeof wordDefinitionSchema>;

const flashcardSchema = z.object({
  frente: z.string(),
  verso: z.string(),
});

const flashcardsSchema = z.array(flashcardSchema);

// ---------------------------------------------------------------------------
// Helpers de parsing tolerante a markdown / texto ao redor
// ---------------------------------------------------------------------------

function stripCodeFences(text: string): string {
  return text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractJson(text: string): string {
  const cleaned = stripCodeFences(text);

  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    const closing = cleaned.startsWith("{") ? "}" : "]";
    const end = cleaned.lastIndexOf(closing);
    return end !== -1 ? cleaned.slice(0, end + 1) : cleaned;
  }

  const firstObject = cleaned.indexOf("{");
  const firstArray = cleaned.indexOf("[");

  if (firstArray !== -1 && (firstObject === -1 || firstArray < firstObject)) {
    const end = cleaned.lastIndexOf("]");
    if (end > firstArray) return cleaned.slice(firstArray, end + 1);
  }

  if (firstObject !== -1) {
    const end = cleaned.lastIndexOf("}");
    if (end > firstObject) return cleaned.slice(firstObject, end + 1);
  }

  return cleaned;
}

function sessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Pesquisa de palavra (significado + exemplos)
// ---------------------------------------------------------------------------

const DICTIONARY_SYSTEM_PROMPT = `Você é um assistente especializado em terminologia de medicina veterinária.
Sua tarefa é definir termos técnicos de forma precisa, didática e acessível.

REGRAS:
- Responda SEMPRE em português do Brasil.
- Responda APENAS com um objeto JSON válido, sem texto antes ou depois, no seguinte formato:
{
  "termo": "<termo pesquisado>",
  "definicao": "<definição de dicionário, clara e completa>",
  "exemplos": ["<exemplo de uso em contexto veterinário>", "..."],
  "sinonimos": ["<sinônimo 1>", "..."],
  "observacao": "<nota adicional relevante, ou string vazia se não houver>"
}
- Dê de 2 a 3 exemplos sempre que possível.
- Se o termo não for da área veterinária, defina-o normalmente no contexto de ciências da saúde.`;

export async function searchWord(term: string): Promise<WordDefinition> {
  const prompt = `Defina o termo: "${term}"`;

  const { text } = await generateText({
    model,
    system: DICTIONARY_SYSTEM_PROMPT,
    prompt,
    temperature: 0.2,
    headers: {
      "x-opencode-session": sessionId(),
    },
  });

  if (!text.trim()) {
    throw new Error("A IA não retornou uma resposta.");
  }

  try {
    const parsed = JSON.parse(extractJson(text));
    const result = wordDefinitionSchema.parse(parsed);
    return {
      ...result,
      termo: result.termo.trim() || term.trim(),
    };
  } catch {
    // Fallback: usa o texto bruto como definição para não quebrar a UX.
    return {
      termo: term.trim(),
      definicao: stripCodeFences(text),
      exemplos: [],
      sinonimos: [],
      observacao: "",
    };
  }
}

// ---------------------------------------------------------------------------
// Geração de flashcards a partir de um contexto/assunto
// ---------------------------------------------------------------------------

const FLASHCARDS_SYSTEM_PROMPT = `Você é um assistente de estudos especializado em medicina veterinária.
Sua tarefa é criar flashcards simples de revisão.

REGRAS:
- Responda SEMPRE em português do Brasil.
- Responda APENAS com um array JSON válido, sem texto antes ou depois, no formato:
[
  { "frente": "<pergunta, frase ou palavra>", "verso": "<resposta>" }
]
- Cada card deve ter um único conceito claro na frente e a resposta no verso.
- Foque em termos, definições e conceitos importantes.`;

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(
  context: string,
  count = 8,
): Promise<GeneratedFlashcard[]> {
  const prompt = `Crie ${count} flashcards sobre o seguinte contexto/assunto:\n\n${context}`;

  const { text } = await generateText({
    model,
    system: FLASHCARDS_SYSTEM_PROMPT,
    prompt,
    temperature: 0.4,
    headers: {
      "x-opencode-session": sessionId(),
    },
  });

  try {
    const parsed = JSON.parse(extractJson(text));
    const rawArray = Array.isArray(parsed)
      ? parsed
      : (parsed?.cards ?? parsed?.flashcards);

    const cards = flashcardsSchema.parse(rawArray);
    return cards.map((c) => ({
      front: c.frente.trim(),
      back: c.verso.trim(),
    }));
  } catch {
    throw new Error(
      "Não foi possível gerar os flashcards. Tente reformular o assunto.",
    );
  }
}
