export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank =
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardId = string; // `${Suit}-${Rank}`, e.g. "S-A"

export type LayoutKind = 'pile' | 'row' | 'fan' | 'single';

export interface ZoneDef {
  id: string;
  anchor: { x: number; y: number }; // 0..1 fraction of table width/height
  layout: LayoutKind;
  rotate?: number;   // degrees applied to every card in the zone (e.g. 180 for opponent)
  gap?: number;      // spacing as fraction of table width (row/fan)
  label?: string;    // optional caption under the zone
}

export interface Board {
  placement: Record<CardId, { zone: string; order: number }>;
  faceUp: Record<CardId, boolean>;
}

export interface CardTransform {
  x: number;        // pixel position of card CENTRE within the table
  y: number;
  rotate: number;
  faceUp: boolean;
  z: number;
  highlight: boolean;
  dim: boolean;
}

export interface Step {
  id: string;
  title: string;
  narration: string;
  callout?: string;        // optional tip/rule box
  apply: (board: Board) => Board;
  highlight?: CardId[];    // cards to emphasise this step
  spotlight?: string[];    // zone ids kept lit; all others dimmed
}

export interface Game {
  id: string;
  title: string;
  blurb: string;
  players: string;     // e.g. "2"
  playTime: string;    // e.g. "10 min"
  difficulty: 'Easy' | 'Medium' | 'Involved';
  accent?: string;     // optional CSS colour for per-game theming
  zones: ZoneDef[];
  build: () => Board;  // initial board (every card placed in some zone)
  steps: Step[];
}
