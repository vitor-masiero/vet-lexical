"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import { Modal } from "@/components/modal";
import {
  BookIcon,
  CardsIcon,
  CheckIcon,
  LoaderIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { apiFetch } from "@/lib/client-api";
import type { GlossaryEntry } from "@/lib/types";

interface EditForm {
  term: string;
  definition: string;
  examplesText: string;
  synonymsText: string;
  note: string;
}

const EMPTY_FORM: EditForm = {
  term: "",
  definition: "",
  examplesText: "",
  synonymsText: "",
  note: "",
};

export default function GlossarioPage() {
  const { show } = useToast();
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<GlossaryEntry | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<GlossaryEntry | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [cardBusy, setCardBusy] = useState<string | null>(null);
  const [cardDone, setCardDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    apiFetch<GlossaryEntry[]>("/api/glossary")
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((err) => {
        if (active) {
          show(
            err instanceof Error
              ? err.message
              : "Erro ao carregar o glossário.",
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q),
    );
  }, [entries, query]);

  function openEdit(entry: GlossaryEntry) {
    setEditing(entry);
    setForm({
      term: entry.term,
      definition: entry.definition,
      examplesText: entry.examples.join("\n"),
      synonymsText: entry.synonyms.join(", "),
      note: entry.note ?? "",
    });
  }

  async function saveEdit() {
    if (!editing || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await apiFetch<GlossaryEntry>(
        `/api/glossary/${editing.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            term: form.term,
            definition: form.definition,
            examples: form.examplesText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            synonyms: form.synonymsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            note: form.note,
          }),
        },
      );
      setEntries((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
      setEditing(null);
      show("Nota atualizada!");
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao atualizar a nota.",
        "error",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await apiFetch<{ ok: boolean }>(`/api/glossary/${deleting.id}`, {
        method: "DELETE",
      });
      setEntries((prev) => prev.filter((e) => e.id !== deleting.id));
      setDeleting(null);
      show("Nota excluída.");
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao excluir a nota.",
        "error",
      );
    } finally {
      setDeletingBusy(false);
    }
  }

  async function makeCard(entry: GlossaryEntry) {
    if (cardBusy) return;
    setCardBusy(entry.id);
    try {
      await apiFetch(`/api/flashcards/from-glossary/${entry.id}`, {
        method: "POST",
      });
      setCardDone((prev) => new Set(prev).add(entry.id));
      show("Flashcard gerado!");
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao gerar flashcard.",
        "error",
      );
    } finally {
      setCardBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Glossário
            </h1>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              {entries.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Suas palavras aprendidas, sempre à mão.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-teal-400 dark:border-slate-800 dark:bg-slate-900">
          <SearchIcon className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar glossário..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:w-52 dark:text-slate-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="skeleton h-5 w-36 rounded-lg" />
              <div className="skeleton mt-3 h-3.5 w-full rounded-full" />
              <div className="skeleton mt-2 h-3.5 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          Nenhuma palavra encontrada para “{query}”.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className="animate-in-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="px-5 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {entry.term}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      aria-label="Editar nota"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800 dark:hover:text-teal-300"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(entry)}
                      aria-label="Excluir nota"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {entry.definition}
                </p>

                {entry.synonyms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.synonyms.slice(0, 4).map((syn) => (
                      <span
                        key={syn}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">
                  {entry.examples.length > 0
                    ? `${entry.examples.length} exemplo${entry.examples.length > 1 ? "s" : ""}`
                    : "Sem exemplos"}
                </span>
                <button
                  type="button"
                  onClick={() => makeCard(entry)}
                  disabled={cardBusy === entry.id || cardDone.has(entry.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    cardDone.has(entry.id)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40"
                  }`}
                >
                  {cardBusy === entry.id ? (
                    <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : cardDone.has(entry.id) ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <CardsIcon className="h-3.5 w-3.5" />
                  )}
                  {cardDone.has(entry.id) ? "Card criado" : "Virar card"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de edição */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar nota"
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
              disabled={savingEdit || !form.term.trim() || !form.definition.trim()}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {savingEdit && <LoaderIcon className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Palavra">
            <input
              value={form.term}
              onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </Field>
          <Field label="Significado">
            <textarea
              value={form.definition}
              onChange={(e) =>
                setForm((f) => ({ ...f, definition: e.target.value }))
              }
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </Field>
          <Field label="Exemplos (um por linha)">
            <textarea
              value={form.examplesText}
              onChange={(e) =>
                setForm((f) => ({ ...f, examplesText: e.target.value }))
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </Field>
          <Field label="Sinônimos (separados por vírgula)">
            <input
              value={form.synonymsText}
              onChange={(e) =>
                setForm((f) => ({ ...f, synonymsText: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </Field>
          <Field label="Observação">
            <input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </Field>
        </div>
      </Modal>

      {/* Modal de exclusão */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir nota"
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
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {deletingBusy && <LoaderIcon className="h-4 w-4 animate-spin" />}
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Tem certeza que deseja excluir <strong>{deleting?.term}</strong> do
          glossário? Essa ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function EmptyState() {
  return (
    <div className="animate-in-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
        <BookIcon className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Seu glossário está vazio
      </h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        Pesquise uma palavra e salve o significado para começar a montar o seu
        glossário.
      </p>
      <Link
        href="/buscar"
        className="mt-5 flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
      >
        <SearchIcon className="h-4 w-4" />
        Pesquisar palavra
      </Link>
    </div>
  );
}
