import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gameMap } from '../games';
import { runGame } from '../engine/runGame';
import { CardTable } from '../engine/CardTable';
import { useActiveStep } from '../engine/useActiveStep';

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
      <nav className="py-6">
        <Link to="/" className="text-cream/60 hover:text-brass-soft text-sm uppercase tracking-widest">
          ← Handbook
        </Link>
      </nav>

      <header className="mb-8 md:mb-0">
        <h1 className="font-display text-5xl md:text-6xl font-black text-cream">{game.title}</h1>
        <p className="font-body text-cream/70 mt-3 max-w-xl">{game.blurb}</p>
      </header>

      <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-10">
        {/* Sticky table */}
        <div className="md:sticky md:top-6 md:self-start z-10">
          <div className="sticky top-2 md:static">
            <CardTable snapshot={snap} zones={game.zones} />
          </div>
        </div>

        {/* Scrolling step panels */}
        <ol className="mt-8 md:mt-0">
          {snapshots.map((s, i) => (
            <li
              key={s.step.id}
              data-index={i}
              ref={register(i)}
              className={`min-h-[70vh] flex flex-col justify-center py-10 transition-opacity duration-300 ${
                i === active ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span className="font-body text-xs uppercase tracking-[0.3em] text-brass-soft/80">
                Step {i + 1} / {snapshots.length}
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mt-3">
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
