import { Link, useNavigate } from 'react-router-dom';
import { games } from '../games';

const GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RED = new Set(['H', 'D']);
const MARKS = ['mark-red', 'mark-blue', 'mark-green', 'mark-yellow'];
const HERO_HAND: [string, keyof typeof GLYPH][] = [
  ['10', 'S'],
  ['J', 'C'],
  ['Q', 'D'],
  ['K', 'H'],
  ['A', 'S'],
];

function MiniCard({ rank, suit }: { rank: string; suit: keyof typeof GLYPH }) {
  const colour = RED.has(suit) ? 'var(--color-suit-red)' : 'var(--color-suit-ink)';
  return (
    <div className="fan-card" style={{ color: colour }}>
      <span className="text-[0.95rem] leading-none">
        {rank}<span className="text-[0.8rem]">{GLYPH[suit]}</span>
      </span>
      <span className="pip-c text-[2.6rem] leading-none">{GLYPH[suit]}</span>
      <span className="pip-b text-[0.95rem] leading-none">
        {rank}<span className="text-[0.8rem]">{GLYPH[suit]}</span>
      </span>
    </div>
  );
}

function suitFor(id: string): keyof typeof GLYPH {
  const suits: (keyof typeof GLYPH)[] = ['S', 'H', 'D', 'C'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % suits.length;
  return suits[h];
}

export default function Home() {
  const navigate = useNavigate();
  return (
    <main>
        <section id="about" className="mx-auto max-w-6xl px-6 pb-12 pt-14 md:pt-20">
          <div className="inline-block">
            <div className="reveal border-[5px] border-line bg-surface px-4 py-2 text-center font-display text-3xl uppercase tracking-[0.22em] shadow-[4px_4px_0_rgba(0,0,0,0.65)] md:text-5xl">
              Card Guide
            </div>

            <div className="reveal mt-10 grid grid-cols-2 items-center gap-x-6 gap-y-4 md:grid-cols-4" aria-hidden="true" style={{ animationDelay: '0.08s' }}>
              {MARKS.map((mark) => (
                <span key={mark} className={`nav-mark ${mark}`} />
              ))}
            </div>
          </div>
        </section>

        <section id="learn" className="mx-auto max-w-6xl bg-surface px-6 py-10 md:px-10 md:py-14">
          <div className="grid items-center gap-10 md:grid-cols-[0.92fr_1.08fr]">
            <div className="reveal">
              <p className="font-display text-sm uppercase tracking-[0.22em] text-accent-red">
                For our ever-worsening long term memory
              </p>
              <h1 className="mt-5 font-display text-5xl uppercase leading-[0.9] tracking-[-0.04em] text-ink md:text-7xl">
                Card Game<br /><span className="whitespace-nowrap">Field Guide</span>
              </h1>
              <p className="mt-7 max-w-xl text-xl leading-relaxed text-ink-soft">
                A graphic, animated rulebook for card games.
              </p>
              <a href="#games" className="mt-8 inline-block border-4 border-line bg-accent-yellow px-6 py-3 font-display uppercase tracking-wide shadow-[3px_3px_0_rgba(0,0,0,0.65)] transition-transform hover:-translate-y-1">
                Browse games →
              </a>
            </div>

            <div className="reveal flex justify-center md:justify-end" style={{ animationDelay: '0.1s' }}>
              <div className="fan h-[300px] w-[260px] md:h-[400px] md:w-[360px]" style={{ animation: 'floatY 7s ease-in-out infinite' }}>
                {HERO_HAND.map(([rank, suit], i) => {
                  const mid = (HERO_HAND.length - 1) / 2;
                  // Easter egg: the Queen deals you into President.
                  const isQueen = rank === 'Q';
                  return (
                    <div
                      key={`${rank}-${suit}`}
                      className={`fan-slot w-[124px] md:w-[168px]${isQueen ? ' cursor-pointer' : ''}`}
                      style={{ ['--rot' as string]: `${(i - mid) * 13}deg`, zIndex: i } as React.CSSProperties}
                      onClick={isQueen ? () => navigate('/game/president') : undefined}
                    >
                      <MiniCard rank={rank} suit={suit} />
                    </div>
                  );
                })}
                <style>{`
                  .fan-slot:nth-child(1) .fan-card { animation-delay: .35s; }
                  .fan-slot:nth-child(2) .fan-card { animation-delay: .45s; }
                  .fan-slot:nth-child(3) .fan-card { animation-delay: .55s; }
                  .fan-slot:nth-child(4) .fan-card { animation-delay: .65s; }
                  .fan-slot:nth-child(5) .fan-card { animation-delay: .75s; }
                `}</style>
              </div>
            </div>
          </div>
        </section>

        <section id="games" className="mt-16 bg-accent-yellow px-4 py-16 sm:px-6 md:mt-24 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="reveal deco-rule mb-12">
              <span>THE GAMES</span>
            </div>

            <ul className="grid gap-8 lg:grid-cols-2">
              {games.map((g, i) => {
                const suit = suitFor(g.id);
                const isRed = RED.has(suit);
                return (
                  <li key={g.id} className="reveal" style={{ animationDelay: `${0.12 + i * 0.08}s` }}>
                    <Link to={`/game/${g.id}`} data-suit={GLYPH[suit]} className="game-card group block p-6 sm:p-7 md:p-8">
                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <h2 className="font-display text-4xl uppercase leading-none tracking-[-0.05em] text-ink group-hover:text-accent sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                          {g.title}
                        </h2>
                        <span className="card-index shrink-0 text-2xl" style={{ color: isRed ? 'var(--color-suit-red)' : 'var(--color-accent)' }}>
                          <span>{g.title[0]}</span><span>{GLYPH[suit]}</span>
                        </span>
                      </div>
                      <p className="relative z-10 mt-5 max-w-md text-base leading-snug text-ink sm:text-lg">{g.blurb}</p>
                      <div className="relative z-10 mt-8 grid grid-cols-3 gap-2 text-center font-display text-[0.62rem] uppercase tracking-wide sm:gap-3 sm:text-[0.72rem]">
                        <span className="flex min-h-[4.5rem] items-center justify-center border-4 border-line px-2 py-3 leading-tight">{g.players}<br />players</span>
                        <span className="flex min-h-[4.5rem] items-center justify-center border-4 border-line px-2 py-3 leading-tight">{g.playTime}</span>
                        <span className="flex min-h-[4.5rem] items-center justify-center border-4 border-line px-2 py-3 leading-tight">{g.difficulty}</span>
                      </div>
                      <span className="relative z-10 mt-8 inline-block bg-ink px-5 py-3 font-display text-sm uppercase tracking-wider text-white">
                        Deal me in →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <footer className="bg-ink px-6 py-10 text-center font-display text-xs uppercase tracking-[0.35em] text-white">
          ♠ ♥ ♦ ♣ &nbsp; Shuffle well &nbsp; ♣ ♦ ♥ ♠
        </footer>
      </main>
  );
}
