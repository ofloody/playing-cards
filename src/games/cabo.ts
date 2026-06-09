import type { Game, Board, CardId } from './types';
import { standardDeck, placeAll, move, flip, swap, cardsInZone } from './types';

// One full, scripted hand at a four-seat table. Seats are named by where they
// sit relative to you: Side shares your edge, Across faces you, Diagonal holds
// the far corner. Each square's slot order 0..3 reads top-left, top-right,
// bottom-left, bottom-right; your "nearest two" are slots 2 and 3.
const SQUARES: Record<string, CardId[]> = {
  'p-you':      ['H-9', 'D-K', 'S-A', 'C-6'], // you peek S-A and C-6; D-K is the sleeping zero
  'p-side':     ['H-5', 'C-K', 'D-9', 'S-6'], // Side never finds its club king in time
  'p-diagonal': ['C-3', 'S-4', 'H-Q', 'D-2'], // Diagonal peeks the 3 and 4, and knocks with the 3
  'p-across':   ['C-9', 'H-3', 'S-8', 'D-5'], // Across plays the queen, then purges its twos
};
const STARTER: CardId = 'H-J';
const SEATS = ['p-you', 'p-side', 'p-diagonal', 'p-across'];

// Stock draws, in script order: D-3, S-K, C-4, S-7, H-10, D-7, D-Q, D-10,
// C-5, S-10, H-2, H-6, H-7, C-A, S-2. Cards are moved by id; the face-down
// pile makes the physical order invisible.

// Draw `incoming` straight off the stock into the exact slot of `outgoing`,
// sending the old card face up to the discard.
const replaceFromStock = (b: Board, incoming: CardId, outgoing: CardId) =>
  move(swap(b, incoming, outgoing), [outgoing], 'discard', { faceUp: true });

// Each player's memory, turn by turn. The x-ray belongs to whoever is acting:
// a step ghosts the ACTING player's knowledge, nobody else's. Knowledge
// follows the card, wherever it sits.
const YOU_1: CardId[] = ['S-A', 'C-6'];               // your opening peek
const YOU_2: CardId[] = [...YOU_1, 'D-3'];            // you slotted the 3
const YOU_3: CardId[] = [...YOU_2, 'D-K'];            // the lucky-seven peek
const YOU_4: CardId[] = [...YOU_3, 'S-6'];            // you peeked Side's six
const YOU_5: CardId[] = ['S-A', 'D-3', 'D-K', 'C-6']; // sixes spent; your lost six lives on with Across
const SIDE_1: CardId[] = ['H-5', 'D-9'];              // Side's opening peek
const SIDE_2: CardId[] = [...SIDE_1, 'D-3'];          // they peeked your corner
const SIDE_3: CardId[] = ['H-5', 'D-3', 'C-5'];       // the drawn 5 went in over the known 9
const SIDE_4: CardId[] = [...SIDE_3, 'C-K'];          // the too-late peek
const DIAG_2: CardId[] = ['C-3', 'S-4', 'C-4'];       // opening peek plus the drawn 4 they slotted
const DIAG_3: CardId[] = [...DIAG_2, 'H-Q'];          // peeked their own last unknown
const DIAG_4: CardId[] = [...DIAG_3, 'C-9'];          // peeked a corner of Across's square
const DIAG_5: CardId[] = ['C-A', 'C-4', 'H-Q', 'C-9']; // ace in over the four, the 3 knocked away
const ACROSS_2: CardId[] = ['H-3', 'D-2'];            // opening peek; the known 5 went out for the public 2
const ACROSS_3: CardId[] = ['D-2', 'H-2'];            // the drawn 2 went in over the 3

// The sign that hangs over the table from the Cabo call until the reveal.
const CABO_SIGN = 'CABO! · last lap';

export const cabo: Game = {
  id: 'cabo',
  title: 'Cabo',
  blurb: 'A memory duel around four face-down cards. Peek, swap and bluff your square down to nothing, then call Cabo before anyone gets wise.',
  players: '2–8',
  playTime: '15–30 min',
  difficulty: 'Medium',
  accent: '#2f6f6a',
  origin: `Cabo is a supercharged take on four-card Golf, a family of games in which players try to finish with the lowest-scoring layout. A standard 52-card pack is used, and in theory anywhere from two to eight or more can play, though the game is said to be best for about four; with eight or more, two packs may be shuffled together. The deal and play are clockwise.

What sets the Cabo version apart are its power cards: 7, 8, 9, 10, jack and queen each carry an ability, remembered at the table with rhymes. Seven or eight, know your fate. Nine or ten, know a friend. Jack or queen, switch between.`,
  zones: [
    { id: 'stock',      anchor: { x: 0.40, y: 0.44 }, layout: 'pile', label: 'Stock',   labelPos: 'below' },
    { id: 'discard',    anchor: { x: 0.60, y: 0.44 }, layout: 'pile', label: 'Discard', labelPos: 'below' },
    // No seat rotation: cards never spin in flight, and the memory ghosts
    // always read upright (a spun 6 looks like a 9).
    { id: 'p-diagonal', anchor: { x: 0.14, y: 0.23 }, layout: 'grid', gap: 0.012, label: 'Diagonal', labelPos: 'right' },
    { id: 'p-across',   anchor: { x: 0.86, y: 0.23 }, layout: 'grid', gap: 0.012, label: 'Across', labelPos: 'left' },
    { id: 'p-side',     anchor: { x: 0.14, y: 0.77 }, layout: 'grid', gap: 0.012, label: 'Side', labelPos: 'right' },
    { id: 'p-you',      anchor: { x: 0.86, y: 0.77 }, layout: 'grid', gap: 0.012, label: 'You', labelPos: 'left' },
    { id: 'drawn',      anchor: { x: 0.60, y: 0.78 }, layout: 'single', label: 'Drawn', labelPos: 'below' },
  ],
  build: () => placeAll(standardDeck(), 'stock', false),
  steps: [
    {
      id: 'intro',
      title: 'A game of memory',
      narration:
        'Cabo is a memory game: your four cards lie face down in a square in front of you, and you score what you cannot see. Lowest total wins. Every card costs points, ace low and courts dear, with one golden exception: the king of diamonds counts zero, the best card in the pack. We will play one full hand at a four-seat table. You sit bottom right; the player beside you is Side, the player facing you is Across, and the far corner is Diagonal.',
      callout: 'Card values: ace 1, twos to tens face value, jack 11, queen 12, king 13. The king of diamonds alone counts 0.',
      apply: (b) => b,
      spotlight: ['stock'],
    },
    {
      id: 'deal',
      title: 'Four down, square and secret',
      narration:
        'Deal four cards to each player, one at a time, face down in a two-by-two square. Nobody looks yet, not even at their own. The rest of the pack sits in the middle as a face-down stock, and its top card is flipped beside it to start the discard pile.',
      apply: (b) => {
        let n = b;
        for (const seat of SEATS) n = move(n, SQUARES[seat], seat, { faceUp: false });
        return move(n, [STARTER], 'discard', { faceUp: true });
      },
      stagger: SEATS,
      spotlight: [...SEATS, 'discard'],
    },
    {
      id: 'peek',
      title: 'One look at your nearest two',
      narration:
        'Before play begins, everyone gets one private look at the two cards nearest them, the bottom row of their square. You find an ace of spades (a lovely 1) and a six of clubs (so-so). The other three are doing the same with their own squares; you see nothing of theirs.',
      apply: (b) => flip(b, ['S-A', 'C-6'], true),
      highlight: ['S-A', 'C-6'],
      spotlight: ['p-you'],
      known: YOU_1,
    },
    {
      id: 'peek-back',
      title: 'Down they go, and the game begins',
      narration:
        'Down they go, and they stay down: you may never look at them again. From here on, whoever is taking a turn gets their memory drawn on the table: every card the acting player has seen stays faintly visible, like the picture in their head. Right now that is you and your two. Real players get no such help, which is exactly why Cabo bites: half the game is simply not forgetting.',
      callout: 'Ghosted faces are the acting player’s memory, not the table: each turn shows what that player knows.',
      apply: (b) => flip(b, ['S-A', 'C-6'], false),
      spotlight: ['p-you'],
      known: YOU_1,
    },
    {
      id: 'first-draw',
      title: 'Your turn: three choices',
      narration:
        'On your turn there are only ever three choices: draw the top card of the stock, take the top card of the discard pile, or call Cabo to end the hand. You draw from the stock and get a three of diamonds. Now you decide: swap it into your square, or toss it on the pile.',
      callout: 'On your turn: draw from the stock, take the top discard, or call Cabo.',
      apply: (b) => move(b, ['D-3'], 'drawn', { faceUp: true }),
      highlight: ['D-3'],
      spotlight: ['stock', 'drawn', 'discard'],
      status: { 'p-you': 'starts' },
      known: YOU_1,
    },
    {
      id: 'first-replace',
      title: 'Trade blind, learn cheap',
      narration:
        'A three is cheap, so you keep it. It slides face down into the top-left corner, the one spot you never peeked, and no, you may not look first: you pick the slot blind. Out comes whatever lived there, flipped onto the pile for all to see. A nine of hearts. A fine trade, and now you know three of your four cards.',
      apply: (b) => {
        let n = swap(b, 'D-3', 'H-9');
        n = flip(n, ['D-3'], false);
        return move(n, ['H-9'], 'discard', { faceUp: true });
      },
      highlight: ['H-9'],
      spotlight: ['p-you', 'discard'],
      known: YOU_2,
    },
    {
      id: 'decline',
      title: 'A stock draw can be refused',
      narration:
        'Side draws from the stock and grimaces: a king of spades, thirteen points of dead weight. A stock draw never has to be kept; you may discard it straight away, and Side does exactly that. Notice the ghosts on their square: it is Side’s turn, so you are seeing SIDE’s memory, the two cards they peeked at the start. And watch the pile as you play: every card that lands face up on it is free information.',
      apply: (b) => move(b, ['S-K'], 'discard', { faceUp: true }),
      highlight: ['S-K'],
      spotlight: ['p-side', 'discard'],
      status: { 'p-side': 'declines' },
      known: SIDE_1,
    },
    {
      id: 'gamble',
      title: 'Diagonal gambles and loses',
      narration:
        'Diagonal draws a four of clubs and gambles, sliding it face down into a corner they never peeked. Out spins... a two. The table winces. That is the wager at the heart of Cabo: every unseen card might be treasure or trash, and Diagonal just paid two points to find out.',
      apply: (b) => replaceFromStock(b, 'C-4', 'D-2'),
      highlight: ['D-2'],
      spotlight: ['p-diagonal', 'discard'],
      status: { 'p-diagonal': 'ouch' },
      known: DIAG_2,
    },
    {
      id: 'obligation',
      title: 'Take the discard, keep the discard',
      narration:
        'A two is a fine card, and Across pounces on it. Taking the top discard comes with a rule: you MUST swap it into your square. No peeking at a layout card first, no changing your mind and tossing it back. Across slides it in over the five they peeked at the start, a trade with no mystery on their side, and the whole table watched that two come off the pile.',
      callout: 'Take the top discard and you must use it. Only a stock draw may be thrown straight back.',
      apply: (b) => flip(flip(swap(b, 'D-2', 'D-5'), ['D-2'], false), ['D-5'], true),
      highlight: ['D-2', 'D-5'],
      spotlight: ['p-across', 'discard'],
      status: { 'p-across': 'must use it' },
      known: ACROSS_2,
    },
    {
      id: 'lucky-seven',
      title: 'Seven or eight, know your fate',
      narration:
        'Back to you. You draw a seven of spades, and sevens carry a power: discard it from the stock and you may peek at one of your OWN cards. You check your top-right mystery and... the KING OF DIAMONDS. The only zero in the pack has been asleep in your square the whole time.',
      callout: 'Seven or eight, know your fate: peek at one of your own cards.',
      impact: true,
      apply: (b) => flip(move(b, ['S-7'], 'drawn', { faceUp: true }), ['D-K'], true),
      highlight: ['D-K'],
      spotlight: ['drawn', 'p-you'],
      known: YOU_3,
    },
    {
      id: 'tuck-back',
      title: 'Poker face',
      narration:
        'You tuck the king back down without a flicker; the peek is private, and a good poker face keeps it that way. The seven goes to the pile, its work done. Take stock of your square: a three, the zero king, an ace and a six. Ten points, and you know every card in it.',
      apply: (b) => move(flip(b, ['D-K'], false), ['S-7'], 'discard', { faceUp: true }),
      spotlight: ['p-you', 'discard'],
      known: YOU_3,
    },
    {
      id: 'side-peeks-you',
      title: 'Nine or ten, used against you',
      narration:
        'Side discards a ten from the stock, nine or ten, know a friend, and peeks the top-left card of YOUR square: the three you slotted on your first turn. You only see them look. But their ghosts tell the truth: your corner is part of Side’s memory now.',
      apply: (b) => move(b, ['H-10'], 'discard', { faceUp: true }),
      spotlight: ['p-side', 'p-you', 'discard'],
      status: { 'p-side': 'peeks you' },
      known: SIDE_2,
    },
    {
      id: 'diagonal-peeks',
      title: 'Diagonal completes the picture',
      narration:
        'Diagonal burns a seven to check the one card of their own square they have never seen, the queen in their bottom row. That makes all four of their cards known to them: a square with no surprises left in it, and a memory worth fearing.',
      apply: (b) => move(b, ['D-7'], 'discard', { faceUp: true }),
      spotlight: ['p-diagonal', 'discard'],
      status: { 'p-diagonal': 'peeks' },
      known: DIAG_3,
    },
    {
      id: 'switcheroo',
      title: 'Jack or Queen, switch between',
      narration:
        'Across draws a queen of diamonds and grins. Discard a jack or queen from the stock and you may trade the places of ANY two cards on the table, no looking allowed. Across swaps one of their unknowns for your bottom-right card, the six you had been counting on. A truly blind trade: even Across’s own ghosts show nothing of what they gave away or got back.',
      callout: 'Jack or Queen, switch between: blindly trade the places of any two layout cards on the table.',
      impact: true,
      apply: (b) => move(swap(b, 'S-8', 'C-6'), ['D-Q'], 'discard', { faceUp: true }),
      highlight: ['S-8', 'C-6'],
      spotlight: ['p-across', 'p-you'],
      status: { 'p-across': 'swaps!' },
      known: ACROSS_2,
    },
    {
      id: 'know-a-friend',
      title: 'Nine or ten, know a friend',
      narration:
        'Back on your turn, your ghosts tell the story of that trade: the six you lost still glows from Across’s square, because you watched exactly where it went, while the stranger they left you sits blank. Now you draw a ten of diamonds. Nine or ten, know a friend: discard it and you may peek at one card in an opponent’s square. You choose Side’s bottom-right corner and find a six of spades. File it away; knowing where a six lives is about to pay off.',
      callout: 'Nine or ten, know a friend: peek at one card in an opponent’s square.',
      apply: (b) => flip(move(b, ['D-10'], 'drawn', { faceUp: true }), ['S-6'], true),
      highlight: ['S-6'],
      spotlight: ['drawn', 'p-side', 'p-across'],
      known: YOU_4,
    },
    {
      id: 'file-it-away',
      title: 'Slide it back, give nothing away',
      narration:
        'The six flips back down, but it stays in your memory, ghosted in Side’s square. The ten has done its work and hits the pile. Your turn ends with you quietly richer: three of your own corners known, one of Side’s, and your old six tracked all the way into Across’s square.',
      apply: (b) => move(flip(b, ['S-6'], false), ['D-10'], 'discard', { faceUp: true }),
      spotlight: ['p-you', 'p-side', 'discard'],
      known: YOU_4,
    },
    {
      id: 'side-trades',
      title: 'Side trades up',
      narration:
        'Side draws a five and slides it in over the nine they have known since the deal: four points saved, no gamble at all. Their memory grows with every turn, and it now reaches into your square too.',
      apply: (b) => replaceFromStock(b, 'C-5', 'D-9'),
      highlight: ['D-9'],
      spotlight: ['p-side', 'discard'],
      status: { 'p-side': 'plays' },
      known: SIDE_3,
    },
    {
      id: 'diagonal-studies',
      title: 'Diagonal studies the enemy',
      narration:
        'Diagonal burns another ten, nine or ten, know a friend, and peeks the top-left card of Across’s square: a nine of clubs. Their memory now covers their whole square and a corner of Across’s. Watch how dangerous that gets the moment something matchable hits the pile.',
      apply: (b) => move(b, ['S-10'], 'discard', { faceUp: true }),
      spotlight: ['p-diagonal', 'p-across', 'discard'],
      status: { 'p-diagonal': 'peeks' },
      known: DIAG_4,
    },
    {
      id: 'the-invitation',
      title: 'A three spins face up',
      narration:
        'Across swaps the two of hearts they just drew into their square, and the old three of hearts spins face up onto the pile. For one heartbeat it just sits there. A face-up card is an invitation: anyone who knows where a matching card lies face down, in ANY square on the table, may grab it and slam it on top. Two players at this table know where a three lives. One of them is you.',
      apply: (b) => replaceFromStock(b, 'H-2', 'H-3'),
      highlight: ['H-3'],
      spotlight: ['p-across', 'discard'],
      status: { 'p-across': 'plays' },
      known: ACROSS_3,
    },
    {
      id: 'knock',
      title: 'SLAM: beaten to the knock',
      narration:
        'SLAM. Diagonal’s three of clubs crashes down on the pile, out of turn. The move is called a knock. You knew your own three matched, you have been carrying it since your first turn, but Diagonal has known theirs since the opening peek and their hand was faster. Their square is down to three cards, and it did not cost them a turn.',
      callout: 'The knock: when a card lands face up on the pile, race to slam its match from any face-down card on the table. Old-schoolers race to knock the table to claim it; we play grab and slam. A wrong knock costs a penalty card.',
      impact: true,
      apply: (b) => move(b, ['C-3'], 'discard', { faceUp: true }),
      highlight: ['H-3', 'C-3'],
      spotlight: ['p-diagonal', 'discard'],
      status: { 'p-diagonal': 'knocks!' },
      known: DIAG_4,
    },
    {
      id: 'six-sense',
      title: 'A six, and you know where its twin lives',
      narration:
        'Your turn, and the stock hands you a six of hearts. An ordinary card, except you know exactly where another six lives: face down in Side’s square, right where you peeked it. Time to knock.',
      apply: (b) => move(b, ['H-6'], 'drawn', { faceUp: true }),
      highlight: ['H-6'],
      spotlight: ['drawn', 'p-side'],
      known: YOU_4,
    },
    {
      id: 'your-knock',
      title: 'Your knock: strike with what you know',
      narration:
        'You grab Side’s six and SLAM it onto the pile, your drawn six landing on top to seal it. Knocking a card out of an opponent’s square has a price: their empty slot is refilled blind from YOUR square, and you hand over the mystery card Across planted on you. Gladly. Your square is down to three cards, every one of them known.',
      callout: 'Knock wrong and the card goes back where it was: you draw a penalty card face down into your square for each miss.',
      impact: true,
      apply: (b) => {
        let n = swap(b, 'S-6', 'S-8');
        n = move(n, ['S-6'], 'discard', { faceUp: true });
        return move(n, ['H-6'], 'discard', { faceUp: true });
      },
      highlight: ['S-6', 'H-6', 'S-8'],
      spotlight: ['p-you', 'p-side', 'discard'],
      status: { 'p-you': 'knock!' },
      known: YOU_5,
    },
    {
      id: 'cabo',
      title: 'You call CABO',
      narration:
        'Look at your square: a three, the zero king and an ace. Four points. You will not do better, so on your turn you simply say the word: CABO. No draw, nothing else. Every other player now gets exactly one more turn, and then the hand is scored. One warning, though: calling it ends the game, but it does not freeze it.',
      callout: 'Cabo means last lap: each other player gets exactly one more turn. The hand also ends if a square empties or the stock runs out.',
      impact: true,
      apply: (b) => b,
      spotlight: ['p-you'],
      status: { 'p-you': 'CABO!' },
      known: YOU_5,
      banner: CABO_SIGN,
    },
    {
      id: 'side-too-late',
      title: 'Side learns the worst, too late',
      narration:
        'The last lap begins. Side draws a seven and burns it on a peek at one of their own cards. The news is grim: the club king, thirteen points, asleep in their square since the deal. And the peek itself was a wasted move, because on the last lap there is no future turn in which to use what you learn.',
      apply: (b) => move(b, ['H-7'], 'discard', { faceUp: true }),
      spotlight: ['p-side', 'discard'],
      status: { 'p-side': 'gulp' },
      known: SIDE_4,
      banner: CABO_SIGN,
    },
    {
      id: 'diagonal-plays-straight',
      title: 'Diagonal plays it straight',
      narration:
        'Diagonal makes the boring, correct play. You always see the card you draw, and theirs is an ace, so it slides in over the four they have known from the start: three points saved, guaranteed, no powers and no gambles.',
      apply: (b) => replaceFromStock(b, 'C-A', 'S-4'),
      highlight: ['S-4'],
      spotlight: ['p-diagonal', 'discard'],
      status: { 'p-diagonal': 'plays' },
      known: DIAG_5,
      banner: CABO_SIGN,
    },
    {
      id: 'last-match',
      title: 'Across purges its twos',
      narration:
        'Across takes the final turn of the hand and draws a two of spades, and they know exactly where its twins live: the two they took off the pile and the two they slotted in themselves. SLAM, SLAM, a double knock. Both leave their square, the drawn two lands on top, and knocking your own cards needs no refill: the square simply shrinks. Across drops from four cards to two in a single turn, nineteen points down to fifteen.',
      callout: 'Calling Cabo starts the last lap. It does not freeze the table: knocks and powers still fire.',
      impact: true,
      apply: (b) => {
        let n = move(b, ['D-2'], 'discard', { faceUp: true });
        n = move(n, ['H-2'], 'discard', { faceUp: true });
        return move(n, ['S-2'], 'discard', { faceUp: true });
      },
      highlight: ['D-2', 'H-2', 'S-2'],
      spotlight: ['p-across', 'discard'],
      stagger: ['discard'],
      status: { 'p-across': 'double knock!' },
      known: ACROSS_3,
      banner: CABO_SIGN,
    },
    {
      id: 'reveal',
      title: 'Cabo! Every square turns up',
      narration:
        'Every square turns face up and the counting starts. Your king of diamonds scores its zero and your call holds: four points wins the hand. But look how close the table came to catching you. Across knocked two cards away at the death and finishes on 15; one more lap and your lead might have evaporated. Diagonal’s knock pays off with 17. And Side learns the expensive way: the club king plus the mystery you planted on them piles up to a painful 31.',
      callout: 'Totals: You 4 · Across 15 · Diagonal 17 · Side 31. Lowest total wins, and this time the caller holds on.',
      impact: true,
      apply: (b) => SEATS.reduce((acc, z) => flip(acc, cardsInZone(acc, z), true), b),
      spotlight: SEATS,
      status: { 'p-you': 'wins on 4', 'p-across': '15', 'p-diagonal': '17', 'p-side': '31' },
    },
    {
      id: 'recap',
      title: 'Remember everything, trust nothing',
      narration:
        'That is Cabo: peek once, remember everything, knock the instant you see a match, and spend the powers well. Seven or eight, know your fate. Nine or ten, know a friend. Jack or queen, switch between. Calling Cabo is always a bet that one lap is not enough time to catch you, and a lucky queen or a flurry of knocks can still turn it upside down. The only assured way to win is to end the game yourself: knock away all four of your cards, and the play stops on the spot with your score an untouchable zero.',
      callout: 'Seven or eight, know your fate · Nine or ten, know a friend · Jack or Queen, switch between.',
      apply: (b) => b,
    },
  ],
  notes: [
    {
      heading: 'Plain four-card Golf',
      body: 'Cabo is the spiced-up member of the Golf family. In the plain game there are no powers, no knocking and no special king of diamonds: numeral cards score face value, jacks and queens 10, every king 0, and the hand ends when a player raps the table instead of calling Cabo. Same square, same memory, far fewer knives.',
    },
    {
      heading: 'A bigger table',
      body: 'In theory any number from two to eight or more can play, though the game is said to be best for about four. With eight or more players, shuffle two packs together.',
    },
    {
      heading: 'The failed knock',
      body: 'Knock wrong and the card goes back exactly where it was. As a penalty you draw a card from the stock and add it face down to your square, without looking, for each miss. Every extra card is pure liability, so knock sparingly.',
    },
    {
      heading: 'The knock',
      body: 'A knock answers any card that lands face up on the pile: race to slam its match from any face-down card on the table. Traditionally the race was to be first to knock on the table; we play it as grabbing the card and slamming it on top, and the name stuck. The written rules are stricter: only the player whose turn it is may match, and only with the card they just drew. Agree before you start how your table knocks.',
    },
    {
      heading: 'Powers ride the stock',
      body: 'A card taken from the discard pile must go straight into your square, so its power never fires. Only cards drawn from the stock can be discarded for a peek or a switch.',
    },
    {
      heading: 'Look and you lose it',
      body: 'Outside of a power, glancing at any face-down card in your own layout is not free: a card you look at must be replaced with the card you drew. There is no checking a card and leaving it in place.',
    },
    {
      heading: 'Three ways it ends',
      body: 'A Cabo call ends the hand after one last lap. The play also ends immediately if a player empties their square entirely, or if the stock runs out.',
    },
  ],
};
