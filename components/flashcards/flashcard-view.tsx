"use client";

interface FlashcardViewProps {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}

export function FlashcardView({
  front,
  back,
  flipped,
  onFlip,
}: FlashcardViewProps) {
  return (
    <div className="flip-scene h-72 w-full sm:h-80">
      <button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "Ver a frente" : "Ver a resposta"}
        className={`flip-card h-full w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 ${
          flipped ? "is-flipped" : ""
        }`}
      >
        <div className="flip-face flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Frente
          </span>
          <div className="flex flex-1 items-center overflow-y-auto py-3">
            <p className="text-xl font-semibold leading-snug text-slate-900 dark:text-slate-50">
              {front}
            </p>
          </div>
          <span className="text-xs text-slate-400">Toque para ver a resposta</span>
        </div>

        <div className="flip-face flip-face-back flex flex-col rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-50 p-6 shadow-sm dark:border-rose-900/60 dark:from-rose-950/40 dark:to-rose-950/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Verso
          </span>
          <div className="flex flex-1 items-center overflow-y-auto py-3">
            <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-slate-800 dark:text-slate-100">
              {back}
            </p>
          </div>
          <span className="text-xs text-slate-400">Toque para voltar</span>
        </div>
      </button>
    </div>
  );
}
