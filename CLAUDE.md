# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # install dependencies
bun run dev        # Vite dev server with HMR
bun run build      # tsc -b && vite build  →  dist/
bun run preview    # serve the production build
bun test           # run all unit tests (Bun test runner)
bun test src/engine/board.test.ts   # run a single test file
bun run typecheck  # type-check only (tsc -b --noEmit)
```

## Architecture

This is a static, data-driven rulebook. The whole app is a thin React shell
around a **framework-free engine**; each card game is **pure data** that the
engine interprets and animates. Adding a game must never require touching engine
or component code.

### The engine (`src/engine/`, React-free except the `.tsx` files)

- **`types.ts`** — the contracts. A `Game` has metadata, `zones` (named regions
  on the table), a `build()` that returns the initial `Board`, and an ordered
  list of `steps`. A `Board` is `{ placement: Record<CardId,{zone,order}>,
  faceUp: Record<CardId,boolean> }`. A `Step` carries narration plus
  `apply: (Board) => Board`.
- **`deck.ts`** — card identity. A `CardId` is the string `"<Suit>-<Rank>"`
  (e.g. `"S-A"`). `standardDeck()`, `parseCard()`, `RANK_VALUE`, `isRed()`.
- **`board.ts`** — immutable board actions: `placeAll`, `cardsInZone`, `topOf`,
  `move`, `flip`. Every action returns a NEW board. `move` appends to the END of
  a zone and assumes cards come from a *different* zone (no intra-zone reorder).
- **`runGame.ts`** — reduces a game's steps into `Snapshot[]` (one board state
  per step), cumulatively applying each `step.apply`.
- **`layout.ts`** — `tableDims(width)` derives table height + card size from a
  measured width; `computeTransforms(board, zones, dims)` turns a board snapshot
  into per-card pixel transforms (position from zone `anchor` + `layout` kind:
  `pile` | `row` | `fan`), and resolves `highlight`/`spotlight` flags.

### The render pipeline

`runGame(game)` → `Snapshot[]`. The active snapshot flows into
`CardTable.tsx`, which measures its width (`ResizeObserver`), calls
`computeTransforms`, and renders one `Card.tsx` per placed card. **Cards are
keyed by `CardId`** — that stable key is what lets Motion spring each card from
its previous transform to the next when the snapshot changes. `Card.tsx` does a
3D `rotateY` flip driven by `faceUp`. The felt, card faces, and flip are styled
in `src/index.css` (`.table-felt`, `.card-*`, theme tokens under `@theme`).

### Scroll-reveal navigation

`GamePage.tsx` lays out a sticky `CardTable` beside a column of step panels.
`useActiveStep.ts` runs an `IntersectionObserver` (centred root margin) over the
panels; whichever panel is in the middle of the viewport becomes the active
step, which selects the snapshot the table renders. Scrolling thus plays the
hand forward.

### Adding a game (the extensibility path)

Copy `src/games/_template.ts`, author `zones` + `steps`, then add it to the
array in `src/games/index.ts`. The home grid and `/game/:id` route pick it up
automatically. `src/games/types.ts` is the author-facing barrel (re-exports the
`Game` type and the board helpers). `_template.ts` must never be imported by the
registry — it is a copy-me reference only. See `src/games/war.ts` for the worked
example and `src/games/war.test.ts` for the pattern of asserting steps reduce
cleanly (no lost cards).

## Conventions

- Keep `deck/board/runGame/layout` free of React imports so games stay testable
  pure data.
- Never key cards by array index — always by `CardId`, or animations break.
- Card positions are computed, not authored: a step says *where cards are*
  (which zone), and `layout.ts` decides pixels. Add a new `LayoutKind` rather
  than hard-coding coordinates in a game.
