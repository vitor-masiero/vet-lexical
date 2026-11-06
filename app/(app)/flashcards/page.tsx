"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { StudyTab } from "@/components/flashcards/study-tab";
import { CreateTab } from "@/components/flashcards/create-tab";
import { ManageTab } from "@/components/flashcards/manage-tab";
import { apiFetch } from "@/lib/client-api";
import type { Flashcard } from "@/lib/types";

type Tab = "estudar" | "criar" | "cards";

const TABS: { id: Tab; label: string }[] = [
  { id: "estudar", label: "Estudar" },
  { id: "criar", label: "Criar" },
  { id: "cards", label: "Meus cards" },
];

export default function FlashcardsPage() {
  const { show } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("estudar");

  const reload = useCallback(async () => {
    try {
      const data = await apiFetch<Flashcard[]>("/api/flashcards");
      setCards(data);
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao carregar flashcards.",
        "error",
      );
    }
  }, [show]);

  useEffect(() => {
    let active = true;
    apiFetch<Flashcard[]>("/api/flashcards")
      .then((data) => {
        if (active) setCards(data);
      })
      .catch((err) => {
        if (active) {
          show(
            err instanceof Error ? err.message : "Erro ao carregar flashcards.",
            "error",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [show]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Flashcards
            </h1>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              {cards.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Revise os conceitos e fixe o conteúdo.
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Seções de flashcards"
        className="mb-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton h-72 w-full rounded-2xl" />
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {tab === "estudar" && (
            <StudyTab cards={cards} onGoCreate={() => setTab("criar")} />
          )}
          {tab === "criar" && <CreateTab onCreated={reload} />}
          {tab === "cards" && (
            <ManageTab
              cards={cards}
              onChanged={reload}
              onGoCreate={() => setTab("criar")}
            />
          )}
        </>
      )}
    </div>
  );
}
