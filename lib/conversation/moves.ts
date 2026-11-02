/**
 * Conversation moves: what kind of reply the tutor gives this turn. Left to itself a chat
 * model asks a question every time, and the talk turns into an interview. Real teachers mix
 * it up: they share, teach a phrase, tell a short story, hand the questions over, play a
 * quick game. Each tutor reply gets one move, in an order that changes per conversation, so
 * no two conversations run the same way and a question never comes three times in a row.
 */

export const MOVES = ["ask", "share", "teach", "flip", "story", "game", "level-up", "recap"] as const;
export type Move = (typeof MOVES)[number];

export const MOVE_RULES: Record<Move, string> = {
  ask: "Ask one open question that needs a longer answer (why, how, what would you do). Make it specific, not generic.",
  share:
    'React to what he said, then share your own short opinion or experience (2 or 3 sentences, plausible and consistent with anything you said earlier). End by inviting his view, without a direct question if it fits ("I\'m curious where you stand.").',
  teach:
    "Teaching moment: take one useful phrase or structure that fits what he just said (or should have said). Say the phrase, what it means in a few words, and one example. Then ask him to use it in his next answer. Keep it light, like a coach giving a tip, not a lecture.",
  flip: "Hand the questions over: tell him it's his turn to ask you two or three questions about the topic. Answer each one briefly and naturally when it comes, and if a question's word order is off, quietly repeat it correctly before answering.",
  story:
    "Tell a very short story of your own about the topic (3 or 4 sentences, past tenses, a small twist). Then ask him either to retell the gist in his own words or to say what he would have done.",
  game: 'Play a 1-minute language game connected to the topic. Pick one: "say it three ways" (the same idea three different ways), "describe it without saying the word", "finish my sentence", or "two truths and a lie" about yourself. Explain it in one sentence and start.',
  "level-up":
    "Take one idea he said in simple words and ask him to say it again at a higher level: more precise words, a more formal tone, or a longer sentence with a reason. If he gets it, say what made it better.",
  recap:
    "Sum up what he has said so far in one sentence, show you were listening, then point to one part that is still missing or unclear and ask him to add it.",
};

/** Where the teach moment and the hand-over land, and the order of the rest. */
const BASE: readonly Move[] = [
  "share",
  "ask",
  "teach",
  "ask",
  "flip",
  "share",
  "story",
  "level-up",
  "ask",
  "game",
  "recap",
];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * The tutor's move for reply number `n` (1 = the first reply after the opening line). The
 * order is the base order with neighbours swapped by the seed, so every conversation differs
 * while the teach moment comes early and questions never repeat three times running.
 */
export function moveFor(n: number, seed: string): Move {
  const order = [...BASE];
  const h = hash(seed);
  // Swap a few neighbouring pairs, decided by bits of the seed.
  for (let i = 1; i < order.length - 1; i += 2) {
    if ((h >> i) & 1) [order[i], order[i + 1]] = [order[i + 1], order[i]];
  }
  const i = (Math.max(1, n) - 1) % order.length;
  return order[i];
}

export function moveRule(move: Move | undefined): string {
  return move
    ? `Your move for this reply: ${MOVE_RULES[move]}\nBefore the move: if his last message asks you something, answer it first in a sentence or two (he may be doing the asking on purpose). If a game, a retell or his questions to you from your last reply are still going, finish that first and make the move short.`
    : "";
}
