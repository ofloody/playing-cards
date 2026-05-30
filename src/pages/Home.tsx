import { Link } from 'react-router-dom';
import { games } from '../games';

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-14 border-b border-brass/30 pb-10">
        <p className="font-body uppercase tracking-[0.35em] text-brass-soft/80 text-xs mb-4">The</p>
        <h1 className="font-display text-6xl md:text-7xl font-black leading-[0.9] text-cream">
          Card Games<br />Handbook
        </h1>
        <p className="font-body text-cream/70 text-lg mt-6 max-w-xl">
          Learn each game the way you actually learn at a table — by watching a hand play out.
          Scroll through any game to see the cards move.
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2">
        {games.map((g) => (
          <li key={g.id}>
            <Link
              to={`/game/${g.id}`}
              className="group block rounded-2xl border border-brass/25 bg-felt-700/30 p-7 transition hover:border-brass/70 hover:bg-felt-700/50"
              style={{ borderLeft: `3px solid ${g.accent ?? 'var(--color-brass)'}` }}
            >
              <h2 className="font-display text-3xl font-semibold text-cream group-hover:text-brass-soft transition">
                {g.title}
              </h2>
              <p className="font-body text-cream/70 mt-2">{g.blurb}</p>
              <div className="mt-5 flex gap-5 text-xs uppercase tracking-wider text-cream/50">
                <span>{g.players} players</span>
                <span>{g.playTime}</span>
                <span>{g.difficulty}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
