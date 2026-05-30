import { Link } from 'react-router-dom';
import { games } from '../games';

const GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RED = new Set(['H', 'D']);

// A royal hand, fanned across the hero. [rank, suit].
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
        {rank}
        <span className="text-[0.8rem]">{GLYPH[suit]}</span>
      </span>
      <span className="pip-c text-[2.6rem] leading-none">{GLYPH[suit]}</span>
      <span className="pip-b text-[0.95rem] leading-none">
        {rank}
        <span className="text-[0.8rem]">{GLYPH[suit]}</span>
      </span>
    </div>
  );
}

// Deterministic suit motif per game, for the watermark + index mark.
function suitFor(id: string): keyof typeof GLYPH {
  const suits: (keyof typeof GLYPH)[] = ['S', 'H', 'D', 'C'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % suits.length;
  return suits[h];
}

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
      {/* Hero */}
      <section className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
        <div>
          <p className="reveal font-body uppercase tracking-[0.4em] text-accent text-xs mb-5">
            A Field Guide to the Table
          </p>
          <h1
            className="reveal font-display text-6xl md:text-8xl font-black leading-[0.86] text-ink"
            style={{ animationDelay: '0.08s' }}
          >
            Card<br />
            <span className="text-accent">Games</span><br />
            Handbook
          </h1>
          <p
            className="reveal font-body text-ink-soft text-lg mt-7 max-w-md leading-relaxed"
            style={{ animationDelay: '0.16s' }}
          >
            Not a wall of rules — a hand played out in front of you. Scroll any
            game and watch it deal, flip, and resolve, one move at a time.
          </p>
          <div className="reveal mt-9 max-w-md" style={{ animationDelay: '0.24s' }}>
            <div className="deco-rule">
              <span>♠ ♥ ♦ ♣</span>
            </div>
          </div>
        </div>

        {/* Fanned hand */}
        <div
          className="reveal flex justify-center md:justify-end"
          style={{ animationDelay: '0.1s' }}
        >
          <div
            className="fan h-[300px] w-[260px] md:h-[400px] md:w-[360px]"
            style={{ animation: 'floatY 7s ease-in-out infinite' }}
          >
            {HERO_HAND.map(([rank, suit], i) => {
              const mid = (HERO_HAND.length - 1) / 2;
              return (
                <div
                  key={`${rank}-${suit}`}
                  className="fan-slot w-[124px] md:w-[168px]"
                  style={{
                    transform: `translateX(-50%) rotate(${(i - mid) * 13}deg)`,
                    zIndex: i,
                  }}
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
      </section>

      {/* Games */}
      <section className="mt-24 md:mt-32">
        <div className="reveal deco-rule mb-10" style={{ animationDelay: '0.1s' }}>
          <span className="font-display not-italic text-ink text-sm tracking-[0.25em]">
            THE&nbsp;GAMES
          </span>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2">
          {games.map((g, i) => {
            const suit = suitFor(g.id);
            const isRed = RED.has(suit);
            return (
              <li
                key={g.id}
                className="reveal"
                style={{ animationDelay: `${0.16 + i * 0.08}s` }}
              >
                <Link
                  to={`/game/${g.id}`}
                  data-suit={GLYPH[suit]}
                  className="game-card group block rounded-2xl border border-line p-7 hover:border-accent/60"
                  style={{ borderLeft: `3px solid ${g.accent ?? 'var(--color-accent)'}` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display text-4xl font-semibold text-ink group-hover:text-accent transition-colors">
                      {g.title}
                    </h2>
                    <span
                      className="card-index text-xl shrink-0"
                      style={{ color: isRed ? 'var(--color-suit-red)' : 'var(--color-accent)' }}
                    >
                      <span>{g.title[0]}</span>
                      <span>{GLYPH[suit]}</span>
                    </span>
                  </div>
                  <p className="relative z-10 font-body text-ink-soft mt-3 max-w-sm">{g.blurb}</p>
                  <div className="relative z-10 mt-6 flex gap-5 text-xs uppercase tracking-wider text-ink-soft">
                    <span>{g.players} players</span>
                    <span>{g.playTime}</span>
                    <span>{g.difficulty}</span>
                  </div>
                  <span className="relative z-10 mt-6 inline-block text-accent/0 group-hover:text-accent text-sm tracking-widest uppercase transition-colors">
                    Deal me in →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="mt-24 pt-8 border-t border-line text-center text-ink-soft text-xs tracking-[0.3em] uppercase">
        ♠&ensp;♥&ensp;♦&ensp;♣&emsp;Shuffle well&emsp;♣&ensp;♦&ensp;♥&ensp;♠
      </footer>
    </main>
  );
}
