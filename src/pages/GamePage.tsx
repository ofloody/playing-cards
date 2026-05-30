import { useEffect, useMemo } from 'react';
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

  // Open each game at the top — route changes don't reset scroll on their own.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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
  const progress = snapshots.length > 1 ? active / (snapshots.length - 1) : 0;

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
                <div className="absolute right-0 top-full mt-3 z-40 w-[min(88vw,32rem)] max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-paper p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.4)]">
                  <p className="font-display text-xs uppercase tracking-[0.25em] text-accent mb-3">Origins</p>
                  <p className="font-body text-ink-soft leading-relaxed text-[0.95rem] whitespace-pre-line">{game.origin}</p>
                </div>
              </details>
            )}
          </div>
        </div>
      </header>

      {/* Progress rail (desktop) — a single "2" card that slides down the
          track as you advance, the line filling in behind it. */}
      <nav
        aria-label="Steps"
        className="hidden lg:flex fixed left-5 top-1/2 -translate-y-1/2 z-20 flex-col items-center"
      >
        <div className="relative h-[58vh] w-9">
          {/* track */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line" />
          {/* filled portion behind the card */}
          <div
            className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-accent transition-[height] duration-500 ease-out"
            style={{ height: `${progress * 100}%` }}
          />
          {/* invisible per-step click zones keep the rail navigable */}
          <div className="absolute inset-0 flex flex-col">
            {snapshots.map((s, i) => (
              <button
                key={s.step.id}
                onClick={() => scrollToStep(i)}
                aria-label={`Step ${i + 1}: ${s.step.title}`}
                aria-current={i === active ? 'step' : undefined}
                className="flex-1 w-full cursor-pointer"
              />
            ))}
          </div>
          {/* the sliding card */}
          <div
            className="rail-card pointer-events-none absolute left-1/2 transition-[top] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
            style={{ top: `${progress * 100}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="rank">2</span>
            <span className="pip">♠</span>
          </div>
        </div>
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
                <span className="font-body text-[0.7rem] uppercase tracking-[0.3em] text-ink-soft tabular-nums">
                  {String(i + 1).padStart(2, '0')} / {String(snapshots.length).padStart(2, '0')}
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-3">
                  {s.step.title}
                </h2>
                <p className="font-body text-lg text-ink mt-4 leading-relaxed">
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
