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
        <Link to="/" className="text-accent underline mt-4 inline-block">
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
        <span className="text-accent text-[0.6rem] tracking-[0.25em] [writing-mode:vertical-rl] mb-2">
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
        <Link to="/" className="text-ink-soft hover:text-accent text-sm uppercase tracking-widest transition-colors">
          ← Handbook
        </Link>
      </nav>

      <header className="mb-8 md:mb-0">
        <p className="reveal font-body uppercase tracking-[0.35em] text-accent text-xs mb-3">
          {game.players} players · {game.playTime} · {game.difficulty}
        </p>
        <h1 className="reveal font-display text-5xl md:text-7xl font-black text-ink" style={{ animationDelay: '0.06s' }}>
          {game.title}
        </h1>
        <p className="reveal font-body text-ink-soft mt-3 max-w-xl text-lg" style={{ animationDelay: '0.12s' }}>
          {game.blurb}
        </p>
      </header>

      <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        {/* Sticky table — centred in the viewport so it lines up with the
            centred active step text, including the final step. */}
        <div className="md:sticky md:top-0 md:h-screen md:self-start md:flex md:items-center z-10">
          <div className="sticky top-3 md:static deco-corners w-full py-6 md:py-0">
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
                i === active ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <span className="font-display text-accent text-5xl font-black leading-none tabular-nums">
                {String(i + 1).padStart(2, '0')}
                <span className="font-body text-ink-soft text-base align-top ml-2">
                  / {String(snapshots.length).padStart(2, '0')}
                </span>
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-4">
                {s.step.title}
              </h2>
              <p className="font-body text-lg text-ink-soft mt-4 leading-relaxed">
                {s.step.narration}
              </p>
              {s.step.callout && (
                <p className="mt-5 border-l-2 border-accent pl-4 text-ink-soft italic font-body">
                  {s.step.callout}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Variations & fine print */}
      {game.notes && game.notes.length > 0 && (
        <section className="mt-16 md:mt-24 max-w-3xl">
          <div className="deco-rule mb-10">
            <span className="font-display not-italic text-ink text-sm tracking-[0.25em]">
              VARIATIONS&nbsp;&amp;&nbsp;FINE&nbsp;PRINT
            </span>
          </div>
          <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {game.notes.map((n) => (
              <div key={n.heading} className="border-l-2 border-accent pl-5">
                <dt className="font-display text-xl text-accent mb-2">{n.heading}</dt>
                <dd className="font-body text-ink-soft leading-relaxed">{n.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </main>
  );
}
