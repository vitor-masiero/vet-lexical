"use client";

import { useState } from "react";
import { FlashcardView } from "./flashcard-view";
import {
  CardsIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  RotateIcon,
  XIcon,
} from "@/components/icons";
import type { Flashcard } from "@/lib/types";

interface StudyTabProps {
  cards: Flashcard[];
  onGoCreate: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function StudyTab({ cards, onGoCreate }: StudyTabProps) {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());

  function reset(source = cards) {
    setDeck(source);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
  }

  if (cards.length === 0) {
    return (
      <div className="animate-in-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <CardsIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Nenhum flashcard ainda
        </h2>
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Crie cards manualmente, gere com IA ou transforme palavras do
          glossário em flashcards.
        </p>
        <button
          type="button"
          onClick={onGoCreate}
          className="mt-5 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
        >
          <PlusIcon className="h-4 w-4" />
          Criar flashcards
        </button>
      </div>
    );
  }

  const finished = index >= deck.length;

  if (finished) {
    const reviewCards = deck.filter((c) => review.has(c.id));
    return (
      <div className="animate-in-up mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">
          Sessão concluída!
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Você revisou {deck.length} {deck.length === 1 ? "card" : "cards"}.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {known.size}
            </p>
            <p className="text-xs font-medium text-rose-700/80 dark:text-rose-400/80">
              Acertei
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {review.size}
            </p>
            <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80">
              Revisar
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {reviewCards.length > 0 && (
            <button
              type="button"
              onClick={() => reset(reviewCards)}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
            >
              <RotateIcon className="h-4 w-4" />
              Revisar os {reviewCards.length} que errei
            </button>
          )}
          <button
            type="button"
            onClick={() => reset(cards)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateIcon className="h-4 w-4" />
            Reiniciar sessão
          </button>
        </div>
      </div>
    );
  }

  const current = deck[index];
  const progress = Math.round(
    ((known.size + review.size) / deck.length) * 100,
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Card {index + 1} de {deck.length}
        </span>
        <button
          type="button"
          onClick={() => reset(shuffle(cards))}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-300"
        >
          <RotateIcon className="h-3.5 w-3.5" />
          Embaralhar
        </button>
      </div>

      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-rose-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <FlashcardView
        front={current.front}
        back={current.back}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setFlipped(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setReview((s) => new Set(s).add(current.id));
              setFlipped(false);
              setIndex((i) => i + 1);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <XIcon className="h-4 w-4" />
            Não sei
          </button>
          <button
            type="button"
            onClick={() => {
              setKnown((s) => new Set(s).add(current.id));
              setFlipped(false);
              setIndex((i) => i + 1);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <CheckIcon className="h-4 w-4" />
            Sei
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setFlipped(false);
            setIndex((i) => Math.min(deck.length - 1, i + 1));
          }}
          disabled={index === deck.length - 1}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
