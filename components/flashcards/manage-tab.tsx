"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import { Modal } from "@/components/modal";
import {
  CardsIcon,
  LoaderIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { apiFetch } from "@/lib/client-api";
import type { Flashcard } from "@/lib/types";

interface ManageTabProps {
  cards: Flashcard[];
  onChanged: () => void;
  onGoCreate: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  glossary: "Glossário",
  ai: "IA",
};

const SOURCE_STYLE: Record<string, string> = {
  manual:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  glossary:
    "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  ai: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export function ManageTab({ cards, onChanged, onGoCreate }: ManageTabProps) {
  const { show } = useToast();
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Flashcard | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  function openEdit(card: Flashcard) {
    setEditing(card);
    setFront(card.front);
    setBack(card.back);
  }

  async function saveEdit() {
    if (!editing || saving || !front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      await apiFetch<Flashcard>(`/api/flashcards/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({ front, back }),
      });
      setEditing(null);
      show("Card atualizado!");
      onChanged();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao atualizar o card.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await apiFetch<{ ok: boolean }>(`/api/flashcards/${deleting.id}`, {
        method: "DELETE",
      });
      setDeleting(null);
      show("Card excluído.");
      onChanged();
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao excluir o card.",
        "error",
      );
    } finally {
      setDeletingBusy(false);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="animate-in-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <CardsIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Nenhum card para gerenciar
        </h2>
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Crie seus primeiros flashcards para vê-los aqui.
        </p>
        <button
          type="button"
          onClick={onGoCreate}
          className="mt-5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
        >
          Criar flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ul className="space-y-3">
        {cards.map((card) => (
          <li
            key={card.id}
            className="animate-in-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      SOURCE_STYLE[card.source] ?? SOURCE_STYLE.manual
                    }`}
                  >
                    {SOURCE_LABEL[card.source] ?? card.source}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">
                  {card.front}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                  {card.back}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(card)}
                  aria-label="Editar card"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-700 dark:hover:bg-slate-800 dark:hover:text-rose-300"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(card)}
                  aria-label="Excluir card"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar card"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving || !front.trim() || !back.trim()}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {saving && <LoaderIcon className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Frente
            </span>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Verso
            </span>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir card"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deletingBusy}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deletingBusy && <LoaderIcon className="h-4 w-4 animate-spin" />}
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Tem certeza que deseja excluir este card? Essa ação não pode ser
          desfeita.
        </p>
      </Modal>
    </div>
  );
}
