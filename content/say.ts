/**
 * "Say it in English": a Hebrew sentence on screen, he says it in English. Each set trains
 * one transfer pattern from content/l1/he.ts, so the Hebrew is exactly the kind of sentence
 * that pulls a Hebrew speaker into the mistake. answers lists the natural versions we accept
 * (contractions are normalized, so "I've" and "I have" both count); trap is the
 * word-for-word version he's likely to say, shown when he says it.
 */

export interface SayItem {
  he: string;
  answers: string[];
  trap?: string;
}

export interface SaySet {
  id: string;
  /** Key in HEBREW_PATTERNS, for the rule and the tip. */
  pattern: string;
  title: string;
  items: SayItem[];
}

const SAY_SETS_CORE: readonly SaySet[] = [
  {
    id: "for-and-since",
    pattern: "present_tenses",
    title: "For and since",
    items: [
      {
        he: "אני גר פה כבר עשר שנים.",
        answers: ["I've been living here for ten years.", "I've lived here for ten years."],
        trap: "I live here ten years.",
      },
      {
        he: "אני מכיר אותו כבר חמש שנים.",
        answers: ["I've known him for five years."],
        trap: "I know him five years.",
      },
      {
        he: "כמה זמן אתה לומד אנגלית?",
        answers: [
          "How long have you been learning English?",
          "How long have you been studying English?",
          "How long have you studied English?",
        ],
        trap: "How much time you learn English?",
      },
      {
        he: "היא עובדת שם מאז מרץ.",
        answers: ["She's been working there since March.", "She's worked there since March."],
        trap: "She works there since March.",
      },
      {
        he: "אני מחכה לך כבר חצי שעה.",
        answers: ["I've been waiting for you for half an hour.", "I've been waiting for half an hour."],
        trap: "I wait for you already half an hour.",
      },
      {
        he: "לא נפגשנו כבר הרבה זמן.",
        answers: [
          "We haven't met in a long time.",
          "We haven't met for a long time.",
          "We haven't seen each other in a long time.",
          "We haven't seen each other for a long time.",
        ],
        trap: "We didn't meet already a lot of time.",
      },
    ],
  },
  {
    id: "is-and-do",
    pattern: "missing_be_do",
    title: "Is, are and do",
    items: [
      { he: "הוא מאוד חכם.", answers: ["He's very smart."], trap: "He very smart." },
      {
        he: "אתה רוצה קפה?",
        answers: [
          "Do you want coffee?",
          "Do you want some coffee?",
          "Would you like coffee?",
          "Would you like some coffee?",
        ],
        trap: "You want coffee?",
      },
      { he: "איפה המשרד שלך?", answers: ["Where's your office?"], trap: "Where your office?" },
      {
        he: "היא לא אוהבת לרוץ.",
        answers: ["She doesn't like running.", "She doesn't like to run."],
        trap: "She not like to run.",
      },
      { he: "למה הוא עייף?", answers: ["Why is he tired?"], trap: "Why he tired?" },
      {
        he: "אתה גר פה קרוב?",
        answers: [
          "Do you live nearby?",
          "Do you live close by?",
          "Do you live near here?",
          "Do you live close to here?",
        ],
        trap: "You live close here?",
      },
    ],
  },
  {
    id: "a-and-the",
    pattern: "articles",
    title: "A and the",
    items: [
      { he: "קניתי טלפון חדש.", answers: ["I bought a new phone."], trap: "I bought new phone." },
      {
        he: "החיים קשים לפעמים.",
        answers: ["Life is hard sometimes.", "Sometimes life is hard."],
        trap: "The life is hard sometimes.",
      },
      { he: "הוא מהנדס.", answers: ["He's an engineer."], trap: "He engineer." },
      {
        he: "כסף זה לא הכול.",
        answers: ["Money isn't everything.", "Money is not everything."],
        trap: "The money is not everything.",
      },
      {
        he: "סגרת את הדלת?",
        answers: ["Did you close the door?", "Did you shut the door?"],
        trap: "You closed the door?",
      },
      {
        he: "יש לי פגישה מחר בבוקר.",
        answers: ["I have a meeting tomorrow morning.", "I've got a meeting tomorrow morning."],
        trap: "I have meeting tomorrow in the morning.",
      },
    ],
  },
  {
    id: "small-words",
    pattern: "prepositions",
    title: "The small words",
    items: [
      { he: "זה תלוי בך.", answers: ["It depends on you.", "That depends on you."], trap: "It depends in you." },
      { he: "אני מחכה לאוטובוס.", answers: ["I'm waiting for the bus."], trap: "I'm waiting to the bus." },
      { he: "היא נשואה לאח שלו.", answers: ["She's married to his brother."], trap: "She's married with his brother." },
      {
        he: "הוא הסביר לי את הבעיה.",
        answers: ["He explained the problem to me."],
        trap: "He explained me the problem.",
      },
      { he: "אני טוב במתמטיקה.", answers: ["I'm good at math.", "I'm good at maths."], trap: "I'm good in math." },
      {
        he: "הגעתי הביתה מאוחר.",
        answers: ["I got home late.", "I came home late.", "I arrived home late."],
        trap: "I arrived to home late.",
      },
    ],
  },
  {
    id: "no-to",
    pattern: "modal_to",
    title: "Can, must, should",
    items: [
      { he: "אני חייב ללכת.", answers: ["I must go.", "I have to go.", "I've got to go."], trap: "I must to go." },
      { he: "אתה יכול להתקשר אליי מחר.", answers: ["You can call me tomorrow."], trap: "You can to call me tomorrow." },
      {
        he: "כדאי לך לנסות את זה.",
        answers: ["You should try it.", "You should try this.", "You should give it a try."],
        trap: "You should to try it.",
      },
      {
        he: "אולי אני אאחר קצת.",
        answers: [
          "I might be a little late.",
          "I might be a bit late.",
          "I may be a little late.",
          "I may be a bit late.",
        ],
        trap: "Maybe I will be late a little.",
      },
      {
        he: "אתה יכול לעזור לי?",
        answers: ["Can you help me?", "Could you help me?"],
        trap: "You can to help me?",
      },
      {
        he: "לא הייתי צריך להגיד את זה.",
        answers: ["I shouldn't have said that.", "I shouldn't have said it."],
        trap: "I didn't need to say it.",
      },
    ],
  },
  {
    id: "know-not-knowing",
    pattern: "ing_overuse",
    title: "Know, like, need",
    items: [
      {
        he: "אני אוהב את העבודה החדשה.",
        answers: ["I like the new job.", "I like my new job."],
        trap: "I'm liking the new job.",
      },
      {
        he: "אני מבין מה אתה אומר.",
        answers: ["I understand what you're saying.", "I see what you're saying.", "I see what you mean."],
        trap: "I'm understanding what you say.",
      },
      { he: "אני צריך עוד זמן.", answers: ["I need more time."], trap: "I'm needing more time." },
      {
        he: "אני חושב שזה רעיון טוב.",
        answers: ["I think it's a good idea.", "I think that's a good idea."],
        trap: "I'm thinking it's a good idea.",
      },
      {
        he: "הוא רוצה לדבר איתך.",
        answers: [
          "He wants to talk to you.",
          "He wants to talk with you.",
          "He wants to speak to you.",
          "He wants to speak with you.",
        ],
        trap: "He's wanting to talk with you.",
      },
      {
        he: "זה שייך לאחי.",
        answers: ["It belongs to my brother.", "This belongs to my brother.", "That belongs to my brother."],
        trap: "It's belonging to my brother.",
      },
    ],
  },
  {
    id: "shall-i",
    pattern: "infinitive_offer",
    title: "Offering to help",
    items: [
      {
        he: "לפתוח את החלון?",
        answers: ["Shall I open the window?", "Should I open the window?", "Do you want me to open the window?"],
        trap: "To open the window?",
      },
      {
        he: "להביא לך מים?",
        answers: [
          "Shall I get you some water?",
          "Should I get you some water?",
          "Do you want me to get you some water?",
          "Can I get you some water?",
        ],
        trap: "To bring you water?",
      },
      {
        he: "לשלוח לך את הקובץ?",
        answers: ["Shall I send you the file?", "Should I send you the file?", "Do you want me to send you the file?"],
        trap: "To send you the file?",
      },
      {
        he: "להזמין לנו שולחן?",
        answers: [
          "Shall I book us a table?",
          "Should I book us a table?",
          "Do you want me to book us a table?",
          "Shall I book a table?",
          "Should I book a table?",
        ],
        trap: "To order us a table?",
      },
      {
        he: "לסגור את הדלת?",
        answers: ["Shall I close the door?", "Should I close the door?", "Do you want me to close the door?"],
        trap: "To close the door?",
      },
      {
        he: "להתקשר אליו בשבילך?",
        answers: [
          "Shall I call him for you?",
          "Should I call him for you?",
          "Do you want me to call him for you?",
          "Do you want me to call him?",
        ],
        trap: "To call him for you?",
      },
    ],
  },
  {
    id: "owner-first",
    pattern: "word_order_modifier",
    title: "Owner first",
    items: [
      { he: "המשרד של אחי.", answers: ["My brother's office."], trap: "The office of my brother." },
      {
        he: "עשיתי קורס של מיקרוסופט.",
        answers: ["I took a Microsoft course.", "I did a Microsoft course."],
        trap: "I did a course of Microsoft.",
      },
      { he: "הרכב של דנה חדש.", answers: ["Dana's car is new."], trap: "The car of Dana is new." },
      {
        he: "יש לי חשבון של גוגל.",
        answers: ["I have a Google account.", "I've got a Google account."],
        trap: "I have an account of Google.",
      },
      {
        he: "זאת הייתה החלטה של המנהל.",
        answers: ["It was the manager's decision.", "That was the manager's decision."],
        trap: "It was a decision of the manager.",
      },
      {
        he: "אני צריך מטען לטלפון.",
        answers: ["I need a phone charger."],
        trap: "I need a charger of phone.",
      },
    ],
  },
  {
    id: "soften-it",
    pattern: "directness",
    title: "Soften it",
    items: [
      {
        he: "תשלח לי את הקובץ.",
        answers: [
          "Could you send me the file?",
          "Can you send me the file?",
          "Would you send me the file?",
          "Would you mind sending me the file?",
        ],
        trap: "Send me the file.",
      },
      {
        he: "תן לי קפה.",
        answers: ["Can I get a coffee?", "Could I get a coffee?", "Can I have a coffee?", "Could I have a coffee?"],
        trap: "Give me a coffee.",
      },
      {
        he: "תחזור אליי היום.",
        answers: [
          "Could you get back to me today?",
          "Can you get back to me today?",
          "Would you get back to me today?",
          "Could you call me back today?",
          "Can you call me back today?",
        ],
        trap: "Return to me today.",
      },
      {
        he: "תדבר יותר לאט.",
        answers: [
          "Could you speak more slowly?",
          "Can you speak more slowly?",
          "Could you slow down a little?",
          "Could you speak a little slower?",
          "Could you speak slower?",
          "Can you speak slower?",
        ],
        trap: "Talk more slow.",
      },
      {
        he: "תסביר את זה שוב.",
        answers: [
          "Could you explain that again?",
          "Can you explain that again?",
          "Could you explain it again?",
          "Can you explain it again?",
          "Would you mind explaining that again?",
        ],
        trap: "Explain it again.",
      },
      {
        he: "תזיז את הפגישה למחר.",
        answers: [
          "Could we move the meeting to tomorrow?",
          "Can we move the meeting to tomorrow?",
          "Could you move the meeting to tomorrow?",
          "Can you move the meeting to tomorrow?",
          "Would you mind moving the meeting to tomorrow?",
        ],
        trap: "Move the meeting to tomorrow.",
      },
    ],
  },
];

const SAY_SETS_MORE: readonly SaySet[] = [
  {
    id: "questions",
    pattern: "question_order",
    title: "Asking questions",
    items: [
      { he: "איפה אתה עובד?", answers: ["Where do you work?"], trap: "Where you work?" },
      {
        he: "מה זה אומר?",
        answers: ["What does it mean?", "What does that mean?", "What does this mean?"],
        trap: "What it means?",
      },
      {
        he: "איך אומרים את זה באנגלית?",
        answers: [
          "How do you say this in English?",
          "How do you say it in English?",
          "How do you say that in English?",
        ],
        trap: "How say this in English?",
      },
      {
        he: "אתה יכול להגיד לי איפה התחנה?",
        answers: ["Can you tell me where the station is?", "Could you tell me where the station is?"],
        trap: "Can you tell me where is the station?",
      },
      {
        he: "אתה יודע מה השעה?",
        answers: ["Do you know what time it is?"],
        trap: "Do you know what time is it?",
      },
      {
        he: "למה עזבת את העבודה?",
        answers: ["Why did you leave your job?", "Why did you leave the job?"],
        trap: "Why you left the job?",
      },
    ],
  },
  {
    id: "have-you-ever",
    pattern: "ever_perfect",
    title: "Have you ever",
    items: [
      {
        he: "היית פעם בלונדון?",
        answers: ["Have you ever been to London?", "Have you been to London?"],
        trap: "Were you ever in London?",
      },
      {
        he: "אף פעם לא אכלתי סושי.",
        answers: ["I've never eaten sushi.", "I've never had sushi."],
        trap: "I never ate sushi.",
      },
      {
        he: "ראית את הסרט הזה?",
        answers: [
          "Have you seen this movie?",
          "Have you seen that movie?",
          "Have you seen this film?",
          "Have you ever seen this movie?",
        ],
        trap: "Did you see this movie?",
      },
      {
        he: "עבדתי עם לקוחות מחו״ל הרבה פעמים.",
        answers: [
          "I've worked with clients from abroad many times.",
          "I've worked with foreign clients many times.",
          "I've worked with clients from abroad a lot of times.",
        ],
        trap: "I worked with clients from abroad many times.",
      },
      {
        he: "הוא עוד לא סיים.",
        answers: ["He hasn't finished yet.", "He hasn't finished."],
        trap: "He didn't finish yet.",
      },
      {
        he: "כבר דיברתי איתו.",
        answers: [
          "I've already talked to him.",
          "I've already spoken to him.",
          "I've already talked with him.",
          "I've already spoken with him.",
        ],
        trap: "I already talked with him.",
      },
    ],
  },
  {
    id: "word-for-word",
    pattern: "calques",
    title: "Word for word",
    items: [
      {
        he: "כיביתי את האור.",
        answers: [
          "I turned off the light.",
          "I turned the light off.",
          "I switched off the light.",
          "I switched the light off.",
        ],
        trap: "I closed the light.",
      },
      { he: "קיבלתי החלטה.", answers: ["I made a decision.", "I've made a decision."], trap: "I took a decision." },
      {
        he: "אני בן עשרים.",
        answers: ["I'm twenty.", "I'm twenty years old.", "I'm 20.", "I'm 20 years old."],
        trap: "I have twenty years.",
      },
      { he: "אני מסכים איתך.", answers: ["I agree with you.", "I agree."], trap: "I'm agree with you." },
      { he: "עשיתי טעות.", answers: ["I made a mistake."], trap: "I did a mistake." },
      {
        he: "אתה יכול להלוות לי כסף?",
        answers: [
          "Can you lend me some money?",
          "Could you lend me some money?",
          "Can you lend me money?",
          "Could you lend me money?",
          "Can I borrow some money?",
          "Could I borrow some money?",
        ],
        trap: "Can you borrow me money?",
      },
    ],
  },
];

export const SAY_SETS: readonly SaySet[] = [...SAY_SETS_CORE, ...SAY_SETS_MORE];

export function saySetById(id: string): SaySet | undefined {
  return SAY_SETS.find((s) => s.id === id);
}

/** His recurring mistakes (content/learner-seed.ts) that a set trains, by key. */
const MISTAKE_SETS: Record<string, string> = {
  present_perfect_duration: "for-and-since",
  missing_be: "is-and-do",
  study_for: "small-words",
  online_not_at_internet: "small-words",
  noun_modifier_order: "owner-first",
};

/** The set that trains a mistake: by its own key, or by the pattern the analyzer filed it under. */
export function saySetForMistake(key: string): SaySet | undefined {
  return saySetById(MISTAKE_SETS[key] ?? "") ?? SAY_SETS.find((s) => s.pattern === key);
}
