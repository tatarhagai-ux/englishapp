/**
 * Short reads (about 150 words) on his interests, a little above his level. Marked phrases
 * open their meaning and Hebrew on tap and can go to the word cards; two questions at the
 * end check understanding. Reading natural English with help on tap is how LingQ-style
 * learning grows vocabulary, and the saved chunks come back in conversations.
 */

export interface ReadingGloss {
  /** Exactly as it appears in the text (first occurrence is marked). */
  text: string;
  meaningEn: string;
  meaningHe: string;
}

export interface Reading {
  id: string;
  title: string;
  level: "B1+" | "B2";
  minutes: number;
  paragraphs: string[];
  glossary: ReadingGloss[];
  questions: { q: string; options: [string, string, string]; answer: 0 | 1 | 2 }[];
}

function g(text: string, meaningEn: string, meaningHe: string): ReadingGloss {
  return { text, meaningEn, meaningHe };
}

export const READINGS: readonly Reading[] = [
  {
    id: "r-habits",
    title: "Why small habits beat big plans",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "Most people start the new year with big plans. They want to run every day, read fifty books and learn a language. By February, most of those plans have fallen apart.",
      "The problem usually isn't motivation. It's that big plans depend on how you feel, and feelings change. Small habits work differently. Ten minutes of practice is easy to fit into a busy day, even when you're tired.",
      "The trick is to tie the new habit to something you already do. For example, you might review five words right after your morning coffee. After a few weeks, it stops being a decision and becomes part of your routine.",
      "Progress feels slow at first, but it adds up. Ten minutes a day is more than sixty hours a year.",
    ],
    glossary: [
      g("fallen apart", "failed, stopped working", "התפרקו, נכשלו"),
      g("depend on", "change according to", "תלויות ב"),
      g("fit into", "find time for", "לשלב בתוך"),
      g("The trick is", "the clever way to do it is", "הטריק הוא"),
      g("tie the new habit to", "connect the new habit with", "לקשור את ההרגל החדש ל"),
      g("adds up", "grows into a large amount over time", "מצטבר"),
    ],
    questions: [
      {
        q: "Why do big plans often fail, according to the text?",
        options: ["People are lazy", "They depend on how you feel", "They are too expensive"],
        answer: 1,
      },
      {
        q: "What does the writer suggest?",
        options: [
          "Connect a new habit to something you already do",
          "Practice for two hours on weekends",
          "Wait until you feel motivated",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: "r-index",
    title: "Index funds in plain English",
    level: "B2",
    minutes: 2,
    paragraphs: [
      "An index fund doesn't try to pick the winning companies. Instead, it buys a little of every company in a market index, like the S&P 500 or the Nasdaq 100.",
      "That sounds boring, and in a way it is. But over long periods, most professional investors fail to beat the index, especially once their fees are taken into account.",
      "Because the fund simply follows the index, it's cheap to run. Lower fees mean more of the returns stay in your pocket, and over fifteen or twenty years that difference can be huge thanks to compound interest.",
      "The hard part isn't choosing the fund. It's sticking with it when the market drops and the news is full of panic.",
    ],
    glossary: [
      g("pick the winning companies", "choose the companies that will do best", "לבחור את החברות המנצחות"),
      g("in a way", "partly, from one point of view", "במובן מסוים"),
      g("beat the index", "do better than the market average", "להכות את המדד"),
      g("taken into account", "included when you think about it", "מובאים בחשבון"),
      g("stay in your pocket", "remain yours", "נשארים בכיס שלך"),
      g("sticking with it", "continuing even when it's hard", "להישאר עם זה, להתמיד"),
    ],
    questions: [
      {
        q: "What does an index fund do?",
        options: ["Picks the best companies", "Buys a little of every company in an index", "Only buys tech stocks"],
        answer: 1,
      },
      {
        q: "What's the hard part, according to the writer?",
        options: ["Choosing the right fund", "Staying invested when the market falls", "Paying the fees"],
        answer: 1,
      },
    ],
  },
  {
    id: "r-ai-work",
    title: "AI at work: a tool, not a replacement",
    level: "B2",
    minutes: 2,
    paragraphs: [
      "A few years ago, many people worried that AI would take their jobs. So far, what has mostly happened is different: people who know how to use AI are getting more done than people who don't.",
      "AI is very good at first drafts, summaries and repetitive tasks. It's much less reliable when it comes to facts, judgment and anything that needs real context about a business or a person.",
      "That's why the most useful skill right now isn't coding. It's knowing what to ask for, checking the answer, and deciding what to do with it.",
      "In other words, AI raises the bar. The basic work gets easier, so what makes you stand out is how well you think.",
    ],
    glossary: [
      g("take their jobs", "replace them at work", "לקחת להם את העבודה"),
      g("getting more done", "finishing more work", "מספיקים יותר"),
      g("first drafts", "early versions of a text", "טיוטות ראשונות"),
      g("when it comes to", "regarding, about", "כשזה מגיע ל"),
      g("raises the bar", "makes the standard higher", "מעלה את הרף"),
      g("stand out", "be noticeably better than others", "לבלוט"),
    ],
    questions: [
      {
        q: "What has mostly happened so far, according to the text?",
        options: ["AI replaced most office jobs", "People who use AI well get more done", "Companies stopped using AI"],
        answer: 1,
      },
      {
        q: "What is AI less reliable at?",
        options: ["Summaries", "Facts and judgment", "First drafts"],
        answer: 1,
      },
    ],
  },
  {
    id: "r-voss",
    title: "Never split the difference: the main idea",
    level: "B2",
    minutes: 2,
    paragraphs: [
      "Chris Voss spent years as the FBI's lead hostage negotiator. His book argues that negotiation isn't a logical debate. People make decisions based on emotion, and then explain them with logic.",
      "So instead of pushing harder, Voss suggests slowing down and listening. Repeat the last few words someone said, a trick called mirroring, and they'll usually keep talking and tell you more.",
      'Another tool is labeling: naming what the other person feels, like "It sounds like you\'re under a lot of pressure." It shows you understand, and it often calms things down.',
      "His goal isn't to get the other side to say \"you're right\". It's to hear them say \"that's right\", because that's when they feel truly understood.",
    ],
    glossary: [
      g("hostage negotiator", "a person who talks to criminals to free people", "מנהל משא ומתן על בני ערובה"),
      g("based on", "coming from", "על סמך"),
      g("pushing harder", "trying to force a result", "ללחוץ חזק יותר"),
      g("keep talking", "continue to talk", "להמשיך לדבר"),
      g("under a lot of pressure", "very stressed", "תחת הרבה לחץ"),
      g("calms things down", "makes the situation less tense", "מרגיע את המצב"),
    ],
    questions: [
      {
        q: "How do people make decisions, according to Voss?",
        options: ["Logically, step by step", "With emotion first, then logic", "By asking friends"],
        answer: 1,
      },
      {
        q: "What is mirroring?",
        options: [
          "Copying someone's body language",
          "Repeating the last few words they said",
          "Agreeing with everything",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "r-sleep",
    title: "Sleep: the training nobody talks about",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "If you work out hard but sleep five hours a night, you're leaving a lot on the table. Muscles don't grow during the workout. They grow while you recover, and most of that happens during sleep.",
      "Sleep also affects your mood, your focus and even how hungry you feel. After a bad night, people tend to eat more sugar and skip training.",
      "You don't need a perfect routine. Going to bed at roughly the same time, keeping your phone out of the bedroom and cutting down on coffee after lunch already make a big difference.",
      "Think of sleep as part of your training plan, not the time you have left over after everything else.",
    ],
    glossary: [
      g("leaving a lot on the table", "missing a big benefit", "מפסיד הרבה"),
      g("while you recover", "while your body rests and repairs", "בזמן שאתה מתאושש"),
      g("tend to", "usually do", "נוטים ל"),
      g("skip training", "not go to training", "לדלג על אימון"),
      g("roughly the same time", "about the same time", "בערך באותה שעה"),
      g("left over", "remaining", "שנשאר"),
    ],
    questions: [
      {
        q: "When do muscles grow, according to the text?",
        options: ["During the workout", "While you recover, mostly during sleep", "After eating sugar"],
        answer: 1,
      },
      {
        q: "Which tip is in the text?",
        options: ["Drink coffee before bed", "Keep your phone out of the bedroom", "Sleep only on weekends"],
        answer: 1,
      },
    ],
  },
  {
    id: "r-abroad",
    title: "Your first week living abroad",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "The first week in a new country is exciting and exhausting at the same time. Everything takes longer: buying a SIM card, opening a bank account, even finding the right bus.",
      "It helps to sort out the basics early. Get a local phone number, learn how public transport works and find a supermarket close to home. Small wins make the place feel less foreign.",
      "Don't be shy about asking for help. Most people are happy to explain, especially if you start with \"Sorry, I'm new here.\"",
      "And expect a dip. Around the second or third week, many people feel homesick. It's normal, and it usually passes once you build a routine and meet a few people.",
    ],
    glossary: [
      g("at the same time", "together, both", "בו זמנית"),
      g("sort out the basics", "arrange the most important things", "לסדר את הבסיס"),
      g("Small wins", "little successes", "הצלחות קטנות"),
      g("Don't be shy about", "don't be afraid of", "אל תתבייש ב"),
      g("expect a dip", "be ready for a low moment", "תצפה לירידה"),
      g("homesick", "missing home", "מתגעגע הביתה"),
    ],
    questions: [
      {
        q: "What does the writer recommend doing early?",
        options: ["Traveling around the country", "Sorting out phone, transport and shopping", "Finding a job"],
        answer: 1,
      },
      {
        q: "What often happens around the second or third week?",
        options: ["People feel homesick", "People go back home", "People stop asking for help"],
        answer: 0,
      },
    ],
  },
  {
    id: "r-cloud",
    title: 'What "the cloud" actually means',
    level: "B2",
    minutes: 2,
    paragraphs: [
      "When people say a file is \"in the cloud\", it isn't floating anywhere. It's sitting on a computer in a huge data center owned by a company like Microsoft, Amazon or Google.",
      "The big change is that you rent that computing power instead of buying it. A small startup can spin up a hundred servers for an afternoon, pay for those few hours and shut them down again. Twenty years ago, that would have meant buying expensive hardware up front.",
      "Cloud providers also spread their data centers across regions, so if one building loses power, your app keeps running somewhere else. That's what people mean by high availability.",
      "The catch is that you don't control the hardware, and costs can quietly add up if nobody keeps an eye on them. That's why companies now hire people just to manage their cloud bills.",
    ],
    glossary: [
      g("sitting on", "stored on", "יושב על, מאוחסן ב"),
      g("spin up", "create and start quickly", "להרים, להפעיל"),
      g("shut them down", "turn them off", "לכבות אותם"),
      g("up front", "at the start, before using it", "מראש"),
      g("The catch is", "the hidden problem is", "המלכוד הוא"),
      g("keeps an eye on", "watches carefully", "שם עין על"),
    ],
    questions: [
      {
        q: "What's the big change the cloud brought, according to the text?",
        options: ["Files float in the air", "You rent computing power instead of buying it", "Computers got smaller"],
        answer: 1,
      },
      {
        q: "What's a risk mentioned at the end?",
        options: ["Costs can grow without anyone noticing", "Data centers are slow", "Only big companies can use it"],
        answer: 0,
      },
    ],
  },
  {
    id: "r-feedback",
    title: "How to take feedback without getting defensive",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "Nobody enjoys hearing what they did wrong. When a manager gives us feedback, our first reaction is often to explain ourselves, or to point out what someone else did.",
      "The problem is that the other person stops listening, and next time they might not bother telling you at all. Feedback is free information about how others see your work.",
      'A simple habit helps: before you answer, say "Thanks, that\'s useful." Then ask one question to make sure you understood, like "Can you give me an example?"',
      "You don't have to agree with everything. But if you take a day to think about it, you'll usually find at least one thing worth changing.",
    ],
    glossary: [
      g("explain ourselves", "give reasons for what we did", "להסביר את עצמנו"),
      g("point out", "mention, draw attention to", "להצביע על"),
      g("might not bother", "might not make the effort", "אולי לא יטרחו"),
      g("make sure", "check that something is true", "לוודא"),
      g("worth changing", "good enough to change", "ששווה לשנות"),
    ],
    questions: [
      {
        q: "Why is getting defensive a problem?",
        options: ["It makes you look tired", "People may stop giving you feedback", "It's against company rules"],
        answer: 1,
      },
      {
        q: "What's the first thing the writer suggests saying?",
        options: ['"That\'s not my fault"', '"Thanks, that\'s useful"', '"I disagree"'],
        answer: 1,
      },
    ],
  },
  {
    id: "r-lisbon",
    title: "48 hours in Lisbon",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "Lisbon is one of the easiest cities in Europe to visit for a short break. It's compact, the food is great, and most people in the center speak good English.",
      "Start in Alfama, the oldest neighborhood, and just get lost in the narrow streets. Then take the famous yellow tram 28 up the hills. It gets packed by ten, so go early.",
      "In the evening, head to the riverside for sunset. Locals grab a drink at one of the kiosks and sit on the steps. It's cheap and it's where the city feels most alive.",
      "One tip: wear comfortable shoes. Lisbon is built on seven hills, and those beautiful stone streets are slippery when it rains.",
    ],
    glossary: [
      g("a short break", "a short holiday", "חופשה קצרה"),
      g("get lost", "walk without a plan", "ללכת לאיבוד, לשוטט"),
      g("gets packed", "becomes very crowded", "מתמלא לגמרי"),
      g("head to", "go toward", "ללכת לכיוון"),
      g("grab a drink", "get a quick drink", "לשתות משהו"),
      g("slippery", "easy to slip on", "חלקלק"),
    ],
    questions: [
      {
        q: "Why should you take tram 28 early?",
        options: ["It's cheaper in the morning", "It gets very crowded later", "It stops at noon"],
        answer: 1,
      },
      {
        q: "What's the practical tip at the end?",
        options: ["Book restaurants early", "Wear comfortable shoes", "Learn some Portuguese"],
        answer: 1,
      },
    ],
  },
  {
    id: "r-focus",
    title: "Your phone and your focus",
    level: "B2",
    minutes: 2,
    paragraphs: [
      "Most of us check our phones dozens of times a day, often without noticing. Each check only takes a few seconds, but getting back into deep focus can take much longer.",
      "Researchers call this the cost of switching. Your brain needs time to reload what you were working on, so a day full of small interruptions ends up feeling busy but unproductive.",
      "You don't need to throw your phone away. Small changes go a long way: turn off notifications you don't need, keep the phone in another room for one focused hour, and check messages at set times.",
      "It feels uncomfortable for the first few days. After that, many people find they get more done before lunch than they used to in a whole day.",
    ],
    glossary: [
      g("without noticing", "without being aware of it", "בלי לשים לב"),
      g("getting back into", "returning to", "לחזור ל"),
      g("ends up feeling", "finally feels", "בסוף מרגיש"),
      g("go a long way", "make a big difference", "עושים הבדל גדול"),
      g("at set times", "at fixed, planned times", "בשעות קבועות"),
      g("get more done", "finish more work", "להספיק יותר"),
    ],
    questions: [
      {
        q: 'What is "the cost of switching"?',
        options: [
          "The price of a new phone",
          "The time your brain needs to refocus after an interruption",
          "The cost of mobile data",
        ],
        answer: 1,
      },
      {
        q: "What does the writer suggest?",
        options: [
          "Throwing the phone away",
          "Small changes like fewer notifications and set times",
          "Working only at night",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "r-interview-story",
    title: "Tell a story, not a list",
    level: "B2",
    minutes: 2,
    paragraphs: [
      'When an interviewer asks "Tell me about a time you handled a difficult situation", many candidates answer with a list of qualities: hardworking, calm, a team player. The interviewer has heard that a thousand times.',
      "What sticks is a story. Set the scene in one sentence, explain what was at stake, say what you did, and finish with the result. That's the STAR method in plain words.",
      "Keep it short. Two minutes is plenty. If the interviewer wants more detail, they'll ask, and a follow-up question is a good sign.",
      "And practice out loud. A story that sounds great in your head often comes out messy the first time. By the third time, it flows.",
    ],
    glossary: [
      g("What sticks", "what people remember", "מה שנשאר בזיכרון"),
      g("Set the scene", "describe the situation briefly", "לתאר את הרקע"),
      g("at stake", "at risk, what could be lost", "על הכף"),
      g("plenty", "more than enough", "די והותר"),
      g("comes out messy", "sounds confused when you say it", "יוצא מבולגן"),
      g("it flows", "it sounds smooth and natural", "זה זורם"),
    ],
    questions: [
      {
        q: "What do many candidates do wrong?",
        options: [
          "They talk too fast",
          "They list qualities instead of telling a story",
          "They ask too many questions",
        ],
        answer: 1,
      },
      {
        q: "How long should the story be, according to the text?",
        options: ["About two minutes", "At least five minutes", "One sentence"],
        answer: 0,
      },
    ],
  },
  {
    id: "r-protein",
    title: "Protein, without the hype",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "Walk into any gym and you'll hear people talking about protein. Some drink three shakes a day. Others eat chicken with every meal. So how much do you really need?",
      "For most people who train regularly, a good rule of thumb is about 1.6 grams per kilo of body weight per day. More than that usually doesn't build extra muscle.",
      "Shakes are convenient, but they aren't magic. Eggs, yogurt, beans, fish and chicken all do the job, and they come with other nutrients your body needs.",
      "The bigger factors are still the boring ones: training consistently, sleeping enough and eating enough overall. Protein helps, but it can't make up for skipping the gym.",
    ],
    glossary: [
      g("aren't magic", "don't solve everything by themselves", "הם לא קסם"),
      g("a good rule of thumb", "a simple practical guideline", "כלל אצבע טוב"),
      g("convenient", "easy and quick to use", "נוח"),
      g("do the job", "work well enough", "עושים את העבודה"),
      g("make up for", "replace something missing", "לפצות על"),
    ],
    questions: [
      {
        q: "What's the rule of thumb in the text?",
        options: ["Three shakes a day", "About 1.6 grams per kilo per day", "Chicken with every meal"],
        answer: 1,
      },
      {
        q: "What matters more than protein, according to the writer?",
        options: ["Expensive supplements", "Consistent training, sleep and eating enough", "Training twice a day"],
        answer: 1,
      },
    ],
  },
  {
    id: "r-etf-types",
    title: "Accumulating or distributing?",
    level: "B2",
    minutes: 2,
    paragraphs: [
      "Many ETFs come in two versions that hold exactly the same shares. The difference is what happens to the dividends the companies pay out.",
      "A distributing fund sends those dividends to your account, usually every quarter. An accumulating fund keeps them and buys more shares with the money, so the value of each unit you own goes up instead.",
      "If you live off your investments, cash in hand is useful. But if you're investing for the long haul, accumulating usually makes more sense. The money goes back to work automatically, and you don't have to remember to reinvest it.",
      "In some countries there's a tax angle too: dividends you receive may be taxed right away, while reinvested ones are often taxed only when you sell. It's worth checking the rules where you live before you choose.",
    ],
    glossary: [
      g("pay out", "give money to shareholders", "מחלקות"),
      g("live off", "use as the money you live on", "להתקיים מ"),
      g("for the long haul", "for a long period of time", "לטווח הארוך"),
      g("makes more sense", "is the more logical choice", "הגיוני יותר"),
      g("goes back to work", "is invested again and keeps earning", "חוזר לעבוד"),
      g("a tax angle", "a part of the question connected to tax", "היבט מיסויי"),
    ],
    questions: [
      {
        q: "What does an accumulating fund do with dividends?",
        options: ["Sends them to your account", "Uses them to buy more shares", "Pays them as fees"],
        answer: 1,
      },
      {
        q: "Who might prefer a distributing fund, according to the text?",
        options: [
          "Someone who lives off their investments",
          "Someone investing for twenty years",
          "Someone who never checks their account",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: "r-small-talk",
    title: "Small talk that isn't awkward",
    level: "B1+",
    minutes: 2,
    paragraphs: [
      "Small talk has a bad name, but it does an important job. Those two minutes by the coffee machine are how people decide whether they feel comfortable with you, long before any meeting.",
      "The easiest way in is to comment on something you both share: the weather, the traffic, the long queue for the microwave. It doesn't need to be clever. It just needs to be friendly.",
      "Then ask an open question, one that can't be answered with yes or no. “How was your weekend?” works better than “Did you have a good weekend?” And when they answer, pick up on one detail and ask about it. That shows you were actually listening.",
      "Finally, don't feel you have to keep it going forever. “Anyway, I'd better get back to it. Good to see you!” is a perfectly polite way to wrap things up.",
    ],
    glossary: [
      g("has a bad name", "people think badly of it", "יש לו שם רע"),
      g("The easiest way in", "the simplest way to start", "הדרך הכי קלה להתחיל"),
      g("pick up on", "notice and respond to", "לשים לב ל, להיתפס ל"),
      g("keep it going", "make it continue", "להמשיך את זה"),
      g("I'd better get back to it", "I should return to my work now", "כדאי שאחזור לעבודה"),
      g("wrap things up", "finish a conversation or activity", "לסיים"),
    ],
    questions: [
      {
        q: "What's the easiest way to start, according to the text?",
        options: ["Tell a clever joke", "Comment on something you both share", "Ask about their salary"],
        answer: 1,
      },
      {
        q: "Why should you ask about a detail from their answer?",
        options: [
          "It shows you were listening",
          "It makes the conversation shorter",
          "It lets you talk about yourself",
        ],
        answer: 0,
      },
    ],
  },
];

export function readingById(id: string): Reading | undefined {
  return READINGS.find((r) => r.id === id);
}
