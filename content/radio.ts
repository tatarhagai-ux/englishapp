/**
 * Radio: two- to three-minute talks by one host on things Hagai cares about, the kind of
 * longer listening a podcast gives. Same player as the stories (words hidden until the
 * questions are answered), one voice, longer stretches of speech to follow.
 */
import type { Story } from "./stories";

export const RADIO: readonly Story[] = [
  {
    id: "r1-ai-assistant",
    title: "Your AI assistant is a junior colleague",
    level: "B2",
    topic: "tech",
    setting: "A short tech podcast segment",
    lines: [
      {
        voice: "andrew",
        name: "Host",
        text: "Welcome back. Today I want to share one idea that changed how I use AI tools at work. Stop thinking of the AI as a search engine, and start thinking of it as a junior colleague.",
      },
      {
        voice: "andrew",
        name: "Host",
        text: 'A junior colleague is fast, eager, and honestly pretty smart. But they don\'t know your company, your customers, or what you actually mean when you say "make it better". So you have to give them context.',
      },
      {
        voice: "andrew",
        name: "Host",
        text: 'Instead of typing "write an email to a client", try this: who the client is, what happened, what you want them to do, and the tone you want. Thirty extra seconds of instructions can save you ten minutes of editing.',
      },
      {
        voice: "andrew",
        name: "Host",
        text: "And just like with a new colleague, you check their work. Not because they're bad, but because you're the one responsible. If a number looks too good, it probably is.",
      },
      {
        voice: "andrew",
        name: "Host",
        text: "Last thing. When it does a great job, save the instructions you gave it. Over time you'll build a little library of prompts that work, and that's where the real time savings come from. See you next week.",
      },
    ],
    questions: [
      {
        q: "What's the host's main idea?",
        options: ["AI is dangerous at work", "Treat the AI like a junior colleague", "Never use AI for emails"],
        answer: 1,
        why: "“Start thinking of it as a junior colleague.”",
      },
      {
        q: "What does he say to include in instructions?",
        options: [
          "Only the topic",
          "Who it's for, what happened, what you want, and the tone",
          "As few words as possible",
        ],
        answer: 1,
        why: "“Who the client is, what happened, what you want them to do, and the tone you want.”",
      },
      {
        q: "Where do the biggest time savings come from, according to him?",
        options: ["Typing faster", "A saved library of prompts that work", "Using several AI tools at once"],
        answer: 1,
        why: "“You'll build a little library of prompts that work, and that's where the real time savings come from.”",
      },
    ],
    phrases: [
      { text: "give them context", meaningEn: "explain the background they need", meaningHe: "לתת להם הקשר" },
      { text: "looks too good", meaningEn: "seems better than is likely to be real", meaningHe: "נראה טוב מדי" },
      { text: "time savings", meaningEn: "time you don't have to spend", meaningHe: "חיסכון בזמן" },
    ],
  },
  {
    id: "r2-language",
    title: "Why you understand more than you can say",
    level: "B1+",
    topic: "daily",
    setting: "A language learning podcast",
    lines: [
      {
        voice: "sonia",
        name: "Host",
        text: "Here's something almost every language learner feels. You watch a series in English and you understand nearly everything. Then someone asks you a simple question, and suddenly the words just aren't there.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "That's completely normal. Understanding and speaking are two different skills. When you listen, you only need to recognise words. When you speak, you have to find them, put them in order and say them, all in real time.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "The good news is that the gap closes with practice, but only the right kind. Reading and listening help a lot, but they don't train the speaking muscle. You have to actually open your mouth.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "Try this for a week: ten minutes a day of speaking out loud. Talk to an app, describe your day to yourself, or repeat sentences you hear. It feels strange at first, but most people notice a difference within a few weeks.",
      },
    ],
    questions: [
      {
        q: "Why is speaking harder than understanding?",
        options: [
          "You need to find words, order them and say them in real time",
          "Native speakers talk too fast",
          "Grammar is harder when you speak",
        ],
        answer: 0,
        why: "“When you speak, you have to find them, put them in order and say them, all in real time.”",
      },
      {
        q: "What doesn't train the speaking muscle, according to the host?",
        options: ["Talking to an app", "Reading and listening", "Repeating sentences"],
        answer: 1,
        why: "“Reading and listening help a lot, but they don't train the speaking muscle.”",
      },
      {
        q: "What does she suggest?",
        options: ["A week-long course abroad", "Ten minutes of speaking out loud every day", "Watching more series"],
        answer: 1,
        why: "“Ten minutes a day of speaking out loud.”",
      },
    ],
    phrases: [
      { text: "the words just aren't there", meaningEn: "you can't find the words", meaningHe: "המילים פשוט לא באות" },
      { text: "closes with practice", meaningEn: "gets smaller when you practice", meaningHe: "מצטמצם עם תרגול" },
      { text: "notice a difference", meaningEn: "see that something has changed", meaningHe: "להרגיש הבדל" },
    ],
  },
  {
    id: "r3-money",
    title: "The boring secret of long-term investing",
    level: "B2",
    topic: "daily",
    setting: "A personal finance radio show",
    lines: [
      {
        voice: "william",
        name: "Host",
        text: "G'day and welcome. Today's topic sounds boring, and that's exactly the point. The most reliable way to build wealth over fifteen or twenty years is, honestly, pretty dull.",
      },
      {
        voice: "william",
        name: "Host",
        text: "You pick a low-cost index fund, you put in a fixed amount every month, and you leave it alone. No checking the app ten times a day, no chasing the stock everyone's talking about.",
      },
      {
        voice: "william",
        name: "Host",
        text: "Why does it work? Two reasons. First, you're buying a tiny piece of hundreds of companies, so one bad company won't sink you. Second, time does the heavy lifting through compound growth.",
      },
      {
        voice: "william",
        name: "Host",
        text: "The hardest part is emotional. When the market drops twenty percent, every part of you wants to sell. But the people who stay in usually end up far ahead of the people who jump in and out.",
      },
      {
        voice: "william",
        name: "Host",
        text: "So if your plan feels a bit boring, that might be a good sign. Just keep an eye on the fees, and let the years do their thing.",
      },
    ],
    questions: [
      {
        q: "What's the host's main message?",
        options: [
          "Pick exciting stocks to grow fast",
          "A simple, steady plan usually works best over many years",
          "Investing is too risky for young people",
        ],
        answer: 1,
        why: "“The most reliable way to build wealth… is, honestly, pretty dull.”",
      },
      {
        q: "What does “time does the heavy lifting” mean here?",
        options: ["You need to work longer hours", "Growth over many years does most of the work", "Markets are slow"],
        answer: 1,
        why: "Compound growth over time builds most of the result.",
      },
      {
        q: "What's the hardest part, according to him?",
        options: ["Choosing a fund", "Staying in when the market drops", "Opening an account"],
        answer: 1,
        why: "“The hardest part is emotional. When the market drops… every part of you wants to sell.”",
      },
    ],
    phrases: [
      { text: "leave it alone", meaningEn: "don't touch or change it", meaningHe: "לא לגעת בזה" },
      { text: "do the heavy lifting", meaningEn: "do the hardest part of the work", meaningHe: "לעשות את העבודה הקשה" },
      { text: "end up far ahead", meaningEn: "finish in a much better position", meaningHe: "לסיים הרבה לפני" },
    ],
  },
  {
    id: "r4-interview",
    title: "Three mistakes in job interviews",
    level: "B1+",
    topic: "interview",
    setting: "A careers podcast",
    lines: [
      {
        voice: "jenny",
        name: "Host",
        text: "Hi everyone. I've interviewed hundreds of candidates, and the same three mistakes come up again and again. The good news? They're all easy to fix.",
      },
      {
        voice: "jenny",
        name: "Host",
        text: "Mistake number one: answering a different question. If I ask about a time you failed, don't tell me about your strengths. Answer the actual question first, in one sentence, then add the details.",
      },
      {
        voice: "jenny",
        name: "Host",
        text: 'Mistake number two: saying "we" all the time. I know you worked in a team, but I\'m hiring you. Tell me what you did. "I organised the schedule" is much stronger than "we did a project".',
      },
      {
        voice: "jenny",
        name: "Host",
        text: "And mistake number three: no result. Every story needs an ending. What happened in the end? A number, a lesson, anything. Without it, a good story just stops in the middle.",
      },
      {
        voice: "jenny",
        name: "Host",
        text: "Fix those three, and you'll already sound better prepared than most people I meet. Good luck out there.",
      },
    ],
    questions: [
      {
        q: "What should you do first when you answer?",
        options: ["Talk about your strengths", "Answer the actual question in one sentence", "Ask a question back"],
        answer: 1,
        why: "“Answer the actual question first, in one sentence, then add the details.”",
      },
      {
        q: "Why is saying “we” a problem?",
        options: ["It sounds too informal", "The interviewer wants to know what you did", "Teams are not important"],
        answer: 1,
        why: "“I'm hiring you. Tell me what you did.”",
      },
      {
        q: "What does every story need?",
        options: ["A funny moment", "A result at the end", "A famous company"],
        answer: 1,
        why: "“Every story needs an ending… A number, a lesson, anything.”",
      },
    ],
    phrases: [
      { text: "come up again and again", meaningEn: "happen many times", meaningHe: "חוזרים שוב ושוב" },
      { text: "the actual question", meaningEn: "the real question that was asked", meaningHe: "השאלה עצמה" },
      { text: "better prepared", meaningEn: "more ready", meaningHe: "מוכן יותר" },
    ],
  },
  {
    id: "r5-habits",
    title: "The two-minute rule for new habits",
    level: "B1",
    topic: "daily",
    setting: "A short self-improvement podcast",
    lines: [
      {
        voice: "prabhat",
        name: "Host",
        text: "Hello and welcome. Today, one small trick for building any new habit. It's called the two-minute rule.",
      },
      {
        voice: "prabhat",
        name: "Host",
        text: 'The idea is simple. When you start a new habit, make it so small that it takes less than two minutes. Not "run five kilometres", but "put on your running shoes". Not "learn English", but "say one sentence out loud".',
      },
      {
        voice: "prabhat",
        name: "Host",
        text: "It sounds too easy, and that's why it works. The hardest part of any habit is starting. Once your shoes are on, you'll usually go for the run anyway.",
      },
      {
        voice: "prabhat",
        name: "Host",
        text: "After a few weeks, the habit becomes part of your day, and then you can make it bigger. But first, just show up. Two minutes. That's it. See you tomorrow.",
      },
    ],
    questions: [
      {
        q: "What is the two-minute rule?",
        options: [
          "Practice for exactly two minutes, never more",
          "Start a new habit so small it takes under two minutes",
          "Rest two minutes between tasks",
        ],
        answer: 1,
        why: "“Make it so small that it takes less than two minutes.”",
      },
      {
        q: "Why does it work, according to the host?",
        options: ["The hardest part is starting", "Two minutes is enough to learn", "It's scientifically proven"],
        answer: 0,
        why: "“The hardest part of any habit is starting.”",
      },
      {
        q: "What happens after a few weeks?",
        options: ["You stop the habit", "You can make the habit bigger", "You need a new rule"],
        answer: 1,
        why: "“After a few weeks… then you can make it bigger.”",
      },
    ],
    phrases: [
      { text: "That's it.", meaningEn: "nothing more is needed", meaningHe: "זהו" },
      { text: "show up", meaningEn: "be there, do it", meaningHe: "להופיע, להתייצב" },
      { text: "anyway", meaningEn: "even so, in any case", meaningHe: "בכל מקרה" },
    ],
  },
];
