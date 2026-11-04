/**
 * Conversation moves: what kind of reply the tutor gives this turn. Left to itself a chat
 * model asks a question every time, and the talk turns into an interview. Real teachers mix
 * it up: they share, teach a phrase, tell a short story, hand the questions over, play a
 * quick game. Each tutor reply gets one move, in an order that changes per conversation, so
 * no two conversations run the same way and a question never comes three times in a row.
 */

export const MOVES = [
  "ask",
  "share",
  "teach",
  "flip",
  "story",
  "game",
  "level-up",
  "recap",
  "roleplay",
  "quick-fire",
  "rate-it",
  "spot-it",
] as const;
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
  roleplay:
    "Switch into a short roleplay (two or three turns) that fits the topic: say in one sentence who you are (a customer, a neighbor, a colleague, a friend who needs help) and give him a small real-life task, then speak in character. When it is done, step out with one tip about how he said something.",
  "quick-fire":
    "Quick-fire round: ask three very short questions in a row, one line each, and tell him to answer each in one sentence without thinking too long. It breaks the rhythm and gets him speaking fast.",
  "rate-it":
    "Ask him to rate something about the topic from 1 to 10 and to explain the number with one reason and one example. Then react to his number (surprised, you'd have said more or less) and ask what would move it by one point.",
  "spot-it":
    "Spot the mistake: say two short sentences about the topic where one contains a typical mistake a Hebrew speaker makes (word order, a missing article, for or since, a direct translation). Ask which one sounds wrong and how to fix it. Don't point at it yourself.",
};

/** Where the teach moment and the hand-over land, and the order of the rest. */
const BASE: readonly Move[] = [
  "share",
  "ask",
  "teach",
  "quick-fire",
  "flip",
  "share",
  "story",
  "ask",
  "spot-it",
  "level-up",
  "rate-it",
  "roleplay",
  "ask",
  "game",
  "recap",
];

/**
 * How a conversation opens. The first minutes of every conversation felt the same because
 * the opening was always "a question about you"; each conversation now gets one of these,
 * and never one of its last few opening lines.
 */
export const OPENING_STYLES = [
  {
    id: "unexpected-question",
    rule: "Open with one specific, slightly unexpected question that makes him think. Not about his daily routine.",
  },
  {
    id: "this-or-that",
    rule: "Open with a quick this-or-that choice connected to the theme and ask him to pick one and say why.",
  },
  {
    id: "callback",
    rule: "Open by picking up one concrete thing from your notes about him or from last time (a plan, a number, a person) and ask how it turned out. If your notes have nothing fitting, open with a mini story instead.",
  },
  {
    id: "mini-story",
    rule: "Open with two sentences of your own: a small story or observation about the theme. Then ask whether anything like it ever happened to him.",
  },
  {
    id: "hot-take",
    rule: "Open with a playful hot take about the theme and ask if he agrees or disagrees.",
  },
  {
    id: "what-would-you-do",
    rule: "Open with a one-sentence imaginary situation that involves him and ask what he would do.",
  },
  {
    id: "word-first",
    rule: "Open by giving him one fresh useful word or phrase connected to the theme, with its meaning in a few words, and ask him to use it in his first answer.",
  },
  {
    id: "rate-it",
    rule: "Open by asking him to rate something about the theme from 1 to 10 and explain the number.",
  },
] as const;

export function openingStyleFor(seed: string): (typeof OPENING_STYLES)[number] {
  return OPENING_STYLES[hash(`${seed}|open`) % OPENING_STYLES.length];
}

export function openingStyleById(id: string | undefined) {
  return OPENING_STYLES.find((o) => o.id === id);
}

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
