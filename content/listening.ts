/**
 * Listening sentences. Written the way people actually talk (contractions, "gonna",
 * linking, fillers) because textbook English is not what loses Hebrew speakers in real
 * conversations. Topics follow Hagai's goals: interviews, work, travel, everyday life.
 */

export type ListeningLevel = "B1" | "B2" | "C1";
export type ListeningTopic = "work" | "interview" | "travel" | "daily" | "tech";

export interface ListeningItem {
  id: string;
  text: string;
  level: ListeningLevel;
  topic: ListeningTopic;
  /** What makes it hard to catch, shown after the answer. */
  note?: string;
}

export const LISTENING: readonly ListeningItem[] = [
  {
    id: "l01",
    text: "I'm gonna grab a coffee. Do you want anything?",
    level: "B1",
    topic: "daily",
    note: "“gonna” = going to",
  },
  { id: "l02", text: "Sorry, I didn't catch that. Could you say it again?", level: "B1", topic: "daily" },
  {
    id: "l03",
    text: "We should probably head out in about ten minutes.",
    level: "B1",
    topic: "daily",
    note: "“head out” = leave",
  },
  {
    id: "l04",
    text: "What do you wanna do this weekend?",
    level: "B1",
    topic: "daily",
    note: "“wanna” = want to; “what do you” sounds like “whaddaya”",
  },
  {
    id: "l05",
    text: "I've been meaning to call you all week.",
    level: "B2",
    topic: "daily",
    note: "“meaning to” = planning to, but not done yet",
  },
  {
    id: "l06",
    text: "It's not a big deal, but it kind of bugs me.",
    level: "B2",
    topic: "daily",
    note: "“kind of” sounds like “kinda”; “bugs me” = annoys me",
  },
  {
    id: "l07",
    text: "Let's touch base on Thursday and see where we are.",
    level: "B1",
    topic: "work",
    note: "“touch base” = check in briefly",
  },
  {
    id: "l08",
    text: "Can you send me the deck before the meeting?",
    level: "B1",
    topic: "work",
    note: "“deck” = slide presentation",
  },
  {
    id: "l09",
    text: "I'll circle back once I've heard from the client.",
    level: "B2",
    topic: "work",
    note: "“circle back” = return to a topic later",
  },
  { id: "l10", text: "We're a bit behind schedule, so let's prioritize the must-haves.", level: "B2", topic: "work" },
  {
    id: "l11",
    text: "Just to make sure we're on the same page, the deadline is Friday, right?",
    level: "B2",
    topic: "work",
  },
  {
    id: "l12",
    text: "I hear what you're saying, but I don't think that's gonna fly with the team.",
    level: "C1",
    topic: "work",
    note: "“won't fly” = won't be accepted",
  },
  {
    id: "l13",
    text: "Honestly, it's been a bit of a rollercoaster, but we got there in the end.",
    level: "C1",
    topic: "work",
  },
  {
    id: "l14",
    text: "So walk me through what you did in your last role.",
    level: "B2",
    topic: "interview",
    note: "“walk me through” = explain step by step",
  },
  { id: "l15", text: "What would you say is your biggest weakness?", level: "B1", topic: "interview" },
  { id: "l16", text: "Where do you see yourself in five years?", level: "B1", topic: "interview" },
  {
    id: "l17",
    text: "Tell me about a time you had to deal with a difficult customer.",
    level: "B2",
    topic: "interview",
  },
  {
    id: "l18",
    text: "What drew you to this position in the first place?",
    level: "B2",
    topic: "interview",
    note: "“drew you to” = attracted you to",
  },
  {
    id: "l19",
    text: "We'll be in touch by the end of next week either way.",
    level: "B2",
    topic: "interview",
    note: "“either way” = whatever the decision is",
  },
  {
    id: "l20",
    text: "How do you usually handle it when priorities change at the last minute?",
    level: "C1",
    topic: "interview",
  },
  {
    id: "l21",
    text: "Your gate's been changed to B12, and boarding starts in twenty minutes.",
    level: "B2",
    topic: "travel",
    note: "“gate's” = gate has",
  },
  { id: "l22", text: "Would you like a window or an aisle seat?", level: "B1", topic: "travel" },
  {
    id: "l23",
    text: "I'm afraid we're fully booked tonight, but there's a place just around the corner.",
    level: "B2",
    topic: "travel",
    note: "“I'm afraid” = politely, “sorry but”",
  },
  {
    id: "l24",
    text: "Is that for here or to go?",
    level: "B1",
    topic: "travel",
    note: "Café question: eat here or take away",
  },
  {
    id: "l25",
    text: "You'll wanna take the second left and then keep going till you hit the station.",
    level: "C1",
    topic: "travel",
    note: "“till you hit” = until you reach",
  },
  {
    id: "l26",
    text: "The rent's eighteen hundred a month, not including utilities.",
    level: "B2",
    topic: "travel",
    note: "“eighteen hundred” = 1,800",
  },
  {
    id: "l27",
    text: "Take two of these twice a day after meals, and come back if it doesn't clear up.",
    level: "B2",
    topic: "travel",
    note: "“clear up” = go away (an illness)",
  },
  { id: "l28", text: "Have you tried turning it off and on again?", level: "B1", topic: "tech" },
  {
    id: "l29",
    text: "The model's pretty good, but it still makes stuff up sometimes.",
    level: "B2",
    topic: "tech",
    note: "“makes stuff up” = invents things",
  },
  {
    id: "l30",
    text: "We moved everything to the cloud last year, and it's saved us a ton of money.",
    level: "B2",
    topic: "tech",
    note: "“a ton of” = a lot of",
  },
  {
    id: "l31",
    text: "If the server goes down, the backup should kick in automatically.",
    level: "C1",
    topic: "tech",
    note: "“kick in” = start working",
  },
  { id: "l32", text: "I was gonna say the same thing, actually.", level: "B1", topic: "daily" },
  {
    id: "l33",
    text: "It turned out way better than I expected.",
    level: "B1",
    topic: "daily",
    note: "“way better” = much better",
  },
  {
    id: "l34",
    text: "I could've sworn I left my keys on the table.",
    level: "C1",
    topic: "daily",
    note: "“could've” sounds like “coulda”",
  },
  { id: "l35", text: "Let me know if there's anything I can do to help out.", level: "B1", topic: "work" },
  {
    id: "l36",
    text: "We ran out of time, so let's pick this up tomorrow.",
    level: "B2",
    topic: "work",
    note: "“pick this up” = continue it",
  },
];

export function listeningById(id: string): ListeningItem | undefined {
  return LISTENING.find((l) => l.id === id);
}
