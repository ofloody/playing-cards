# Card Games Handbook

A lightweight web rulebook that teaches card games the way you learn them at a
table — by watching a hand play out. Each game is a scroll-through sequence:
narration on one side, an animated felt table on the other, with the cards
dealing, flipping, and moving as you read.

The point of the project is the **engine**: adding a game means writing one data
file, never touching animation code.

## Commands

```bash
bun install      # install dependencies
bun run dev      # start the Vite dev server (HMR)
bun run build    # type-check + production build to dist/
bun run preview  # serve the production build locally
bun test         # run the engine + game unit tests
bun run typecheck # type-check without building
```

## Adding a game

1. Copy `src/games/_template.ts` to `src/games/<your-game>.ts`.
2. Fill in the metadata, `zones` (regions on the table), and `steps`. Each step
   is `apply: (board) => board` built from `move` / `flip`; you describe what the
   table looks like at each step and the engine animates the rest.
3. Register it in `src/games/index.ts`:
   ```ts
   import { yourGame } from './your-game';
   export const games: Game[] = [war, yourGame];
   ```
4. It now appears on the home page and gets its own `/game/<id>` route.

Optionally add a `src/games/<your-game>.test.ts` (see `war.test.ts`) to assert
your steps reduce cleanly with no lost cards.

## How it works

See `CLAUDE.md` for the architecture (board/zone/step model, the
layout→transform→Motion animation pipeline, and the scroll-reveal driver).

## Tech

Bun · Vite · React 19 · TypeScript · Motion · Tailwind CSS v4 · React Router 7.
Card faces are inline Unicode/CSS — no image assets.

## Deploying

`bun run build` emits a static site to `dist/`. The app uses client-side
routing (`BrowserRouter`), so a static host must rewrite unknown paths back to
`index.html` (the usual SPA fallback) or a direct hit / refresh on
`/game/<id>` will 404. On Netlify/Vercel this is the default SPA setting; on a
plain file host, either configure the fallback or switch `BrowserRouter` to
`HashRouter` in `src/main.tsx`.
