import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gameMap } from '../games';
import { runGame } from '../engine/runGame';
import { CardTable } from '../engine/CardTable';
import { useActiveStep } from '../engine/useActiveStep';

function scrollToStep(i: number) {
  const el = document.querySelector(`[data-index="${i}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function GamePage() {
  const { id } = useParams();
  const game = id ? gameMap[id] : undefined;
  const snapshots = useMemo(() => (game ? runGame(game) : []), [game]);
  const { active, register } = useActiveStep(snapshots.length);

  if (!game) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-3xl">Unknown game.</p>
        <Link to="/" className="text-brass-soft underline mt-4 inline-block">
          Back to the handbook
        </Link>
      </main>
    );
  }

  const snap = snapshots[Math.min(active, snapshots.length - 1)];

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-8 pb-32">
      {/* Progress rail (desktop) */}
      <nav
        aria-label="Steps"
        className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-3"
      >
        <span className="text-brass-soft/70 text-[0.6rem] tracking-[0.25em] [writing-mode:vertical-rl] mb-2">
          {game.title.toUpperCase()}
        </span>
        {snapshots.map((s, i) => (
          <button
            key={s.step.id}
            onClick={() => scrollToStep(i)}
            aria-label={`Step ${i + 1}: ${s.step.title}`}
            aria-current={i === active ? 'step' : undefined}
            className={`rail-node ${i === active ? 'is-active' : i < active ? 'is-done' : ''}`}
          />
        ))}
      </nav>

      <nav className="py-6">
        <Link to="/" className="text-cream/60 hover:text-brass-soft text-sm uppercase tracking-widest transition-colors">
          ← Handbook
        </Link>
      </nav>

      <header className="mb-8 md:mb-0">
        <p className="reveal font-body uppercase tracking-[0.35em] text-brass-soft/80 text-xs mb-3">
          {game.players} players · {game.playTime} · {game.difficulty}
        </p>
        <h1 className="reveal font-display text-5xl md:text-7xl font-black text-cream" style={{ animationDelay: '0.06s' }}>
          {game.title}
        </h1>
        <p className="reveal font-body text-cream/70 mt-3 max-w-xl text-lg" style={{ animationDelay: '0.12s' }}>
          {game.blurb}
        </p>
      </header>

      <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        {/* Sticky table */}
        <div className="md:sticky md:top-6 md:self-start z-10 py-6">
          <div className="sticky top-3 md:static deco-corners">
            <CardTable snapshot={snap} zones={game.zones} />
          </div>
        </div>

        {/* Scrolling step panels */}
        <ol className="mt-4 md:mt-0">
          {snapshots.map((s, i) => (
            <li
              key={s.step.id}
              data-index={i}
              ref={register(i)}
              className={`min-h-[70vh] flex flex-col justify-center py-10 transition-opacity duration-500 ${
                i === active ? 'opacity-100' : 'opacity-35'
              }`}
            >
              <span className="font-display text-brass-soft/90 text-5xl font-black leading-none tabular-nums">
                {String(i + 1).padStart(2, '0')}
                <span className="font-body text-cream/30 text-base align-top ml-2">
                  / {String(snapshots.length).padStart(2, '0')}
                </span>
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mt-4">
                {s.step.title}
              </h2>
              <p className="font-body text-lg text-cream/80 mt-4 leading-relaxed">
                {s.step.narration}
              </p>
              {s.step.callout && (
                <p className="mt-5 border-l-2 border-brass pl-4 text-cream/70 italic font-body">
                  {s.step.callout}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
