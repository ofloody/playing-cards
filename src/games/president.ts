import type { Game } from '../engine/types';
import { standardDeck } from '../engine/deck';
import { placeAll, move, flip, cardsInZone } from '../engine/board';
import type { Board } from '../engine/types';

// One full, scripted hand at a four-seat table (You, West, North, East).
// You (South) hold an exact 13-card hand so the scripted plays line up; the
// other three seats get a few forced cards for the demo and fill evenly.
const SOUTH = [
  'S-5', 'S-K',          // R1: lead a five, then win with a king
  'D-7', 'C-7',          // R2: lead a pair of sevens
  'H-A', 'C-A',          // R2: jump in to complete four aces (a REVOLUTION)
  'S-10', 'D-10',        // R3: lead a pair of tens
  'S-2',                 // R3: the single-2 BOMB
  'S-J', 'D-J', 'D-K', 'H-K', // the cards you go out on (jacks then kings)
];
const FORCED: Record<string, string[]> = {
  'p-west': ['D-8', 'D-9', 'S-9', 'H-2'],          // R1 eight; R2 a pair of nines; the lone 2 that dooms them
  'p-north': ['C-10', 'D-A', 'S-A', 'H-J', 'C-J'], // R1 ten; R2 a pair of aces; R3 a pair of jacks
  'p-east': ['H-Q', 'D-Q', 'C-Q'],                  // R1 a queen; the pair of queens you go out over
};

const hands: Record<string, string[]> = {
  'p-south': [...SOUTH],
  'p-west': [...FORCED['p-west']],
  'p-north': [...FORCED['p-north']],
  'p-east': [...FORCED['p-east']],
};
const used = new Set([...SOUTH, ...FORCED['p-west'], ...FORCED['p-north'], ...FORCED['p-east']]);
const rest = standardDeck().filter((id) => !used.has(id));
const fillSeats = ['p-west', 'p-north', 'p-east'];
let fi = 0;
for (const id of rest) {
  while (hands[fillSeats[fi % 3]].length >= 13) fi++;
  hands[fillSeats[fi % 3]].push(id);
  fi++;
}

const deck = standardDeck();

// Fresh deal for the "next game" demo: one whole suit per seat so the
// role-based trade is easy to read (standardDeck() is ordered S, H, D, C).
const SPADES = deck.slice(0, 13);   // President (You)
const HEARTS = deck.slice(13, 26);  // Bum (West)
const DIAMONDS = deck.slice(26, 39); // Vice-President (North)
const CLUBS = deck.slice(39, 52);   // Vice-Bum (East)

// Sweep the current round's cards out of play.
const clear = (b: Board) => move(b, cardsInZone(b, 'trick'), 'discard', { faceUp: false });
const clearMiddle = (b: Board) => move(b, cardsInZone(b, 'middle'), 'discard', { faceUp: false });
// Lay a player's whole remaining hand into the centre, face-up (they go out).
const playOutToMiddle = (b: Board, zone: string) =>
  move(b, cardsInZone(b, zone), 'middle', { faceUp: true });

export const president: Game = {
  id: 'president',
  title: 'President',
  blurb: 'A ladder of power. Empty your hand first to rule the table; finish last and you’re the Bum.',
  players: '4–7',
  playTime: '5 min – 2 hours',
  difficulty: 'Involved',
  accent: '#34507a',
  origin: `President has many alternative names: Scum, Asshole (in Britain: Arsehole), Rich Man Poor Man, Bum, Landlord, Emperors and Scum, Root Beer, Butthead, Capitalism. In Australia it is often called Warlords and Scumbags, perhaps because the politician Paul Keating once famously used the word "scumbag" to describe his opponents. In France it is Trouduc or Trou du Cul; in Germany: Einer ist immer der Arsch; in Hungary it is Hűbéres (vassal); in Denmark it is Røvhul; in the Netherlands it is Sluitspieren or Klootzakken.

The game spread throughout the Western world, especially among young people, towards the end of the 20th century, but is probably of Chinese origin. In games of this type (which I call climbing games), each player in turn can either pass or play a card or combination which beats the previous play, and the usual object is to get rid of all one's cards as soon as possible. Such games have been known in the West only since the 1970's, but there are many of them in China, perhaps the most famous being Zheng Shangyou. The immediate ancestor of President is perhaps the Japanese game Dai Hin Min.

As the game has spread, numerous variations have developed. I will describe a typical basic version first, and list some variations at the end. As the variations are so numerous, I have tried to group them into types for easier reference.`,
  zones: [
    { id: 'deck', anchor: { x: 0.5, y: 0.5 }, layout: 'pile' },
    { id: 'p-north', anchor: { x: 0.5, y: 0.12 }, layout: 'pile', rotate: 180, label: 'North', labelPos: 'below' },
    { id: 'p-west', anchor: { x: 0.13, y: 0.48 }, layout: 'pile', label: 'West', labelPos: 'above' },
    { id: 'p-east', anchor: { x: 0.87, y: 0.48 }, layout: 'pile', label: 'East', labelPos: 'above' },
    { id: 'p-south', anchor: { x: 0.5, y: 0.8 }, layout: 'fan', gap: 0.03, label: 'You', labelPos: 'above' },
    { id: 'trick', anchor: { x: 0.5, y: 0.45 }, layout: 'row', gap: 0.05 },
    { id: 'middle', anchor: { x: 0.5, y: 0.45 }, layout: 'pile' },
    { id: 'discard', anchor: { x: 0.85, y: 0.78 }, layout: 'pile', label: 'Discard', labelPos: 'below' },
  ],
  build: () => placeAll(deck, 'deck', false),
  steps: [
    {
      id: 'intro',
      title: 'A climbing game',
      narration:
        'President is a climbing game for about four to seven players with a full 52-card deck. The cards rank high to low: the 2 is the boss, then A K Q J 10 9 8 7 6 5 4 3, with the 3 the runt. Suits don’t matter at all. The whole aim is simply to be the first to get rid of every card in your hand. We’ll deal one complete hand at a four-seat table (You, West, North and East) and play three full rounds, then settle the places.',
      callout: 'Rank, high → low: 2 A K Q J 10 9 8 7 6 5 4 3.',
      apply: (b) => b,
      spotlight: ['deck'],
    },
    {
      id: 'deal',
      title: 'Deal it all out',
      narration:
        'Deal the whole deck out clockwise so everyone holds about thirteen cards. You can see your own hand fanned along the bottom; the other three keep theirs hidden, so to you their cards just show as backs. The player to the dealer’s left leads first, and that’s you. (Many tables instead make whoever was dealt the 3♣ lead it as the very first card.)',
      apply: (b) => {
        let n = move(b, hands['p-south'], 'p-south', { faceUp: true });
        n = move(n, hands['p-west'], 'p-west', { faceUp: false });
        n = move(n, hands['p-north'], 'p-north', { faceUp: false });
        n = move(n, hands['p-east'], 'p-east', { faceUp: false });
        return n;
      },
      spotlight: ['p-south', 'p-west', 'p-north', 'p-east'],
    },

    // ---------- Round 1: singles, and why you might pass ----------
    {
      id: 'r1-lead',
      title: 'Round 1: lead a card',
      status: { 'p-south': 'starts' },
      narration:
        'You lead the first round. A lead can be a single card or a set of equal rank: a pair, a triple, even four of a kind. You ease in with a single five.',
      callout: 'Small-set rule: on singles and pairs you may also play the exact same rank, not only a higher one, so a 9 can answer a 9. (Triples and bigger must be beaten outright.)',
      apply: (b) => move(b, ['S-5'], 'trick', { faceUp: true }),
      highlight: ['S-5'],
      spotlight: ['trick', 'p-south'],
    },
    {
      id: 'r1-climb',
      title: 'Each player climbs or passes',
      status: { 'p-west': 'plays', 'p-north': 'plays', 'p-east': 'plays' },
      narration:
        'Going clockwise, each player must beat what’s on top with a higher card of the same count, or pass. West drops an eight, North a ten, East a queen. The queen comes back around to you.',
      apply: (b) => {
        let n = move(b, ['D-8'], 'trick', { faceUp: true });
        n = move(n, ['C-10'], 'trick', { faceUp: true });
        n = move(n, ['H-Q'], 'trick', { faceUp: true });
        return n;
      },
      highlight: ['H-Q'],
      spotlight: ['trick'],
    },
    {
      id: 'r1-king',
      title: 'You top it with a king',
      status: { 'p-south': 'plays' },
      narration: 'It’s your turn again, and you climb over the queen with a king.',
      apply: (b) => move(b, ['S-K'], 'trick', { faceUp: true }),
      highlight: ['S-K'],
      spotlight: ['trick', 'p-south'],
    },
    {
      id: 'r1-clear',
      title: 'Everyone passes, you clear',
      status: { 'p-west': 'pass', 'p-north': 'pass', 'p-east': 'pass', 'p-south': 'wins' },
      narration:
        'Now West, North and East all pass. Here’s a key idea: passing is always allowed, even when you could play. One of them may well hold an ace that beats your king, but they’d rather hang on to it for a round that matters more. With everyone passing, your king is the highest card, so you win the round, the pile is swept out of play, and you lead again.',
      apply: (b) => clear(b),
      spotlight: ['discard', 'p-south'],
    },

    // ---------- Round 2: pairs, and a revolution ----------
    {
      id: 'r2-lead',
      title: 'Round 2: lead a pair',
      status: { 'p-south': 'starts' },
      narration:
        'With the lead, you start the next round with a pair, two sevens. A single card can’t answer a pair now; it takes a higher pair, or, by the small-set rule, a matching pair of sevens.',
      apply: (b) => move(b, ['D-7', 'C-7'], 'trick', { faceUp: true }),
      highlight: ['D-7', 'C-7'],
      spotlight: ['trick', 'p-south'],
    },
    {
      id: 'r2-climb',
      title: 'The pile climbs to aces',
      status: { 'p-west': 'plays', 'p-north': 'plays' },
      narration:
        'West tops your sevens with a pair of nines. North climbs higher still with a pair of aces, about as untouchable as a pair gets. The turn would pass to East next.',
      apply: (b) => {
        let n = move(b, ['D-9', 'S-9'], 'trick', { faceUp: true });
        n = move(n, ['D-A', 'S-A'], 'trick', { faceUp: true });
        return n;
      },
      highlight: ['D-A', 'S-A'],
      spotlight: ['trick'],
    },
    {
      id: 'r2-revolution',
      title: 'Complete the four: a revolution',
      status: { 'p-south': 'revolution!', 'p-east': 'skipped' },
      impact: true,
      narration:
        'Here’s what makes four of a kind special: completing it can be done by anyone, at any moment, and you don’t have to wait for your turn. You’re holding the last two aces, so before East can even move, you SLAM them down and complete all four. The table jolts: that’s a revolution (not a bomb, the bomb is the 2; and at some tables a revolution also flips the whole ranking for the rest of the hand; see the variations). East is jumped clean over.',
      apply: (b) => move(b, ['H-A', 'C-A'], 'trick', { faceUp: true }),
      highlight: ['D-A', 'S-A', 'H-A', 'C-A'],
      spotlight: ['trick', 'p-south'],
    },
    {
      id: 'r2-clear',
      title: 'A revolution seizes control',
      status: { 'p-south': 'wins' },
      narration:
        'Like a bomb, a revolution clears the table outright, and the player who completed the four takes control and leads the next round. East never got a turn at all. The lead is firmly yours.',
      apply: (b) => clear(b),
      spotlight: ['discard', 'p-south'],
    },

    // ---------- Round 3: the 2 bomb ----------
    {
      id: 'r3-lead',
      title: 'Round 3: lead a pair of tens',
      status: { 'p-south': 'starts' },
      narration: 'You lead again, a pair of tens this time.',
      apply: (b) => move(b, ['S-10', 'D-10'], 'trick', { faceUp: true }),
      highlight: ['S-10', 'D-10'],
      spotlight: ['trick', 'p-south'],
    },
    {
      id: 'r3-beat',
      title: 'North answers with jacks',
      status: { 'p-west': 'pass', 'p-north': 'plays', 'p-east': 'pass' },
      narration:
        'West passes. North beats your tens with a pair of jacks. East passes too, and it’s back to you, with no higher pair in hand.',
      apply: (b) => move(b, ['H-J', 'C-J'], 'trick', { faceUp: true }),
      highlight: ['H-J', 'C-J'],
      spotlight: ['trick'],
    },
    {
      id: 'r3-bomb',
      title: 'The 2: drop a bomb',
      status: { 'p-south': 'bomb!' },
      impact: true,
      narration:
        'No higher pair? No problem. You hold the one true bomb in the game: a single 2. A lone 2 beats absolutely any play, even a pair of jacks, and the table jolts as it lands. The catch, and the very reason it’s a bomb: you can never finish on a 2. Get caught holding one as your last card and you’re automatically the Bum, so you spend your twos while you safely can. Down it goes.',
      apply: (b) => move(b, ['S-2'], 'trick', { faceUp: true }),
      highlight: ['S-2'],
      spotlight: ['trick'],
    },

    // ---------- Endgame: the round fast-forwards, and places fall ----------
    {
      id: 'out-president',
      title: 'You go out first: President',
      status: { 'p-west': 'pass', 'p-north': 'pass', 'p-east': 'plays', 'p-south': 'out!' },
      stagger: ['trick'],
      narration:
        'The bomb wins the round and you keep the lead. You lead your jacks; West and North pass, but East climbs in with a pair of queens, so you finish with the kings you held back, dropping them on top. That’s your whole hand gone. First one out, top of the ladder: the President!',
      apply: (b) => {
        let n = clear(b);
        n = move(n, ['S-J', 'D-J'], 'trick', { faceUp: true });
        n = move(n, ['D-Q', 'C-Q'], 'trick', { faceUp: true });
        n = move(n, ['D-K', 'H-K'], 'trick', { faceUp: true });
        return n;
      },
      highlight: ['D-K', 'H-K'],
      spotlight: ['trick', 'p-south'],
    },
    {
      id: 'west-almost',
      title: 'West left holding a bomb: automatic Bum',
      status: { 'p-south': 'Pres.', 'p-west': 'Bum' },
      impact: true,
      stagger: ['middle'],
      narration:
        'Now watch West. The play fast-forwards: West fires card after card into the middle and races all the way down to a single card, closer to going out than anyone left and about to grab second place. But that last card is a 2, and you can never go out on a 2. The moment they’re down to it the bomb goes off in their hand; there’s nothing else to play and no one can clear it off for them, so right there, in an instant, West drops from nearly-second all the way to the bottom: the Bum.',
      apply: (b) => {
        const c = clear(b);
        const others = cardsInZone(c, 'p-west').filter((id) => id !== 'H-2');
        return flip(move(c, others, 'middle', { faceUp: true }), ['H-2'], true);
      },
      highlight: ['H-2'],
      spotlight: ['middle', 'p-west'],
    },
    {
      id: 'north-vp',
      title: 'North goes out: Vice-President',
      status: { 'p-south': 'Pres.', 'p-north': 'out!', 'p-west': 'Bum' },
      stagger: ['middle'],
      narration:
        'With West already the Bum, the other two play on for the places in between. North empties their hand into the middle and goes out, taking second place, the Vice-President.',
      apply: (b) => playOutToMiddle(clearMiddle(b), 'p-north'),
      spotlight: ['middle', 'p-north'],
    },
    {
      id: 'east-vbum',
      title: 'East goes out: Vice-Bum',
      status: { 'p-south': 'Pres.', 'p-north': 'V.P.', 'p-east': 'V.Bum', 'p-west': 'Bum' },
      stagger: ['middle'],
      narration:
        'East lays their last cards down right after, taking third place, the Vice-Bum. That settles every seat at the table.',
      callout: 'Final order. President: You · Vice-President: North · Vice-Bum: East · Bum: West.',
      apply: (b) => playOutToMiddle(clearMiddle(b), 'p-east'),
      spotlight: ['middle', 'p-east'],
    },
    {
      id: 'next-deal',
      title: 'A new deal, and now there are roles',
      status: { 'p-south': 'Prez', 'p-north': 'V.P.', 'p-east': 'V.Bum', 'p-west': 'Bum' },
      narration:
        'The places carry straight into the next deal. Shuffle, deal thirteen fresh cards to everyone, and this time you sit down as the President, with North the Vice-President, East the Vice-Bum, and West the Bum. The seats keep their titles until someone knocks them off.',
      apply: (b) => {
        let n = move(b, SPADES, 'p-south', { faceUp: true });
        n = move(n, HEARTS, 'p-west', { faceUp: false });
        n = move(n, DIAMONDS, 'p-north', { faceUp: false });
        n = move(n, CLUBS, 'p-east', { faceUp: false });
        return n;
      },
      spotlight: ['p-south', 'p-west', 'p-north', 'p-east'],
    },
    {
      id: 'exchange',
      title: 'The trade: rank has its privileges',
      status: { 'p-south': 'Prez', 'p-north': 'V.P.', 'p-east': 'V.Bum', 'p-west': 'Bum' },
      narration:
        'Before a card is led, the losers pay tribute up the ladder. The Bum hands the President their two highest cards, and in return the President sends two cards straight back down to West, here a throwaway 3 and 4 that land in the Bum’s hand. The Vice-Bum and Vice-President swap one card each the same way. Best cards flow up, unwanted ones trickle back down: the rich get richer, and the Bum digs out from the bottom all over again.',
      callout:
        'It’s a two-way swap: President ↔ Bum trade two cards each, Vice-President ↔ Vice-Bum one each.',
      apply: (b) => {
        // Bum → President: the two highest cards (here, the 2 and Ace of hearts).
        let n = move(b, ['H-2', 'H-A'], 'p-south', { faceUp: true });
        // President → Bum: two low cards of choice.
        n = move(n, ['S-3', 'S-4'], 'p-west', { faceUp: true });
        // Vice-Bum → Vice-President: one highest card.
        n = move(n, ['C-2'], 'p-north', { faceUp: true });
        // Vice-President → Vice-Bum: one card of choice.
        n = move(n, ['D-3'], 'p-east', { faceUp: true });
        return n;
      },
      highlight: ['H-2', 'H-A', 'S-3', 'S-4', 'C-2', 'D-3'],
      spotlight: ['p-south', 'p-west', 'p-north', 'p-east'],
    },
    {
      id: 'recap',
      title: 'Climb the ladder',
      status: { 'p-south': 'Prez' },
      narration:
        'And around it goes, hand after hand. Win and you keep the comfy chair, the title, and the trade in your favour; finish last and you shuffle, deal, and surrender your best cards every time. Empty your hand first, and long live the President.',
      apply: (b) => b,
      spotlight: ['p-south'],
    },
  ],
  notes: [
    {
      heading: 'Bombs and revolutions',
      body: 'Strictly, the basic game has neither: a single 2 is just the highest single, and four of a kind is just a big set. But the 2-bomb (a lone 2 beats anything) and the four-of-a-kind revolution (complete all four, even out of turn, to clear the table and take the lead) are two of the most popular add-ons, so most tables play with them. They’re different things: the bomb is always the 2.',
    },
    {
      heading: 'You can’t go out on a 2',
      body: 'Because nothing beats a 2, you’re not allowed to win by playing one as your last card. Get caught holding a lone 2 at the end and you drop straight to last place, the Bum, no matter how far ahead you were. It’s why good players unload their twos early rather than hoard them.',
    },
    {
      heading: 'Match, don’t just beat',
      body: 'A popular small-set rule, used here: on singles and pairs you may also play a card or pair of the exact same rank, so a single 9 can be met by another 9, or a pair by an equal pair. It doesn’t extend to triples or four-of-a-kind, which must be beaten outright.',
    },
    {
      heading: 'Revolution can flip the ranks',
      body: 'Some go further: a revolution doesn’t just clear the table, it turns the entire ranking upside-down for the rest of the hand, so suddenly the 3 is high and the 2 is low. A dramatic leveller that can break a runaway President’s streak.',
    },
    {
      heading: 'Passing',
      body: 'In the basic game you may pass and still play later in the same round. Many groups instead lock you out for the round once you pass, or force you to beat the play whenever you can.',
    },
    {
      heading: 'Climbing-game family',
      body: 'Add runs and it becomes Zheng Shangyou; add poker hands and it’s Big Two. President’s likely ancestor is the Japanese game Dai Hin Min.',
    },
  ],
};
