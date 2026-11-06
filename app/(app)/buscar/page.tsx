"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/toast";
import {
  CheckIcon,
  LoaderIcon,
  SearchIcon,
  SparklesIcon,
} from "@/components/icons";
import { apiFetch } from "@/lib/client-api";
import type { GlossaryEntry, WordDefinition } from "@/lib/types";

const SUGGESTIONS = ["Cianose", "Dispneia", "Anorexia", "Zoonose", "Eutanásia"];

export default function BuscarPage() {
  const { show } = useToast();
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function search(value: string) {
    const query = value.trim();
    if (!query || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const data = await apiFetch<WordDefinition>("/api/words/search", {
        method: "POST",
        body: JSON.stringify({ term: query }),
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível pesquisar agora.",
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search(term);
  }

  async function saveToGlossary() {
    if (!result || saving || saved) return;
    setSaving(true);
    try {
      await apiFetch<GlossaryEntry>("/api/glossary", {
        method: "POST",
        body: JSON.stringify({
          term: result.termo,
          definition: result.definicao,
          examples: result.exemplos,
          synonyms: result.sinonimos,
          note: result.observacao,
        }),
      });
      setSaved(true);
      show("Palavra salva no glossário!");
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Erro ao salvar a palavra.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Descubra o significado
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pesquise um termo e receba a definição com exemplos em contexto
          veterinário.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow focus-within:border-teal-400 focus-within:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <SearchIcon className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Digite uma palavra (ex.: cianose)"
            autoFocus
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={loading || !term.trim()}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Pesquisar</span>
          </button>
        </div>
      </form>

      {!result && !loading && !error && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Tente:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTerm(s);
                search(s);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {loading && <SkeletonResult />}

        {error && !loading && (
          <div className="animate-in-up rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={() => search(term)}
              className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {result && !loading && (
          <article className="animate-in-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-gradient-to-br from-teal-50 to-emerald-50/50 px-6 py-5 dark:border-slate-800 dark:from-teal-950/40 dark:to-emerald-950/20">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                <SparklesIcon className="h-3.5 w-3.5" />
                Definição com IA
              </span>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
                {result.termo}
              </h2>
            </div>

            <div className="space-y-5 px-6 py-5">
              <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Significado
                </h3>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {result.definicao}
                </p>
              </section>

              {result.exemplos.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Exemplos
                  </h3>
                  <ul className="space-y-2">
                    {result.exemplos.map((example, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
                          {i + 1}
                        </span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {result.sinonimos.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Sinônimos
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.sinonimos.map((syn) => (
                      <span
                        key={syn}
                        className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {result.observacao && (
                <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <span className="font-semibold">Observação: </span>
                  {result.observacao}
                </section>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setTerm("");
                }}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Nova pesquisa
              </button>
              <button
                type="button"
                onClick={saveToGlossary}
                disabled={saving || saved}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  saved
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                }`}
              >
                {saving ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <CheckIcon className="h-4 w-4" />
                ) : null}
                {saved ? "Salvo no glossário" : "Salvar no glossário"}
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

function SkeletonResult() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton mt-3 h-6 w-40 rounded-lg" />
      </div>
      <div className="space-y-4 px-6 py-5">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-full rounded-full" />
          <div className="skeleton h-3.5 w-11/12 rounded-full" />
          <div className="skeleton h-3.5 w-3/4 rounded-full" />
        </div>
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
