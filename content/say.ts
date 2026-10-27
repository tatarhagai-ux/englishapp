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

export const SAY_SETS: readonly SaySet[] = [
  {
    id: "for-and-since",
    pattern: "present_tenses",
    title: "For and since",
    items: [
      {
        he: "אני גר בשוהם כבר עשר שנים.",
        answers: ["I've been living in Shoham for ten years.", "I've lived in Shoham for ten years."],
        trap: "I live in Shoham ten years.",
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

export function saySetById(id: string): SaySet | undefined {
  return SAY_SETS.find((s) => s.id === id);
}
