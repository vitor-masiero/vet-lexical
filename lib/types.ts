export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  source: "manual" | "glossary" | "ai" | string;
  glossaryEntryId: string | null;
  createdAt: string;
}

export interface WordDefinition {
  termo: string;
  definicao: string;
  exemplos: string[];
  sinonimos: string[];
  observacao: string;
}

export interface GeneratedCard {
  front: string;
  back: string;
}
