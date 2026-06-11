export type Suit = "S" | "H" | "D" | "C";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
export type CardId = string; // `${Suit}-${Rank}`, e.g. "S-A"

export type LayoutKind = "pile" | "row" | "fan" | "single" | "grid";

export interface ZoneDef {
  id: string;
  anchor: { x: number; y: number }; // 0..1 fraction of table width/height
  layout: LayoutKind;
  rotate?: number; // degrees applied to every card in the zone (e.g. 180 for opponent)
  gap?: number; // spacing as fraction of table width (row/fan)
  label?: string; // optional caption rendered beside the zone
  labelPos?: "above" | "below" | "left" | "right"; // where the caption sits relative to the anchor (default 'below')
  labelColor?: string; // player colour: tints the zone label chip AND every mention of the label in narration
}

export interface Board {
  placement: Record<CardId, { zone: string; order: number }>;
  faceUp: Record<CardId, boolean>;
}

export interface CardTransform {
  x: number; // pixel position of card CENTRE within the table
  y: number;
  rotate: number;
  faceUp: boolean;
  z: number;
  highlight: boolean;
  dim: boolean;
  known: boolean; // face-down card the viewer has seen; shows a ghosted face on its back
  peek: boolean; // card lifted off the table this step, top half revealed (a private glance)
  delay: number; // seconds to delay this card's move (for staggered "fast-forward" plays)
  moveDelay?: number; // choreography override: when the travel should start (defaults to delay)
  flipDelay?: number; // choreography override: when the flip should start (defaults to delay)
}

export interface Step {
  id: string;
  title: string;
  narration: string;
  uselessNarration?: string;
  callout?: string; // optional tip/rule box
  apply: (board: Board) => Board;
  highlight?: CardId[]; // cards to emphasise this step
  spotlight?: string[]; // zone ids kept lit; all others dimmed
  status?: Record<string, string>; // zone id -> short status word (e.g. 'starts', 'pass', 'done')
  impact?: boolean; // shake the table on this step (a bomb / revolution landing)
  stagger?: string[]; // zone ids whose cards arrive one-by-one (fast-forward play feel)
  known?: CardId[]; // face-down cards the viewer has seen and should remember;
  // each renders a ghosted face on its back (memory-game x-ray)
  peek?: CardId[]; // cards privately glanced at this step: each lifts off the
  // table and shows the top half of its face, while staying face down on the board
  banner?: string; // short sign pinned top-centre of the felt while this step shows
}

export interface Game {
  id: string;
  title: string;
  blurb: string;
  players: string; // e.g. "2"
  playTime: string; // e.g. "10 min"
  difficulty: "Easy" | "Medium" | "Involved";
  accent?: string; // optional CSS colour for per-game theming
  origin?: string; // verbatim origin/history blurb (shown in a disclosure)
  zones: ZoneDef[];
  build: () => Board; // initial board (every card placed in some zone)
  steps: Step[];
  notes?: GameNote[]; // optional secondary "variations & fine print" section
}

export interface GameNote {
  heading: string;
  body: string;
}
