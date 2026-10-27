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
  {
    id: "r6-rest",
    title: "Why rest days make you stronger",
    level: "B1+",
    topic: "daily",
    setting: "A fitness podcast segment",
    lines: [
      {
        voice: "ryan",
        name: "Host",
        text: "Here's something that surprises a lot of people. You don't get stronger while you train. You get stronger while you recover.",
      },
      {
        voice: "ryan",
        name: "Host",
        text: "Training is the signal. It tells your body it needs to adapt. The actual building happens later, when you sleep, when you eat properly, and when you give a muscle a day or two before you hit it again.",
      },
      {
        voice: "ryan",
        name: "Host",
        text: "So if you train hard every single day and you feel weaker, not stronger, that's not a lack of discipline. It's a lack of recovery. Your body never gets the chance to catch up.",
      },
      {
        voice: "ryan",
        name: "Host",
        text: "A rest day doesn't have to mean the sofa, by the way. A walk, some stretching, an easy bike ride. Moving gently helps you recover faster than doing nothing at all.",
      },
      {
        voice: "ryan",
        name: "Host",
        text: "My rule of thumb: if you wake up tired three days in a row, take the hint. One easy day now beats two weeks off later. Train smart, rest on purpose, and you'll keep showing up for years.",
      },
    ],
    questions: [
      {
        q: "When do you actually get stronger, according to the host?",
        options: ["While you train", "While you recover", "Only when you lift heavy"],
        answer: 1,
        why: "“You don't get stronger while you train. You get stronger while you recover.”",
      },
      {
        q: "What does he suggest on a rest day?",
        options: ["Staying on the sofa all day", "Gentle movement like a walk or stretching", "A short, hard workout"],
        answer: 1,
        why: "“A walk, some stretching, an easy bike ride.”",
      },
      {
        q: "What's his rule of thumb?",
        options: [
          "Never take a day off",
          "Tired three mornings in a row means take an easy day",
          "Rest one week every month",
        ],
        answer: 1,
        why: "“If you wake up tired three days in a row, take the hint.”",
      },
    ],
    phrases: [
      { text: "catch up", meaningEn: "get back to where you should be", meaningHe: "להשלים פער" },
      { text: "rule of thumb", meaningEn: "a simple practical rule", meaningHe: "כלל אצבע" },
      { text: "take the hint", meaningEn: "understand a signal and act on it", meaningHe: "להבין את הרמז" },
      { text: "on purpose", meaningEn: "deliberately, not by accident", meaningHe: "בכוונה" },
    ],
  },
  {
    id: "r7-empathy",
    title: "Tactical empathy in two sentences",
    level: "B2",
    topic: "work",
    setting: "A podcast about negotiation",
    lines: [
      {
        voice: "guy",
        name: "Host",
        text: "Today, one tool from the world of hostage negotiation that works just as well with your boss, your landlord, or your kids. It's called labeling.",
      },
      {
        voice: "guy",
        name: "Host",
        text: 'Labeling means you put a name on what the other person is feeling. You start with "It seems like", "It sounds like", or "It looks like". For example: "It sounds like this deadline is putting you under a lot of pressure."',
      },
      {
        voice: "guy",
        name: "Host",
        text: 'Notice what\'s missing. You don\'t say "I understand", because people hear that as a way to end the conversation. And you don\'t say "I" at all. You keep the focus on them.',
      },
      {
        voice: "guy",
        name: "Host",
        text: "Then comes the hard part: you stop talking. Let the silence do its job. Most people will fill it by telling you what's really going on, and that's exactly the information you need.",
      },
      {
        voice: "guy",
        name: "Host",
        text: "Labeling doesn't mean you agree with them. It means you've heard them. And people who feel heard are far more willing to find a solution with you. Try it once this week and see what happens.",
      },
    ],
    questions: [
      {
        q: "How does a label usually start?",
        options: ['"I understand that…"', '"It sounds like…"', '"You should…"'],
        answer: 1,
        why: "“You start with “It seems like”, “It sounds like”, or “It looks like”.”",
      },
      {
        q: 'Why does the host avoid "I understand"?',
        options: [
          "It's too formal",
          "People hear it as a way to end the conversation",
          "It sounds like you agree with them",
        ],
        answer: 1,
        why: "“People hear that as a way to end the conversation.”",
      },
      {
        q: "What should you do right after a label?",
        options: ["Explain your side", "Stay quiet and let them talk", "Ask a yes-or-no question"],
        answer: 1,
        why: "“You stop talking. Let the silence do its job.”",
      },
    ],
    phrases: [
      { text: "under a lot of pressure", meaningEn: "very stressed by demands", meaningHe: "תחת הרבה לחץ" },
      { text: "do its job", meaningEn: "work as it should", meaningHe: "לעשות את שלו" },
      { text: "what's really going on", meaningEn: "the true situation", meaningHe: "מה באמת קורה" },
      { text: "feel heard", meaningEn: "feel that someone listened", meaningHe: "להרגיש שמקשיבים לך" },
    ],
  },
  {
    id: "r8-cloud",
    title: "What the cloud actually is",
    level: "B1+",
    topic: "tech",
    setting: "A tech explainer for beginners",
    lines: [
      {
        voice: "ava",
        name: "Host",
        text: "People talk about the cloud as if it's something in the sky. It isn't. The cloud is simply someone else's computers, in a huge building called a data center, that you rent over the internet.",
      },
      {
        voice: "ava",
        name: "Host",
        text: "Why rent instead of buy? Imagine a small online shop. Most days it gets a few hundred visitors, but on Black Friday it gets fifty thousand. Buying enough servers for that one day would be a waste of money for the rest of the year.",
      },
      {
        voice: "ava",
        name: "Host",
        text: "In the cloud, the shop can scale up for the busy day and scale back down the next morning. And it only pays for what it actually used. That's the big idea: pay as you go.",
      },
      {
        voice: "ava",
        name: "Host",
        text: "You'll also hear about three service models. With infrastructure as a service, you rent the machines and manage almost everything yourself. With platform as a service, the provider handles more of it. And with software as a service, like email in your browser, you just use the finished product.",
      },
      {
        voice: "ava",
        name: "Host",
        text: "One more term worth knowing is high availability. Your app runs in more than one place, so if one data center has a problem, the others keep it running. Users never notice, and that's the point.",
      },
    ],
    questions: [
      {
        q: "What is the cloud, in the host's words?",
        options: [
          "A new kind of internet",
          "Someone else's computers that you rent",
          "Free storage from your phone company",
        ],
        answer: 1,
        why: "“The cloud is simply someone else's computers… that you rent over the internet.”",
      },
      {
        q: "Why is the online shop a good example?",
        options: ["Its traffic jumps on one busy day", "It sells cloud services", "It never has many visitors"],
        answer: 0,
        why: "“Most days it gets a few hundred visitors, but on Black Friday it gets fifty thousand.”",
      },
      {
        q: "Which model is email in your browser?",
        options: ["Infrastructure as a service", "Platform as a service", "Software as a service"],
        answer: 2,
        why: "“With software as a service, like email in your browser, you just use the finished product.”",
      },
    ],
    phrases: [
      { text: "scale up", meaningEn: "add more capacity", meaningHe: "להגדיל משאבים" },
      { text: "pay as you go", meaningEn: "pay only for what you use", meaningHe: "לשלם לפי שימוש" },
      { text: "high availability", meaningEn: "keeps running even when one part fails", meaningHe: "זמינות גבוהה" },
      { text: "a waste of money", meaningEn: "money spent for nothing useful", meaningHe: "בזבוז כסף" },
    ],
  },
  {
    id: "r9-forgetting",
    title: "Why you forget new words, and how to stop",
    level: "B1+",
    topic: "daily",
    setting: "A short podcast about learning",
    lines: [
      {
        voice: "sonia",
        name: "Host",
        text: "Here's a frustrating fact. A day after you learn a new word, you've probably forgotten most of it. Psychologists call this the forgetting curve, and it's been known for over a hundred years.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "The good news is that every time you bring a word back from memory, the curve gets flatter. You forget it more slowly. So the second review might hold for three days, the third for two weeks.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "The key word is bring back. Rereading a list doesn't count for much, because your eyes do the work, not your memory. Covering the answer and trying to recall it is what makes it stick.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "And timing matters. Reviewing a word five times in one evening feels productive, but it's mostly wasted. One review just as you're about to forget it does far more.",
      },
      {
        voice: "sonia",
        name: "Host",
        text: "So, little and often, spread out over days, and always try before you look. Your memory isn't bad. It just needs to be asked at the right moment.",
      },
    ],
    questions: [
      {
        q: "What happens each time you recall a word?",
        options: ["You forget it faster", "You forget it more slowly", "Nothing changes"],
        answer: 1,
        why: "“Every time you bring a word back from memory, the curve gets flatter.”",
      },
      {
        q: "Why doesn't rereading a list help much?",
        options: ["Lists are too long", "Your eyes do the work, not your memory", "It takes too much time"],
        answer: 1,
        why: "“Rereading a list doesn't count for much, because your eyes do the work, not your memory.”",
      },
      {
        q: "When is the best time to review, according to the host?",
        options: ["Five times in one evening", "Only before a test", "Just as you're about to forget it"],
        answer: 2,
        why: "“One review just as you're about to forget it does far more.”",
      },
    ],
    phrases: [
      { text: "bring back", meaningEn: "make something return, here: from memory", meaningHe: "להחזיר, לשלוף" },
      { text: "make it stick", meaningEn: "make it stay in your memory", meaningHe: "לגרום לזה להיקלט" },
      { text: "little and often", meaningEn: "small amounts many times", meaningHe: "מעט ובתדירות גבוהה" },
      { text: "at the right moment", meaningEn: "at exactly the best time", meaningHe: "ברגע הנכון" },
    ],
  },
  {
    id: "r10-no-notes",
    title: "Two minutes without notes",
    level: "B2",
    topic: "work",
    setting: "A podcast about speaking at work",
    lines: [
      {
        voice: "william",
        name: "Host",
        text: "Someone asks you to say a few words about your project, right now, no slides. Most people panic and either freeze or ramble. Here's a simple structure that gets you through two minutes calmly.",
      },
      {
        voice: "william",
        name: "Host",
        text: "Point, reason, example, point. Start with your main point in one sentence: our project cuts the time it takes to answer customers. Then give the reason it matters: customers were waiting days.",
      },
      {
        voice: "william",
        name: "Host",
        text: "Next, one concrete example. Not five, one. Last month a customer got an answer in an hour instead of three days, and she wrote to thank us. A single story sticks better than a list of numbers.",
      },
      {
        voice: "william",
        name: "Host",
        text: "Finally, repeat your point in different words and stop. So, faster answers, happier customers. Then stop talking. The silence after a clear ending sounds confident, not awkward.",
      },
      {
        voice: "william",
        name: "Host",
        text: "Practice it a few times with any topic, your weekend, a book, a tool you use. After a while you won't need to think about the structure at all.",
      },
    ],
    questions: [
      {
        q: "What's the structure the host suggests?",
        options: ["Point, reason, example, point", "Joke, story, question", "Problem, numbers, thanks"],
        answer: 0,
        why: "“Point, reason, example, point.”",
      },
      {
        q: "Why one example instead of several?",
        options: ["It saves time for questions", "A single story sticks better", "Examples are risky"],
        answer: 1,
        why: "“A single story sticks better than a list of numbers.”",
      },
      {
        q: "What should you do after repeating your point?",
        options: ["Ask if there are questions", "Add one more example", "Stop talking"],
        answer: 2,
        why: "“Then stop talking. The silence after a clear ending sounds confident.”",
      },
    ],
    phrases: [
      { text: "say a few words", meaningEn: "give a very short talk", meaningHe: "לומר כמה מילים" },
      { text: "ramble", meaningEn: "talk for a long time without a clear point", meaningHe: "לקשקש בלי סוף" },
      { text: "gets you through", meaningEn: "helps you manage a difficult situation", meaningHe: "מעביר אותך את זה" },
      { text: "sticks better", meaningEn: "is remembered more easily", meaningHe: "נזכר טוב יותר" },
    ],
  },
];
