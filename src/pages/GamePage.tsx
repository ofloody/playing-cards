import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gameMap } from '../games';
import { runGame } from '../engine/runGame';
import { CardTable } from '../engine/CardTable';
import { NarrationText } from '../engine/NarrationText';
import { useActiveStep } from '../engine/useActiveStep';
import { useIsMobile } from '../engine/useIsMobile';
import { MobileGameView } from './MobileGameView';

function scrollToStep(i: number, behavior: ScrollBehavior = 'smooth') {
  const targetEl = document.querySelector<HTMLElement>(`[data-index="${i}"]`);
  if (!targetEl) return;

  // The board is sticky and centred at the viewport's vertical middle, and each
  // step panel rests at that same middle. So aligning the panel's centre to
  // innerHeight / 2 lands the next card squarely on the game board.
  const targetRect = targetEl.getBoundingClientRect();
  const target = window.scrollY + targetRect.top + targetRect.height / 2 - window.innerHeight / 2;

  window.scrollTo({ top: Math.max(0, target), behavior });
}

export default function GamePage() {
  const { id } = useParams();
  const game = id ? gameMap[id] : undefined;
  const snapshots = useMemo(() => (game ? runGame(game) : []), [game]);
  // The scroll-reveal layout needs the two-column grid (Tailwind `lg`); below
  // that width the tap-driven mobile view is used instead.
  const isMobile = useIsMobile(1024);
  // Only observe step panels in the desktop layout; passing `!isMobile` rebuilds
  // the observer when the panels remount after a resize back from mobile.
  const { active, register } = useActiveStep(snapshots.length, !isMobile);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Each advance is treated as "go to the next card", not a raw page-scroll: we
  // track an intended step index that bumps on every press, so two quick taps
  // jump two cards forward instead of one press interrupting the other's scroll.
  const targetRef = useRef(0);
  const programmaticRef = useRef(false);
  const settleRef = useRef(0);
  const cycleRef = useRef(0);
  // While cycling we both gather the cards to the centre and force the displayed
  // snapshot, so the board doesn't depend on the scroll observer mid-transition.
  const [collapsed, setCollapsed] = useState(false);
  const [resetTo, setResetTo] = useState<number | null>(null);

  // Looping across the ends (last→first or first→last) shouldn't replay every
  // step: gather the deck to the middle, jump the page instantly (no smooth
  // scroll = no fast-reverse replay), then deal the cards out to the target step.
  const cycleTo = (target: number) => {
    programmaticRef.current = true;
    clearTimeout(settleRef.current);
    clearTimeout(cycleRef.current);
    setCollapsed(true);
    cycleRef.current = window.setTimeout(() => {
      scrollToStep(target, 'instant');
      targetRef.current = target;
      setResetTo(target);
      setCollapsed(false);
      settleRef.current = window.setTimeout(() => {
        setResetTo(null);
        programmaticRef.current = false;
      }, 700);
    }, 420);
  };

  const goToStep = (i: number) => {
    const n = snapshots.length;
    // Wrap around in both directions: advancing past the last step cycles back to
    // the first (and stepping back from the first lands on the last), via the
    // gather-to-centre transition rather than a long scroll.
    if (i < 0 || i >= n) {
      cycleTo(((i % n) + n) % n);
      return;
    }
    targetRef.current = i;
    programmaticRef.current = true;
    clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => {
      programmaticRef.current = false;
    }, 900);
    scrollToStep(i);
  };
  const goToRef = useRef(goToStep);
  goToRef.current = goToStep;

  // While the reader scrolls by hand (wheel, trackpad), keep the keyboard target
  // aligned to whatever step they land on. Don't clobber it mid programmatic jump.
  useEffect(() => {
    if (!programmaticRef.current) targetRef.current = active;
  }, [active]);

  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      const fwd = e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown';
      const back = e.key === 'ArrowUp' || e.key === 'PageUp';
      if (!fwd && !back) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      // A focused rail/title button would otherwise eat the spacebar and fire its
      // own click (forward), cancelling Shift+Space's backward step. Drop focus.
      if (el && el.tagName === 'BUTTON') el.blur();
      const dir = back || (e.key === ' ' && e.shiftKey) ? -1 : 1;
      goToRef.current(targetRef.current + dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile]);

  if (!game) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <p className="font-display text-3xl uppercase">Unknown game.</p>
          <Link to="/" className="mt-4 inline-block underline">
            Back to the handbook
          </Link>
      </main>
    );
  }

  if (isMobile) {
    return <MobileGameView game={game} snapshots={snapshots} />;
  }

  const snap = snapshots[resetTo ?? Math.min(active, snapshots.length - 1)];
  const progress = snapshots.length > 1 ? active / (snapshots.length - 1) : 0;

  return (
    <>
      <nav aria-label="Steps" className="hidden lg:flex fixed left-5 top-1/2 z-20 -translate-y-1/2 flex-col items-center">
        <div className="relative h-[58vh] w-12">
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white shadow-[0_0_0_2px_#000]" />
          <div className="absolute left-1/2 top-0 w-1 -translate-x-1/2 bg-accent-yellow transition-[height] duration-500 ease-out" style={{ height: `${progress * 100}%` }} />
          <div className="absolute inset-0 flex flex-col">
            {snapshots.map((s, i) => (
              <button
                key={s.step.id}
                onClick={() => goToStep(i)}
                aria-label={`Step ${i + 1}: ${s.step.title}`}
                aria-current={i === active ? 'step' : undefined}
                className="flex-1 w-full cursor-pointer"
              />
            ))}
          </div>
          <div className="rail-card pointer-events-none absolute left-1/2 transition-[top] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]" style={{ top: `${progress * 100}%`, transform: 'translate(-50%, -50%)' }}>
            <span className="rank">{String(active + 1).padStart(2, '0')}</span>
            <span className="pip">♠</span>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-[#eaf2ff] pb-[10vh]">
        <div className="px-4 pt-6 md:px-8 lg:pl-28">
          <div className="mx-auto max-w-6xl">
          {/* Compact masthead row, kept out of the table/steps columns so the game
              stats never overlap the instruction card. */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link to="/" className="inline-block bg-ink px-4 py-2 font-display text-xs uppercase tracking-widest text-white hover:bg-accent-yellow hover:text-ink">
              ← Handbook
            </Link>
            <div className="grid grid-cols-3 gap-2 border-[3px] border-line bg-white p-2 font-display text-[0.7rem] uppercase tracking-wide">
              <span className="flex items-center justify-center border-[3px] border-line px-2.5 py-2 text-center leading-tight">{game.players}<br />players</span>
              <span className="flex items-center justify-center border-[3px] border-line px-2.5 py-2 text-center leading-tight">{game.playTime}</span>
              <span className="flex items-center justify-center border-[3px] border-line px-2.5 py-2 text-center leading-tight">{game.difficulty}</span>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="z-10">
              {/* The title sits right under Handbook and pins while you scroll;
                  click it to return to the top. */}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label={`Back to top of ${game.title}`}
                className="sticky top-4 z-30 block w-fit max-w-full cursor-pointer bg-[#eaf2ff] py-1 pr-4 text-left"
              >
                <h1 className="font-display text-5xl uppercase leading-none tracking-[-0.05em] text-ink md:text-7xl">
                  {game.title}
                </h1>
              </button>
              {/* Pull the table up so it centres in the viewport aligned with the
                  first instruction; sticky top-0 keeps it centred on scroll. */}
              <div className="sticky top-0 flex h-screen items-center lg:-mt-20">
                <CardTable snapshot={snap} zones={game.zones} collapsed={collapsed} />
              </div>
            </div>

            <ol>
              {snapshots.map((s, i) => (
                <li
                  key={s.step.id}
                  data-index={i}
                  ref={register(i)}
                  onClick={() => goToStep(i + 1)}
                  className={`min-h-[70vh] lg:min-h-screen flex flex-col justify-center py-10 transition-all duration-500 ${i === active ? 'opacity-100 translate-x-0' : 'opacity-45 lg:translate-x-2'}`}
                >
                  <article className="cursor-pointer border-[3px] border-line bg-surface p-7 shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
                    <span className="inline-block bg-accent-yellow px-3 py-2 font-display text-xs uppercase tracking-[0.18em] text-ink tabular-nums">
                      {String(i + 1).padStart(2, '0')} / {String(snapshots.length).padStart(2, '0')}
                    </span>
                    <h2 className="mt-5 font-display text-3xl uppercase leading-[1] tracking-[-0.035em] text-ink md:text-4xl">
                      {s.step.title}
                    </h2>
                    <p className="mt-5 text-lg font-semibold leading-relaxed text-ink-soft">
                      <NarrationText text={s.step.narration} zones={game.zones} />
                    </p>
                    {s.step.callout && (
                      <p className="mt-6 border-l-[6px] border-accent-red bg-paper p-4 text-base leading-relaxed text-ink">
                        <NarrationText text={s.step.callout} zones={game.zones} />
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </div>

          {game.notes && game.notes.length > 0 && (
            <section className="mt-8 md:mt-16">
              <div className="deco-rule mb-10">
                <span>Variations & Fine Print</span>
              </div>
              <dl className="grid gap-7 sm:grid-cols-2">
                {game.notes.map((n) => (
                  <div key={n.heading} className="border-[3px] border-line bg-surface p-6 shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
                    <dt className="font-display text-2xl uppercase text-accent">{n.heading}</dt>
                    <dd className="mt-3 leading-relaxed text-ink-soft">{n.body}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {game.origin && (
            <details className="mt-10 border-[3px] border-line bg-surface p-6 shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
              <summary className="cursor-pointer select-none font-display uppercase tracking-wide text-ink">Origins</summary>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">{game.origin}</p>
            </details>
          )}
          </div>
        </div>
      </main>
    </>
  );
}
