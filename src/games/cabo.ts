import type { Game, Board, CardId } from "./types";
import { standardDeck, placeAll, move, flip, swap, cardsInZone } from "./types";

// One full, scripted hand at a four-seat table. Seats are named by where they
// sit relative to you: Side shares your edge, Across faces you, Diagonal holds
// the far corner. Each square's slot order 0..3 reads top-left, top-right,
// bottom-left, bottom-right; your "nearest two" are slots 2 and 3.
const SQUARES: Record<string, CardId[]> = {
  "p-you": ["H-9", "D-K", "S-A", "C-10"], // you peek S-A and C-10; D-K is the sleeping zero
  "p-side": ["H-5", "C-K", "D-9", "S-6"], // Side misfires a knock and swells to five cards
  "p-diagonal": ["C-3", "S-4", "H-Q", "D-2"], // Diagonal peeks the 3 and 4, knocks with the 3, wins with a flurry of fours
  "p-across": ["C-9", "H-3", "S-8", "D-5"], // Across plays the queen, then purges its twos
};
const STARTER: CardId = "H-J";
const SEATS = ["p-you", "p-side", "p-diagonal", "p-across"];

// Stock draws, in script order: D-3, S-K, C-4, S-7, H-10, D-7, D-Q, D-10,
// C-5, C-A, H-2, H-6, S-J (a knock penalty), H-7, H-4, S-2. Cards are moved
// by id; the face-down pile makes the physical order invisible.

// Draw `incoming` straight off the stock into the exact slot of `outgoing`,
// sending the old card face up to the discard.
const replaceFromStock = (b: Board, incoming: CardId, outgoing: CardId) =>
  move(swap(b, incoming, outgoing), [outgoing], "discard", { faceUp: true });

// Each player's memory, turn by turn. The x-ray belongs to whoever is acting:
// a step ghosts the ACTING player's knowledge, nobody else's. Knowledge
// follows the card, wherever it sits.
const YOU_1: CardId[] = ["S-A", "C-10"]; // your opening peek
const YOU_2: CardId[] = [...YOU_1, "D-3"]; // you slotted the 3
const YOU_3: CardId[] = [...YOU_2, "D-K"]; // the lucky-seven peek
const YOU_4: CardId[] = [...YOU_3, "S-6"]; // you peeked the six Across lifted from Side
const YOU_5: CardId[] = ["S-A", "D-3", "D-K", "C-10"]; // the sixes spent; the ten you dumped lives on with Across
const YOU_6: CardId[] = [...YOU_5, "S-8"]; // Side's misfire showed the whole table the eight
const SIDE_1: CardId[] = ["D-9", "S-6"]; // Side's opening peek: their near row (they share your edge)
const SIDE_2: CardId[] = [...SIDE_1, "D-3"]; // they peeked your corner
const SIDE_3: CardId[] = ["D-3", "C-5"]; // the drawn 5 went in over the known 9; the blind-raided six slipped their tracking
const SIDE_4: CardId[] = ["D-3", "C-5"]; // the six is gone, but the reflex that knew it is not
const SIDE_5: CardId[] = [...SIDE_4, "S-8"]; // the misfired eight, seen by everyone as it bounced
const SIDE_6: CardId[] = [...SIDE_5, "C-K"]; // the too-late peek
const DIAG_2: CardId[] = ["C-3", "S-4", "C-4"]; // opening peek plus the drawn 4 they slotted
const DIAG_3: CardId[] = [...DIAG_2, "H-Q"]; // peeked their own last unknown
const DIAG_4: CardId[] = ["C-3", "S-4", "C-4", "C-A"]; // the drawn ace went in over the peeked queen
const DIAG_5: CardId[] = ["C-A", "S-8"]; // after the flurry one ace remains; the eight is public
const ACROSS_2: CardId[] = ["C-9", "H-3", "D-2"]; // opening peek (their near row, the top of their square from our view) plus the blind-slotted 2
const ACROSS_3: CardId[] = ["C-9", "D-2", "H-2"]; // the drawn 2 went in over the known 3
const ACROSS_4: CardId[] = [...ACROSS_3, "S-8"]; // plus the eight from Side's misfire

// The sign that hangs over the table from the Cabo call until the reveal.
const CABO_SIGN = "CABO! · last lap";

export const cabo: Game = {
  id: "cabo",
  title: "Cabo",
  blurb:
    "A memory duel around four face-down cards. Peek, swap and bluff your square down to nothing, then call Cabo before anyone gets wise.",
  players: "2–8",
  playTime: "15–30 min",
  difficulty: "Medium",
  accent: "#2f6f6a",
  origin: `Cabo is a supercharged take on four-card Golf, a family of games in which players try to finish with the lowest-scoring layout. A standard 52-card pack is used, and in theory anywhere from two to eight or more can play, though the game is said to be best for about four; with eight or more, two packs may be shuffled together. The deal and play are clockwise.

What sets the Cabo version apart are its power cards: 7, 8, 9, 10, jack and queen each carry an ability, remembered at the table with rhymes. Seven or eight, know your fate. Nine or ten, know a friend. Jack or queen, switch between.`,
  zones: [
    {
      id: "stock",
      anchor: { x: 0.4, y: 0.44 },
      layout: "pile",
      label: "Stock",
      labelPos: "below",
    },
    {
      id: "discard",
      anchor: { x: 0.6, y: 0.44 },
      layout: "pile",
      label: "Discard",
      labelPos: "below",
    },
    // No seat rotation: cards never spin in flight, and the memory ghosts
    // always read upright (a spun 6 looks like a 9).
    // Every seat wears a colour; narration paints the seat's name in it too.
    {
      id: "p-diagonal",
      anchor: { x: 0.14, y: 0.23 },
      layout: "grid",
      gap: 0.012,
      label: "Diagonal",
      labelPos: "right",
      labelColor: "var(--color-seat-red)",
    },
    {
      id: "p-across",
      anchor: { x: 0.86, y: 0.23 },
      layout: "grid",
      gap: 0.012,
      label: "Across",
      labelPos: "left",
      labelColor: "var(--color-seat-cyan)",
    },
    {
      id: "p-side",
      anchor: { x: 0.14, y: 0.77 },
      layout: "grid",
      gap: 0.012,
      label: "Side",
      labelPos: "right",
      labelColor: "var(--color-seat-green)",
    },
    {
      id: "p-you",
      anchor: { x: 0.86, y: 0.77 },
      layout: "grid",
      gap: 0.012,
      label: "You",
      labelPos: "left",
      labelColor: "var(--color-seat-yellow)",
    },
    {
      id: "drawn",
      anchor: { x: 0.6, y: 0.78 },
      layout: "single",
      label: "Drawn",
      labelPos: "below",
    },
  ],
  build: () => placeAll(standardDeck(), "stock", false),
  steps: [
    {
      id: "intro",
      title: "A game of memory",
      narration:
        "Cabo is a memory game: your four cards lie face down in a square in front of you, and you score what you cannot see. Lowest total wins. Every card costs points, ace low and courts dear, with one golden exception: the king of diamonds counts zero, the best card in the pack. We will play one full hand at a four-seat table. You sit bottom right; the player beside you is Side, the player facing you is Across, and the far corner is Diagonal.",
      callout:
        "Card values: ace 1, twos to tens face value, jack 11, queen 12, king 13. The king of diamonds alone counts 0.",
      apply: (b) => b,
      spotlight: ["stock"],
    },
    {
      id: "deal",
      title: "Four down, square and secret",
      narration:
        "Deal four cards to each player, one at a time, face down in a two-by-two square. Nobody looks yet, not even at their own. The rest of the pack sits in the middle as a face-down stock, and its top card is flipped beside it to start the discard pile.",
      apply: (b) => {
        let n = b;
        for (const seat of SEATS)
          n = move(n, SQUARES[seat], seat, { faceUp: false });
        return move(n, [STARTER], "discard", { faceUp: true });
      },
      stagger: SEATS,
      spotlight: [...SEATS, "discard"],
    },
    {
      id: "peek",
      title: "One look at your nearest two",
      narration:
        "Before play begins, everyone gets one private look at the two cards of their square nearest where they sit: the bottom row for you and Side, the top row for the far seats, Across and Diagonal. You find an ace of spades (a lovely 1) and a ten of clubs (ten points of dead weight). The other three are doing the same with their own squares; you see nothing of theirs.",
      apply: (b) => b,
      peek: ["S-A", "C-10"],
      highlight: ["S-A", "C-10"],
      spotlight: ["p-you"],
      known: YOU_1,
    },
    {
      id: "peek-back",
      title: "Down they go, and the game begins",
      narration:
        "Down they go, and they stay down: you may never look at them again. From here on, whoever is taking a turn gets their memory drawn on the table: every card the acting player has seen stays faintly visible, like the picture in their head.",
      uselessNarration:
        "Right now that is you and your two. Real players get no such help, which is exactly why Cabo bites: half the game is simply not forgetting.",
      callout:
        "Ghosted faces are the acting player’s memory, not the table: each turn shows what that player knows.",
      apply: (b) => b,
      spotlight: ["p-you"],
      known: YOU_1,
    },
    {
      id: "first-draw",
      title: "Your turn: three choices",
      narration:
        "On your turn there are only ever three choices: draw the top card of the stock, take the top card of the discard pile, or call Cabo to end the hand. You draw from the stock and get a three of diamonds. Now you decide: swap it into your square, or toss it on the pile.",
      callout:
        "On your turn: draw from the stock, take the top discard, or call Cabo.",
      apply: (b) => move(b, ["D-3"], "drawn", { faceUp: true }),
      highlight: ["D-3"],
      spotlight: ["stock", "drawn", "discard"],
      status: { "p-you": "starts" },
      known: YOU_1,
    },
    {
      id: "first-replace",
      title: "Trade blind, learn cheap",
      narration:
        "A three is cheap, so you keep it. Down it turns first, right where it sits, its ghost appearing the instant the face disappears; then it slides into the top-left corner, the one spot you never peeked. No, you may not look at what you are giving up: you pick the slot blind. Out comes whatever lived there, flipped onto the pile for all to see. A nine of hearts. A fine trade, and now you know three of your four cards.",
      apply: (b) => {
        let n = swap(b, "D-3", "H-9");
        n = flip(n, ["D-3"], false);
        return move(n, ["H-9"], "discard", { faceUp: true });
      },
      highlight: ["H-9"],
      spotlight: ["p-you", "discard"],
      known: YOU_2,
    },
    {
      id: "decline",
      title: "A stock draw can be refused",
      narration:
        "Side draws from the stock and grimaces: a king of spades, thirteen points of dead weight. A stock draw never has to be kept; you may discard it straight away, and Side does exactly that. Notice the ghosts on their square: it is Side’s turn, so you are seeing Side’s memory, the two cards they peeked at the start. And watch the pile as you play: every card that lands face up on it is free information.",
      apply: (b) => move(b, ["S-K"], "discard", { faceUp: true }),
      highlight: ["S-K"],
      spotlight: ["p-side", "discard"],
      status: { "p-side": "declines" },
      known: SIDE_1,
    },
    {
      id: "gamble",
      title: "Diagonal gambles and loses",
      narration:
        "Diagonal draws a four of clubs and gambles, sliding it face down into a corner they never peeked. Out spins... a two.",
      apply: (b) => replaceFromStock(b, "C-4", "D-2"),
      highlight: ["D-2"],
      spotlight: ["p-diagonal", "discard"],
      status: { "p-diagonal": "ouch" },
      known: DIAG_2,
    },
    {
      id: "obligation",
      title: "Take the discard, keep the discard",
      narration:
        "A two is a fine card, and Across pounces on it. Taking the top discard comes with a rule: you MUST swap it into your square. No peeking at a layout card first, no changing your mind and tossing it back. The two turns face down on the pile, keeping its ghost (the whole table watched it), then slides blind into the bottom-right corner of their square, a slot they never peeked. ",
      uselessNarration:
        "Out spins a five: the same gamble Diagonal just lost, except this one pays, two points in for five out.",
      callout:
        "Take the top discard and you must use it. Only a stock draw may be thrown straight back.",
      apply: (b) =>
        flip(flip(swap(b, "D-2", "D-5"), ["D-2"], false), ["D-5"], true),
      highlight: ["D-2", "D-5"],
      spotlight: ["p-across", "discard"],
      status: { "p-across": "must use it" },
      known: ACROSS_2,
    },
    {
      id: "lucky-seven",
      title: "Seven or eight, know your fate",
      narration:
        "Back to you. You draw a seven of spades, and sevens carry a power: discard it from the stock and you may peek at one of your OWN cards. Any of the four is fair game, but three of them you already know. The real prize is the top-right corner, the one card of your square you have never seen.",
      callout: "Seven or eight, know your fate: peek at one of your own cards.",
      apply: (b) => move(b, ["S-7"], "drawn", { faceUp: true }),
      highlight: ["D-3", "D-K", "S-A", "C-10"],
      spotlight: ["drawn", "p-you"],
      known: YOU_2,
    },
    {
      id: "king-peek",
      title: "Poker face",
      narration:
        "You lift your top-right mystery just far enough to see its corner and... the KING OF DIAMONDS. The only zero in the pack has been asleep in your square the whole time. Not a flicker crosses your face: the peek is private, and a good poker face keeps it that way. The seven goes to the pile. You've seen your whole square: a three, the zero king, an ace and an ugly ten. ",
      impact: true,
      apply: (b) => move(b, ["S-7"], "discard", { faceUp: true }),
      peek: ["D-K"],
      highlight: ["D-K"],
      spotlight: ["p-you", "discard"],
      known: YOU_3,
    },
    {
      id: "side-peeks-you",
      title: "Nine or ten, know your friend",
      narration:
        "Your king settles back flat as the turn passes. Side discards a ten from the stock, nine or ten, know a friend, and lifts the top-left card of YOUR square for a glance: the three you slotted on your first turn.",
      uselessNarration:
        "You only see them look. But their ghosts tell the truth: your corner is part of Side’s memory now.",
      apply: (b) => move(b, ["H-10"], "discard", { faceUp: true }),
      peek: ["D-3"],
      spotlight: ["p-side", "p-you", "discard"],
      status: { "p-side": "peeks you" },
      known: SIDE_2,
    },
    {
      id: "diagonal-peeks",
      title: "Diagonal completes the picture",
      narration:
        "Diagonal burns a seven to check the one card of their own square they have never seen, the queen in their bottom row.",
      uselessNarration:
        "That makes all four of their cards known to them: a square with no surprises left in it, and a memory worth fearing.",
      apply: (b) => move(b, ["D-7"], "discard", { faceUp: true }),
      peek: ["H-Q"],
      spotlight: ["p-diagonal", "discard"],
      status: { "p-diagonal": "peeks" },
      known: DIAG_3,
    },
    {
      id: "switcheroo",
      title: "Jack or Queen, switch between",
      narration:
        "Across draws a queen of diamonds and grins. Discard a jack or queen from the stock and you may trade the places of ANY two cards on the table, no looking allowed. Across swaps their last unknown for Side’s bottom-right card, gambling that whatever Side peeked and kept is worth more than a mystery. The cards cross the table face down: everyone sees WHICH slots traded, but no faces. Remember this swap. Side would do well to.",
      uselessNarration:
        "A truly blind trade: even Across’s own ghosts show nothing of what they gave away or got back.",
      callout:
        "Jack or Queen, switch between: blindly trade the places of any two layout cards on the table.",
      impact: true,
      apply: (b) =>
        move(swap(b, "S-8", "S-6"), ["D-Q"], "discard", { faceUp: true }),
      highlight: ["S-8", "S-6"],
      spotlight: ["p-across", "p-side"],
      status: { "p-across": "swaps!" },
      known: ACROSS_2,
    },
    {
      id: "know-a-friend",
      title: "Nine or ten, know a friend",
      narration:
        "Back on your turn. Now you draw a ten of diamonds. Nine or ten, know a friend: reveal it onto the discard pile, then you can peek at one card in an opponent’s square. You choose the card Across just lifted out of Side’s corner, the one prize of that blind trade nobody has actually seen. It is a six of spades. File it away; knowing where a six lives is about to pay off.",
      uselessNarration:
        "You watched the slots trade in the switcheroo, so you knew exactly which card to follow. Now you know its face too.",
      callout:
        "Nine or ten, know a friend: peek at one of an opponent's cards.",
      apply: (b) => move(b, ["D-10"], "drawn", { faceUp: true }),
      peek: ["S-6"],
      highlight: ["S-6"],
      spotlight: ["drawn", "p-across"],
      known: YOU_4,
    },
    {
      id: "file-it-away",
      title: "Slide it back, give nothing away",
      narration:
        "The six settles back flat, but it stays in your memory, ghosted in Across’s square. The ten has done its work and hits the pile. Your turn ends with you quietly richer: all four of your own corners known, plus a six tracked from Side’s square into Across’s. The question hanging over the table is whether Side has tracked it too.",
      apply: (b) => move(b, ["D-10"], "discard", { faceUp: true }),
      spotlight: ["p-you", "p-across", "discard"],
      known: YOU_4,
    },
    {
      id: "side-trades",
      title: "Side trades up",
      narration:
        "Side draws a five and slides it in over the nine they have known since the deal: four points saved, no gamble at all. But look at their ghosts: the six they peeked at the deal no longer glows anywhere. Side watched the switcheroo land in their corner, then lost the thread of it somewhere in the turns since. The slot feels like theirs; the card in it is a stranger.",
      uselessNarration:
        "Their memory grows with every turn, and it now reaches into your square too.",
      apply: (b) => replaceFromStock(b, "C-5", "D-9"),
      highlight: ["D-9"],
      spotlight: ["p-side", "discard"],
      status: { "p-side": "plays" },
      known: SIDE_3,
    },
    {
      id: "queen-out",
      title: "Diagonal plays it straight",
      narration:
        "Diagonal draws an ace of clubs, the best card in the pack short of the zero king, and the seven they burned earlier pays off: they KNOW the queen is the rot in their square. The ace slides in over it, twelve points become one, and the queen spins face up onto the pile.",
      uselessNarration:
        "No power, no gamble, just a known high card traded for a known low one. The boring play, and the strongest.",
      apply: (b) => replaceFromStock(b, "C-A", "H-Q"),
      highlight: ["H-Q"],
      spotlight: ["p-diagonal", "discard"],
      status: { "p-diagonal": "plays" },
      known: DIAG_4,
    },
    {
      id: "the-invitation",
      title: "A three spins face up",
      narration:
        "Across swaps the two of hearts they just drew into their square, and the old three of hearts spins face up onto the pile. For one heartbeat it just sits there. A face-up card is an invitation: anyone who knows where a matching card lies face down, in ANY square on the table, may knock, slapping that card and flipping it face up right where it lies. Three players at this table know where a three lives. One of them is you.",
      apply: (b) => replaceFromStock(b, "H-2", "H-3"),
      highlight: ["H-3"],
      spotlight: ["p-across", "discard"],
      status: { "p-across": "plays" },
      known: ACROSS_3,
    },
    {
      id: "knock",
      title: "SLAP: beaten to the knock",
      narration:
        "SLAP. Diagonal’s hand cracks down on their own square, out of turn, and flips their three of clubs face up where it lies. The move is called a knock. You knew your own three matched, you have been carrying it since your first turn, but Diagonal has known theirs since the opening peek and their hand was faster. Only one knock can claim a card, and it claimed theirs. Coming second costs you nothing, but it pays nothing either; your three stays right where it is.",
      callout:
        "The knock: when a card lands face up on the pile, race to flip its match wherever it lies face down. Only the first flip can win: the quickest correct knock sends the card to the pile, a slower hand gets nothing at all, and a wrong card costs a penalty.",
      impact: true,
      apply: (b) => flip(b, ["C-3"], true),
      highlight: ["H-3", "C-3"],
      spotlight: ["p-diagonal", "discard"],
      status: { "p-diagonal": "knocks!" },
      known: DIAG_4,
    },
    {
      id: "six-sense",
      title: "A six, and you know where its twin lives",
      narration:
        "Diagonal’s three slides onto the pile to seal the knock, and their square is down to three cards. Then your turn, and the stock hands you a six of hearts. An ordinary card, except you know exactly where another six lives: face down in Across’s square, right where you tracked it after the blind trade. Toss the six on the pile and it becomes an invitation, one you intend to answer yourself.",
      apply: (b) =>
        move(move(b, ["C-3"], "discard", { faceUp: true }), ["H-6"], "drawn", {
          faceUp: true,
        }),
      highlight: ["H-6"],
      spotlight: ["drawn", "p-across"],
      known: YOU_4,
    },
    {
      id: "the-race",
      title: "Two hands dive at once",
      narration:
        "Your six hits the pile, and TWO hands dive for a knock at the same instant. Yours arcs toward Across’s square. Side’s stabs at their own bottom-right corner, where their six has lived since the opening peek. Side’s hand is closer, and Side is first: SLAP, their corner card flips face up. It is an eight of spades. That corner was raided turns ago: Across’s blind switcheroo carried the six away face down, and Side never clocked it. Winning the race means nothing if the card is wrong.",
      uselessNarration:
        "Side’s memory was right; it was just one blind swap out of date.",
      impact: true,
      apply: (b) =>
        flip(move(b, ["H-6"], "discard", { faceUp: true }), ["S-8"], true),
      highlight: ["H-6", "S-8"],
      spotlight: ["p-side", "p-across", "discard"],
      status: { "p-side": "first... and wrong!", "p-you": "knock!" },
      known: SIDE_4,
    },
    {
      id: "penalty",
      title: "The price of a wrong knock",
      narration:
        "A wrong knock is not free. The eight flips back down right where it lay, though every player at the table has now seen it. Then the sting: Side must draw a penalty card from the stock and slide it into their square without looking. Four cards become five. The square you spend the whole game trying to shrink can be forced to grow.",
      callout:
        "Knock wrong and the card flips back down where it lies: you draw one penalty card face down into your square for each miss.",
      apply: (b) =>
        move(flip(b, ["S-8"], false), ["S-J"], "p-side", { faceUp: false }),
      highlight: ["S-J"],
      spotlight: ["p-side", "stock"],
      stagger: ["p-side"],
      status: { "p-side": "five cards" },
      known: SIDE_5,
    },
    {
      id: "your-knock",
      title: "Your knock: strike with what you know",
      narration:
        "A wrong knock does not close the window: your six is still face up on the pile, still an invitation. Your hand finishes its dive and flips the corner of Across’s square. The six of spades, exactly where you tracked it. Second to arrive, but the first to be RIGHT, and only a correct knock can claim the card.",
      impact: true,
      apply: (b) => flip(b, ["S-6"], true),
      highlight: ["S-6", "H-6"],
      spotlight: ["p-you", "p-across", "discard"],
      status: { "p-you": "knock!" },
      known: YOU_4,
    },
    {
      id: "knock-price",
      title: "The claim, and the price",
      narration:
        "The six slides onto the pile and Across’s square is a card short. Knocking a card out of an opponent’s square has a price, though: you must refill their empty slot from YOUR square, face down. You hand over the ten of clubs, ten points of dead weight you have been stuck with since the deal, and your square drops to three cards, every one of them known and worth almost nothing.",
      callout:
        "Knock a card out of an opponent’s square and their empty slot is refilled blind from your own: the knock costs you a card.",
      apply: (b) => {
        let n = swap(b, "S-6", "C-10");
        return move(n, ["S-6"], "discard", { faceUp: true });
      },
      highlight: ["S-6", "C-10"],
      spotlight: ["p-you", "p-across", "discard"],
      status: { "p-you": "pays one" },
      known: YOU_5,
    },
    {
      id: "cabo",
      title: "You call CABO",
      narration:
        "Look at your square: a three, the zero king and an ace. Four points. You will not do better, so on your turn you simply say the word: CABO. No draw, nothing else. Every other player now gets exactly one more turn, and then the hand is scored. The call is a real bet, though: if anyone finishes lower than you, your hand scores a flat 21 points, no matter how low it lies. And calling it ends the game, but it does not freeze it.",
      callout:
        "Cabo means last lap: each other player gets exactly one more turn. A failed call, anyone finishing lower than the caller, costs the caller a flat 21 points.",
      impact: true,
      apply: (b) => b,
      spotlight: ["p-you"],
      status: { "p-you": "CABO!" },
      known: YOU_6,
      banner: CABO_SIGN,
    },
    {
      id: "side-too-late",
      title: "Side learns the worst, too late",
      narration:
        "The last lap begins. Side, now five cards deep, draws a seven and burns it on a peek at one of their own cards. The news is grim: the club king, thirteen points, asleep in their square since the deal. And the peek itself was a wasted move, because on the last lap there is no future turn in which to use what you learn.",
      apply: (b) => move(b, ["H-7"], "discard", { faceUp: true }),
      peek: ["C-K"],
      spotlight: ["p-side", "discard"],
      status: { "p-side": "gulp" },
      known: SIDE_6,
      banner: CABO_SIGN,
    },
    {
      id: "flurry-of-fours",
      title: "A flurry of fours",
      narration:
        "Diagonal draws a four of hearts and does not blink: they are holding two more fours, both known by heart since the early turns. A stock draw can always be tossed straight back, so the four hits the pile face up as bait, and SLAP, SLAP, Diagonal flips both of their own fours face up where they lie. Knocking your own cards needs no refill, so the square is about to shrink to one lonely ace. Diagonal’s hand will be worth a single point, and your four-point call is beaten.",
      callout:
        "Calling Cabo starts the last lap. It does not freeze the table: knocks and powers still fire.",
      impact: true,
      apply: (b) =>
        flip(
          move(b, ["H-4"], "discard", { faceUp: true }),
          ["S-4", "C-4"],
          true,
        ),
      highlight: ["H-4", "S-4", "C-4"],
      spotlight: ["p-diagonal", "discard"],
      status: { "p-diagonal": "flurry!" },
      known: DIAG_5,
      banner: CABO_SIGN,
    },
    {
      id: "last-match",
      title: "Across purges its twos",
      narration:
        "Diagonal’s fours slide off to the pile, and Across takes the final turn of the hand. They draw a two of spades and know exactly where its twins live: the two they took off the pile and the two they slotted in themselves. The drawn two hits the pile and SLAP, SLAP, a double knock of their own, both twos flipped face up where they lie. The square is about to shrink from four cards to two: twenty-three points down to nineteen. Too late to catch Diagonal, but the instinct is exactly right.",
      callout:
        "Knock your own matches away and no refill is owed: a square can shrink right up to the last turn of the hand.",
      impact: true,
      apply: (b) => {
        let n = move(b, ["S-4"], "discard", { faceUp: true });
        n = move(n, ["C-4"], "discard", { faceUp: true });
        n = move(n, ["S-2"], "discard", { faceUp: true });
        return flip(n, ["D-2", "H-2"], true);
      },
      highlight: ["D-2", "H-2", "S-2"],
      spotlight: ["p-across", "discard"],
      status: { "p-across": "double knock!" },
      known: ACROSS_4,
      banner: CABO_SIGN,
    },
    {
      id: "reveal",
      title: "Cabo! Every square turns up",
      narration:
        "Across’s twos join the pile, every square turns face up, and the counting starts. Your king of diamonds scores its zero and your cards total four points, a hand that wins most nights. Not this one. Diagonal’s flurry left a single ace on the felt: one point, and the hand is theirs. Which makes your Cabo a FAILED call, and a failed call has a fixed price: you score a flat 21, your lovely four torn up. Across’s late purge lands on 19, not helped by the ten you dumped on them. And Side’s disaster is complete: the club king, the eight they misfired, and a penalty card that turns out to be a jack pile up to a punishing 42. Every one of those totals is written down and carried into the next round.",
      callout:
        "Totals: Diagonal 1 · You 21 (failed Cabo) · Across 19 · Side 42. A beaten caller scores a flat 21, and all totals carry into the next round.",
      impact: true,
      apply: (b) => {
        let n = move(b, ["D-2"], "discard", { faceUp: true });
        n = move(n, ["H-2"], "discard", { faceUp: true });
        return SEATS.reduce(
          (acc, z) => flip(acc, cardsInZone(acc, z), true),
          n,
        );
      },
      spotlight: SEATS,
      status: {
        "p-diagonal": "wins on 1",
        "p-you": "21!",
        "p-across": "19",
        "p-side": "42",
      },
    },
    {
      id: "recap",
      title: "Remember everything, trust nothing",
      narration:
        "That is Cabo: peek once, remember everything, knock the instant you see a match, and spend the powers well. Seven or eight, know your fate. Nine or ten, know a friend. Jack or queen, switch between. Calling Cabo is always a bet that one lap is not enough time to catch you, and you have just watched that bet fail: one flurry of knocks turned a four-point hand into a flat 21, carried straight into the next round. And knock with your eyes open: a memory one blind swap stale flips the wrong card, and the penalty swells your square right back. The only assured way to win is to end the game yourself: knock away all four of your cards, and the play stops on the spot with your score an untouchable zero.",
      callout:
        "Seven or eight, know your fate · Nine or ten, know a friend · Jack or Queen, switch between.",
      apply: (b) => b,
    },
  ],
  notes: [
    {
      heading: "Plain four-card Golf",
      body: "Cabo is the spiced-up member of the Golf family. In the plain game there are no powers, no knocking and no special king of diamonds: numeral cards score face value, jacks and queens 10, every king 0, and the hand ends when a player raps the table instead of calling Cabo. Same square, same memory, far fewer knives.",
    },
    {
      heading: "A bigger table",
      body: "In theory any number from two to eight or more can play, though the game is said to be best for about four. With eight or more players, shuffle two packs together.",
    },
    {
      heading: "The failed knock",
      body: "Knock wrong and the card simply flips back down where it lies. As a penalty you draw a card from the stock and add it face down to your square, without looking, for each miss. Every extra card is pure liability, so knock sparingly.",
    },
    {
      heading: "The failed Cabo, and the long game",
      body: "A Cabo call is a bet. If every other player finishes higher, the caller scores their cards as normal; if anyone finishes lower, the caller scores a flat 21 points instead, however low their square really was. Totals are written down at the end of every hand and carried into the next round, with the game played to an agreed ceiling, commonly 100. One bad call can shadow you for the whole game.",
    },
    {
      heading: "The knock",
      body: "A knock answers any card that lands face up on the pile: race to flip its match wherever it lies face down, then slide it onto the pile. Traditionally the race was to be first to knock on the table, and the name stuck. The written rules are stricter: only the player whose turn it is may match, and only with the card they just drew. Agree before you start how your table knocks.",
    },
    {
      heading: "Two ways it ends",
      body: "A Cabo call ends the hand after each other player gets one more turn. Play also ends immediately if a player empties their square entirely (winning).",
    },
  ],
};
