import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../engine/types';
import type { Snapshot } from '../engine/runGame';
import { CardTable } from '../engine/CardTable';

export function MobileGameView({
  game,
  snapshots,
}: {
  game: Game;
  snapshots: Snapshot[];
}) {
  const [active, setActive] = useState(0);
  const total = snapshots.length;
  const snap = snapshots[active];
  const instructionsRef = useRef<HTMLDivElement>(null);

  const advance = () => setActive((a) => (a + 1) % total);

  useEffect(() => {
    instructionsRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[#eaf2ff] select-none">
      <div className="shrink-0 flex items-center justify-between gap-3 border-b-[3px] border-line bg-surface px-4 py-3">
        <Link to="/" className="bg-ink px-3 py-2 font-display text-[0.65rem] uppercase tracking-widest text-white">
          ← Home
        </Link>
        <span className="truncate font-display text-lg uppercase leading-none tracking-[-0.03em] text-ink">
          {game.title}
        </span>
        {game.origin ? (
          <details className="relative">
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none bg-accent-yellow px-3 py-2 font-display text-[0.65rem] uppercase tracking-widest text-ink">
              Origins
            </summary>
            <div className="absolute right-0 top-full mt-3 z-40 w-[min(88vw,28rem)] max-h-[60vh] overflow-y-auto border-[3px] border-line bg-surface p-5 shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
              <p className="font-display text-xs uppercase tracking-[0.2em] text-accent-red">Origins</p>
              <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-relaxed text-ink-soft">{game.origin}</p>
            </div>
          </details>
        ) : (
          <span className="w-16" />
        )}
      </div>

      <button
        type="button"
        onClick={advance}
        aria-label="Next step"
        className="flex-1 min-h-0 flex flex-col text-left w-full cursor-pointer focus:outline-none"
      >
        <div className="shrink-0 px-3 pt-4">
          <div className="mx-auto max-w-[52rem]">
            <CardTable snapshot={snap} zones={game.zones} />
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-5 py-3">
          <span className="shrink-0 bg-accent-yellow px-2.5 py-1 font-display text-[0.62rem] uppercase tracking-widest text-ink">
            {String(active + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
          <div className="flex flex-1 items-center gap-1.5">
            {snapshots.map((s, i) => (
              <span
                key={s.step.id}
                className={`h-2 flex-1 border-2 border-line transition-colors duration-300 ${i <= active ? 'bg-accent-yellow' : 'bg-white'}`}
              />
            ))}
          </div>
        </div>

        <div ref={instructionsRef} className="flex-1 min-h-0 overflow-y-auto px-5 pt-1 pb-4">
          <article className="border-[3px] border-line bg-surface p-5 shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
            <h2 className="font-display text-3xl uppercase leading-none tracking-[-0.04em] text-ink">
              {snap.step.title}
            </h2>
            <p className="mt-4 text-base font-semibold leading-relaxed text-ink-soft">
              {snap.step.narration}
            </p>
            {snap.step.callout && (
              <p className="mt-4 border-l-[6px] border-accent-red bg-paper p-3 text-[0.95rem] leading-relaxed text-ink">
                {snap.step.callout}
              </p>
            )}
          </article>
        </div>

        <div className="shrink-0 pb-4 text-center">
          <span className="bg-ink px-4 py-2 font-display text-[0.65rem] uppercase tracking-widest text-white">
            {active === total - 1 ? 'Tap to restart ↺' : 'Tap to continue →'}
          </span>
        </div>
      </button>
    </div>
  );
}
