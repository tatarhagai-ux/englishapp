/**
 * Topic cards for the one-minute talk (the long turn in IELTS-style speaking practice):
 * one topic, three points to cover, about a minute without stopping. It trains what short
 * conversation turns don't: holding the floor, linking ideas and finishing the whole answer.
 */

export interface TalkTopic {
  id: string;
  title: string;
  points: [string, string, string];
}

function t(id: string, title: string, a: string, b: string, c: string): TalkTopic {
  return { id, title, points: [a, b, c] };
}

export const TALK_TOPICS: readonly TalkTopic[] = [
  t(
    "t-day",
    "A normal day for you right now",
    "what you do in the morning",
    "the busiest part of the day",
    "one thing you'd change",
  ),
  t(
    "t-skill",
    "A skill you've been learning",
    "what it is and how long you've been at it",
    "how you practice",
    "what's been hardest",
  ),
  t("t-book", "A book that changed how you think", "what it's about", "one idea from it", "how you use that idea"),
  t("t-app", "An app you use every day", "what it does", "why you like it", "one thing that annoys you about it"),
  t("t-trip", "A trip you'd love to take", "where and why", "what you'd do there", "who you'd go with"),
  t(
    "t-fitness",
    "Your training routine",
    "what you do and how often",
    "how you stay motivated",
    "a goal you're working toward",
  ),
  t(
    "t-money",
    "How you think about money",
    "saving or spending, which comes easier",
    "one money habit you have",
    "a goal for the next few years",
  ),
  t("t-ai", "AI in everyday life", "how you use it", "what it's good and bad at", "how it might change work"),
  t("t-person", "Someone you look up to", "who they are", "what they did", "what you learned from them"),
  t("t-challenge", "A challenge you handled well", "what happened", "what you did", "how it turned out"),
  t("t-place", "Your favorite place to relax", "where it is", "what you do there", "why it works for you"),
  t(
    "t-army",
    "What the army has taught you",
    "your role in simple words",
    "a skill you've built",
    "how you'd use it later",
  ),
  t("t-food", "A meal you'd recommend", "what it is", "where to get it or how to make it", "why it's special"),
  t("t-habit", "A habit you'd like to build", "what it is", "why it matters to you", "what's stopping you"),
  t("t-future", "Where you see yourself in five years", "work", "where you'd live", "one thing you want to have done"),
  t(
    "t-movie",
    "A show or film you enjoyed",
    "what it's about, no spoilers",
    "what made it good",
    "who should watch it",
  ),
  t(
    "t-city",
    "The city or town you live in",
    "what it's like",
    "the best and worst thing about it",
    "would you stay there",
  ),
  t(
    "t-learning",
    "The best way to learn a language",
    "what works for you",
    "what doesn't",
    "your advice to a beginner",
  ),
  t("t-phone", "Phones and attention", "how much you use yours", "the good side", "one rule you'd like to keep"),
  t("t-weekend", "A great weekend you had", "where you were", "what you did", "what made it great"),
  t("t-job", "Your dream job", "what it is", "why it fits you", "what you'd need to get there"),
  t("t-advice", "The best advice you've been given", "who gave it", "what it was", "when it helped you"),
  t(
    "t-news",
    "A piece of news you followed lately",
    "what happened",
    "why it caught your attention",
    "what you think about it",
  ),
  t("t-team", "Working in a team", "a team you've been part of", "what made it work or not", "your role in it"),
  t("t-mistake", "A mistake you learned from", "what happened", "what you did next", "what you'd do differently"),
  t(
    "t-invest",
    "Investing for the long term",
    "how you started",
    "what you invest in and why",
    "your advice to a friend",
  ),
  t("t-home", "Where you grew up", "what it was like", "what you miss", "how it has changed"),
  t(
    "t-tech",
    "A piece of tech you couldn't live without",
    "what it is",
    "how you use it",
    "what life was like before it",
  ),
  t("t-decision", "A hard decision you made", "what the options were", "how you decided", "how it turned out"),
  t("t-family", "A family tradition", "what it is", "when it happens", "why it matters to you"),
  t(
    "t-health",
    "Getting back to full strength",
    "where you started",
    "what helped most",
    "what you'd tell someone in the same place",
  ),
  t(
    "t-remote",
    "Working from home or the office",
    "which you prefer",
    "the good and the bad",
    "what the ideal week would look like",
  ),
  t(
    "t-podcast",
    "A podcast or channel you follow",
    "what it's about",
    "why you keep coming back",
    "one thing you learned from it",
  ),
  t("t-business", "A business idea you once had", "what it was", "who it was for", "why you did or didn't go for it"),
  t(
    "t-shabbat",
    "How you spend Shabbat or a day off",
    "what you usually do",
    "who you spend it with",
    "why that time matters",
  ),
  t("t-goal", "A goal for this year", "what it is", "why it matters now", "the first step you've taken"),
];

export function topicById(id: string): TalkTopic | undefined {
  return TALK_TOPICS.find((x) => x.id === id);
}

/** The tutor's first line for a topic: the card, read out. */
export function topicOpener(topic: TalkTopic): string {
  return `Your topic: ${topic.title}. Try to cover ${topic.points[0]}, ${topic.points[1]}, and ${topic.points[2]}. Take a few seconds, then talk for about a minute.`;
}
