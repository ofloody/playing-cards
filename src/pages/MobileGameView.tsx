import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../engine/types';
import type { Snapshot } from '../engine/runGame';
import { CardTable } from '../engine/CardTable';

// Phone layout: a fixed full-screen panel with the animation pinned to the top
// and the directions at the bottom. There's no scroll slider — tapping anywhere
// advances to the next step, looping back to the first once you pass the last.
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

  const advance = () => setActive((a) => (a + 1) % total);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-paper select-none">
      {/* Slim top bar — links stay tappable without advancing the walkthrough. */}
      <header className="shrink-0 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-ink-soft hover:text-accent text-xs uppercase tracking-widest transition-colors"
          >
            ← Handbook
          </Link>
          <span className="font-display text-lg font-semibold text-ink truncate">
            {game.title}
          </span>
          {game.origin ? (
            <details className="relative">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none rounded-full border border-accent/40 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-accent">
                Origins
              </summary>
              <div className="absolute right-0 top-full mt-3 z-40 w-[min(88vw,28rem)] max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-paper p-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.4)]">
                <p className="font-display text-xs uppercase tracking-[0.25em] text-accent mb-3">
                  Origins
                </p>
                <p className="font-body text-ink-soft leading-relaxed text-[0.9rem] whitespace-pre-line">
                  {game.origin}
                </p>
              </div>
            </details>
          ) : (
            <span className="w-12" />
          )}
        </div>
      </header>

      {/* Tap surface — the whole play area advances the walkthrough on tap. */}
      <button
        type="button"
        onClick={advance}
        aria-label="Next step"
        className="flex-1 min-h-0 flex flex-col text-left w-full cursor-pointer focus:outline-none"
      >
        {/* Animation, pinned to the top. */}
        <div className="shrink-0 px-3 pt-3">
          <div className="deco-corners">
            <CardTable snapshot={snap} zones={game.zones} />
          </div>
        </div>

        {/* Progress dots — a light cue, not a slider. */}
        <div className="shrink-0 flex items-center justify-center gap-1.5 py-3">
          {snapshots.map((s, i) => (
            <span
              key={s.step.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-5 bg-accent' : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>

        {/* Directions, anchored at the bottom. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-3 flex flex-col justify-center">
          <span className="font-body text-[0.65rem] uppercase tracking-[0.3em] text-ink-soft tabular-nums">
            {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink mt-2">
            {snap.step.title}
          </h2>
          <p className="font-body text-base text-ink mt-3 leading-relaxed">
            {snap.step.narration}
          </p>
          {snap.step.callout && (
            <p className="mt-4 border-l-2 border-accent pl-4 text-ink-soft italic font-body text-[0.95rem]">
              {snap.step.callout}
            </p>
          )}
        </div>

        {/* Tap hint. */}
        <div className="shrink-0 pb-4 text-center">
          <span className="font-body text-[0.65rem] uppercase tracking-[0.3em] text-ink-soft">
            {active === total - 1 ? 'Tap to restart ↺' : 'Tap to continue →'}
          </span>
        </div>
      </button>
    </div>
  );
}
