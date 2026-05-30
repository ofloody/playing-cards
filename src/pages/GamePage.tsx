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
    <>
      {/* Slim fixed top bar — kept out of the document flow so the first step
          can sit at the vertical centre, in line with the table. */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-ink-soft hover:text-accent text-sm uppercase tracking-widest transition-colors">
            ← Handbook
          </Link>
          <div className="flex items-center gap-4 md:gap-5">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xl font-semibold text-ink">{game.title}</span>
              <span className="hidden sm:inline font-body text-xs uppercase tracking-widest text-ink-soft">
                {game.players} players · {game.playTime} · {game.difficulty}
              </span>
            </div>
            {game.origin && (
              <details className="relative">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none rounded-full border border-accent/40 px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-accent hover:border-accent hover:text-accent-soft transition-colors">
                  Origins
                </summary>
                <div className="absolute right-0 top-full mt-3 z-40 w-[min(88vw,30rem)] rounded-xl border border-line bg-paper p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.4)]">
                  <p className="font-display text-xs uppercase tracking-[0.25em] text-accent mb-3">Origins</p>
                  <p className="font-body text-ink-soft leading-relaxed text-[0.95rem]">{game.origin}</p>
                </div>
              </details>
            )}
          </div>
        </div>
      </header>

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

      <main className="mx-auto max-w-6xl px-4 md:px-8 pt-16 md:pt-0 pb-[10vh]">
        <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-12">
          {/* Sticky table — vertically centred in the viewport so it lines up
              with the centred active step, first and last included. On mobile
              it sticks just below the top bar. */}
          <div className="sticky top-20 md:top-0 md:h-screen md:self-start md:flex md:items-center z-10">
            <div className="deco-corners w-full">
              <CardTable snapshot={snap} zones={game.zones} />
            </div>
          </div>

          {/* Scrolling step panels — each fills the viewport so its centred
              text aligns with the centred table. */}
          <ol>
            {snapshots.map((s, i) => (
              <li
                key={s.step.id}
                data-index={i}
                ref={register(i)}
                className={`min-h-screen flex flex-col justify-center py-10 transition-opacity duration-500 ${
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
          <section className="mt-8 md:mt-16 max-w-3xl">
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
    </>
  );
}
