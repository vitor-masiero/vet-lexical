"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/toast";
import {
  LoaderIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "@/components/icons";
import { apiFetch } from "@/lib/client-api";
import type { Flashcard, GeneratedCard } from "@/lib/types";

interface CreateTabProps {
  onCreated: () => void;
}

export function CreateTab({ onCreated }: CreateTabProps) {
  const { show } = useToast();

  // Criação manual
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  // Geração com IA
  const [context, setContext] = useState("");
  const [count, setCount] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);

  async function createManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!front.trim() || !back.trim() || saving) return;
    setSaving(true);
    try {
      await apiFetch<Flashcard>("/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ front, back, source: "manual" }),
      });
      setFront("");
      setBack("");
      show("Flashcard criado!");
      onCreated();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao criar o card.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function generate() {
    if (!context.trim() || generating) return;
    setGenerating(true);
    setGenerated([]);
    try {
      const data = await apiFetch<{ cards: GeneratedCard[] }>(
        "/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ context, count }),
        },
      );
      setGenerated(data.cards);
      show(`${data.cards.length} flashcards gerados. Revise e salve!`, "info");
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao gerar os flashcards.",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveBatch() {
    if (generated.length === 0 || savingBatch) return;
    setSavingBatch(true);
    try {
      await apiFetch<Flashcard[]>("/api/flashcards/bulk", {
        method: "POST",
        body: JSON.stringify({
          cards: generated.map((c) => ({
            front: c.front,
            back: c.back,
            source: "ai",
          })),
        }),
      });
      const total = generated.length;
      setGenerated([]);
      setContext("");
      show(`${total} flashcards salvos!`);
      onCreated();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao salvar os cards.",
        "error",
      );
    } finally {
      setSavingBatch(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Manual */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <PlusIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Criar manualmente
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Frente e verso do seu jeito.
            </p>
          </div>
        </div>

        <form onSubmit={createManual} className="space-y-3">
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={2}
            placeholder="Frente — pergunta, frase ou palavra"
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={2}
            placeholder="Verso — resposta"
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !front.trim() || !back.trim()}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              Adicionar card
            </button>
          </div>
        </form>
      </section>

      {/* IA */}
      <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-5 shadow-sm dark:border-teal-900/60 dark:from-teal-950/30 dark:to-emerald-950/20">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Gerar com IA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Descreva um assunto e a IA cria os cards para você.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder="Ex.: sinais clínicos e diagnóstico de cianose em pequenos animais"
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              Quantidade
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {[5, 8, 10, 12, 15].map((n) => (
                  <option key={n} value={n}>
                    {n} cards
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={generating || !context.trim()}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {generating ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {generating ? "Gerando..." : "Gerar"}
            </button>
          </div>
        </div>

        {generating && (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="skeleton h-16 w-full rounded-xl"
              />
            ))}
          </div>
        )}

        {generated.length > 0 && !generating && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pré-visualização ({generated.length})
              </p>
              <button
                type="button"
                onClick={() => setGenerated([])}
                className="text-xs font-medium text-slate-400 hover:text-rose-600"
              >
                Descartar
              </button>
            </div>
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {generated.map((card, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {card.front}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {card.back}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setGenerated((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remover card"
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={saveBatch}
              disabled={savingBatch || generated.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingBatch ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              Salvar {generated.length} cards
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
