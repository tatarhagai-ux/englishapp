/**
 * Word packs for the word cards: a dozen useful words or chunks per topic, a little above
 * his everyday English, each with a plain meaning, Hebrew and an example in natural speech.
 * Adding a pack puts its words in the phrase bank, so the cards, the warm-up and the tutor
 * (who gives him chances to use them) all work from the same list.
 */

export interface DeckWord {
  text: string;
  meaningEn: string;
  meaningHe: string;
  example: string;
}

export interface Deck {
  id: string;
  title: string;
  summary: string;
  level: "B1" | "B1+" | "B2" | "C1";
  words: DeckWord[];
}

function w(text: string, meaningEn: string, meaningHe: string, example: string): DeckWord {
  return { text, meaningEn, meaningHe, example };
}

export const DECKS: readonly Deck[] = [
  {
    id: "office",
    title: "Office and meetings",
    summary: "The short phrases meetings and emails run on.",
    level: "B1+",
    words: [
      w(
        "follow up",
        "contact someone again about something",
        "לחזור אל מישהו בנושא, להמשיך טיפול",
        "I'll follow up with him after lunch.",
      ),
      w(
        "on the same page",
        "agreeing and understanding the same thing",
        "מתואמים, מבינים אותו דבר",
        "Let's make sure we're all on the same page.",
      ),
      w("touch base", "briefly check in with someone", "להתעדכן בקצרה", "Let's touch base on Thursday."),
      w("heads-up", "a warning that something is coming", "התראה מראש", "Thanks for the heads-up about the meeting."),
      w("deadline", "the time something must be finished by", "מועד אחרון", "The deadline is Friday at noon."),
      w("swamped", "extremely busy", "עמוס לגמרי", "I'm swamped this week, can it wait?"),
      w(
        "loop someone in",
        "include someone in the conversation or email",
        "לצרף מישהו לעדכון",
        "Can you loop me in on that email?",
      ),
      w(
        "push back",
        "move to a later time; or disagree",
        "לדחות; או להתנגד",
        "We had to push back the launch by a week.",
      ),
      w("wrap up", "finish", "לסכם, לסיים", "Let's wrap up in five minutes."),
      w("bring up", "mention a subject", "להעלות נושא", "I'd like to bring up one more thing."),
      w("run late", "be behind schedule", "להתעכב, לאחר", "Sorry, I'm running a few minutes late."),
      w(
        "figure out",
        "find the answer or solution",
        "להבין, למצוא פתרון",
        "We still need to figure out who's in charge.",
      ),
    ],
  },
  {
    id: "travel",
    title: "Travel and airports",
    summary: "From check-in to the hotel desk, without freezing.",
    level: "B1",
    words: [
      w(
        "boarding pass",
        "the ticket you show to get on the plane",
        "כרטיס עלייה למטוס",
        "Can I see your boarding pass, please?",
      ),
      w("carry-on", "a small bag you take on the plane", "תיק עלייה למטוס", "Is this backpack OK as a carry-on?"),
      w("layover", "a stop between two flights", "עצירת ביניים", "We have a three-hour layover in Rome."),
      w("delayed", "later than planned", "מתעכב, דחוי", "Our flight is delayed by an hour."),
      w("check in", "register at the airport or hotel", "לעשות צ'ק-אין", "What time can we check in?"),
      w("check out", "leave the hotel and pay", "לעשות צ'ק-אאוט", "We need to check out by eleven."),
      w("fully booked", "no free rooms or seats", "תפוס לגמרי", "Sorry, we're fully booked tonight."),
      w("round trip", "a ticket there and back", "הלוך ושוב", "How much is a round trip to the city?"),
      w("get off", "leave a bus or train", "לרדת (מאוטובוס, רכבת)", "Get off at the second stop."),
      w("lost and found", "the place for things people lost", "אבדות ומציאות", "Try the lost and found near gate B."),
      w("jet lag", "tiredness after flying across time zones", "ג'ט לג", "I'm still a bit jet-lagged."),
      w("sightseeing", "visiting famous places as a tourist", "סיור באתרים", "We spent the morning sightseeing."),
    ],
  },
  {
    id: "interview",
    title: "Job interviews",
    summary: "Words that make your answers sound clear and confident.",
    level: "B2",
    words: [
      w("strength", "something you're good at", "נקודת חוזק", "One of my strengths is staying calm under pressure."),
      w("weakness", "something you need to improve", "נקודת חולשה", "A weakness I'm working on is public speaking."),
      w(
        "take the initiative",
        "act without being told to",
        "ליזום, לקחת יוזמה",
        "I took the initiative and fixed the process.",
      ),
      w("responsible for", "in charge of", "אחראי על", "I was responsible for the weekly reports."),
      w(
        "handle pressure",
        "stay effective when things are stressful",
        "להתמודד עם לחץ",
        "I handle pressure well when deadlines pile up.",
      ),
      w("team player", "someone who works well with others", "שחקן צוות", "I'd describe myself as a team player."),
      w("hands-on", "practical, doing things yourself", "מעשי, עם הידיים", "I have hands-on experience with Azure."),
      w("eager to learn", "really wanting to learn", "להוט ללמוד", "I'm eager to learn from experienced people."),
      w(
        "achievement",
        "something good you managed to do",
        "הישג",
        "My biggest achievement was cutting the wait time in half.",
      ),
      w("as a result", "because of that", "כתוצאה מכך", "As a result, we finished two days early."),
      w(
        "career goal",
        "what you want to reach in your work",
        "יעד מקצועי",
        "My career goal is to work in cloud support.",
      ),
      w(
        "notice period",
        "the time you must work after you resign",
        "תקופת הודעה מוקדמת",
        "My notice period is two weeks.",
      ),
    ],
  },
  {
    id: "ai-tech",
    title: "AI and tech talk",
    summary: "Explain what you build and use, in plain words.",
    level: "B2",
    words: [
      w("prompt", "the instruction you give an AI", "הנחיה (פרומפט)", "A clear prompt gets a much better answer."),
      w("automate", "make something run by itself", "לבצע אוטומציה", "I automated the daily report."),
      w("workflow", "the steps a task goes through", "תהליך עבודה", "It saves me an hour in my workflow."),
      w("reliable", "you can trust it to work", "אמין", "It's fast, but not always reliable."),
      w("make things up", "invent false information", "להמציא (מידע לא נכון)", "Sometimes the model makes things up."),
      w("set up", "prepare something so it works", "להגדיר, להקים", "It took ten minutes to set up."),
      w("user-friendly", "easy to use", "ידידותי למשתמש", "The new version is much more user-friendly."),
      w("cutting-edge", "the newest and most advanced", "חדשני ביותר", "They use cutting-edge models."),
      w("in the cloud", "running on remote servers online", "בענן", "Everything is stored in the cloud."),
      w("trial and error", "trying again and again until it works", "ניסוי וטעייה", "I learned it by trial and error."),
      w("keep up with", "stay up to date with", "לעמוד בקצב, להתעדכן", "It's hard to keep up with all the new tools."),
      w("make a difference", "have a real effect", "לעשות הבדל", "For me, voice typing made a real difference."),
    ],
  },
  {
    id: "money",
    title: "Money and investing",
    summary: "Talk about saving and long-term investing like an adult.",
    level: "B2",
    words: [
      w("save up", "keep money for something later", "לחסוך (למטרה)", "I'm saving up for a laptop."),
      w("budget", "a plan for how to spend money", "תקציב", "I try to stick to a monthly budget."),
      w("afford", "have enough money for", "להרשות לעצמך", "I can't afford it right now."),
      w(
        "index fund",
        "a fund that follows the whole market",
        "קרן מחקה מדד",
        "Most of my savings are in an index fund.",
      ),
      w("long-term", "over many years", "לטווח ארוך", "It's a long-term investment."),
      w("returns", "the profit you get from an investment", "תשואה", "The returns were good last year."),
      w(
        "compound interest",
        "earning interest on your interest",
        "ריבית דריבית",
        "Compound interest works best over time.",
      ),
      w("risky", "might lose money", "מסוכן", "Single stocks are too risky for me."),
      w("diversify", "spread money across many things", "לפזר (סיכונים)", "It's smart to diversify."),
      w("fees", "money you pay for a service", "עמלות, דמי ניהול", "Low fees make a big difference over 15 years."),
      w(
        "pay off",
        "finish paying a debt; or bring good results",
        "לסגור חוב; להשתלם",
        "All that saving finally paid off.",
      ),
      w("rainy day fund", "money kept for emergencies", "קרן חירום", "I keep a small rainy day fund."),
    ],
  },
  {
    id: "fitness",
    title: "Fitness and health",
    summary: "Your training, your body, how you feel.",
    level: "B1+",
    words: [
      w("work out", "exercise", "להתאמן", "I work out four times a week."),
      w("sore", "aching after exercise", "תפוס, כואב (שרירים)", "My legs are still sore from Sunday."),
      w("warm up", "prepare your body before exercise", "לחמם את הגוף", "Always warm up before you lift."),
      w("get in shape", "become fit", "להיכנס לכושר", "I'm trying to get in shape before summer."),
      w("rest day", "a day without training", "יום מנוחה", "Tomorrow is my rest day."),
      w("routine", "the usual way you do things", "שגרה", "My routine is gym, work, then reading."),
      w("push yourself", "make yourself try harder", "לדחוף את עצמך", "I push myself on the last set."),
      w("burn out", "become exhausted from too much effort", "להישחק", "I trained every day and burned out."),
      w("recover", "get back to normal after effort or illness", "להתאושש", "Sleep helps you recover faster."),
      w("stamina", "the energy to keep going for long", "סיבולת", "My stamina is much better now."),
      w("cut down on", "eat or do less of", "להפחית", "I'm cutting down on sugar."),
      w("take it easy", "relax, don't work too hard", "לקחת בקלות", "The doctor told me to take it easy."),
    ],
  },
  {
    id: "negotiation",
    title: "Never Split the Difference",
    summary: "Chris Voss's negotiation words, from the book you're reading.",
    level: "C1",
    words: [
      w(
        "tactical empathy",
        "understanding the other side's feelings on purpose, to influence them",
        "אמפתיה טקטית",
        "Tactical empathy means showing you get how they feel.",
      ),
      w("mirroring", "repeating the last few words someone said", "שיקוף", "Mirroring makes people keep talking."),
      w(
        "labeling",
        "naming the other person's emotion out loud",
        "תיוג (רגש)",
        'Labeling: "It seems like you\'re frustrated."',
      ),
      w(
        "calibrated question",
        "an open how or what question that makes them think",
        "שאלה מכוילת",
        '"How am I supposed to do that?" is a calibrated question.',
      ),
      w("leverage", "power you can use in a negotiation", "מנוף, כוח מיקוח", "Deadlines give the other side leverage."),
      w(
        "deal breaker",
        "something that would end the deal",
        "עניין שמפיל עסקה",
        "The price isn't a deal breaker for me.",
      ),
      w("common ground", "things both sides agree on", "מכנה משותף", "Start by finding common ground."),
      w("meet halfway", "compromise", "להתפשר באמצע", "Why don't we meet halfway?"),
      w("counteroffer", "an offer you make in reply to theirs", "הצעה נגדית", "They came back with a counteroffer."),
      w("bottom line", "the minimum you'll accept; the main point", "השורה התחתונה", "What's your bottom line?"),
      w("walk away", "leave the negotiation", "לקום וללכת", "Be ready to walk away from a bad deal."),
      w(
        '"That\'s right"',
        "the words that show the other side feels understood",
        '"בדיוק"',
        'You want to hear "that\'s right", not "you\'re right".',
      ),
    ],
  },
  {
    id: "phrasal",
    title: "Everyday phrasal verbs",
    summary: "The two-word verbs natives use all day.",
    level: "B1+",
    words: [
      w("come up with", "think of an idea", "להמציא, להעלות רעיון", "She came up with a great plan."),
      w("give up", "stop trying", "לוותר", "Don't give up, you're almost there."),
      w(
        "look forward to",
        "be happy about something coming",
        "לצפות בקוצר רוח ל",
        "I'm looking forward to the weekend.",
      ),
      w("run out of", "have none left", "להיגמר", "We ran out of coffee."),
      w("put off", "delay doing something", "לדחות", "I keep putting off the dentist."),
      w("turn down", "say no to an offer", "לסרב", "He turned down the job offer."),
      w("get along with", "have a good relationship with", "להסתדר עם", "I get along with everyone on my team."),
      w("find out", "learn a fact", "לגלות", "I found out about it yesterday."),
      w("show up", "arrive, appear", "להופיע, להגיע", "He showed up an hour late."),
      w(
        "catch up",
        "talk to update each other; reach the same level",
        "להשלים פערים, להתעדכן",
        "Let's catch up over coffee.",
      ),
      w("end up", "finally be in a situation", "להיגמר ב, למצוא את עצמך", "We ended up staying until midnight."),
      w("deal with", "handle a problem", "להתמודד עם", "I'll deal with it tomorrow."),
    ],
  },
  {
    id: "connectors",
    title: "Linking words for speaking",
    summary: "Glue your sentences together so you sound fluent.",
    level: "B1+",
    words: [
      w("on top of that", "in addition, and also", "בנוסף לזה", "It's cheap, and on top of that it's fast."),
      w(
        "having said that",
        "but, in spite of what I just said",
        "עם זאת",
        "It's expensive. Having said that, it's worth it.",
      ),
      w("as far as I know", "based on what I know", "למיטב ידיעתי", "As far as I know, the office is closed."),
      w("to be honest", "telling the truth", "למען האמת", "To be honest, I didn't enjoy it."),
      w("in the end", "finally, after everything", "בסוף", "In the end, we chose the cheaper one."),
      w("the thing is", "the problem or main point is", "העניין הוא", "The thing is, I don't have time."),
      w("that being said", "even so", "עם זאת", "That being said, I'd try it again."),
      w("for instance", "for example", "לדוגמה", "For instance, I use it for emails."),
      w("it depends on", "the answer changes with", "זה תלוי ב", "It depends on the weather."),
      w("as a matter of fact", "actually (often to add a surprise)", "למעשה", "As a matter of fact, I've been there."),
      w("in other words", "said differently", "במילים אחרות", "In other words, we need more time."),
      w("anyway", "to change the topic or come back to the point", "בכל מקרה", "Anyway, how was your weekend?"),
    ],
  },
  {
    id: "feelings",
    title: "Feelings and reactions",
    summary: 'React like a native: more than "good" and "bad".',
    level: "B1+",
    words: [
      w("thrilled", "very happy and excited", "נרגש מאוד", "I was thrilled when I got the news."),
      w("relieved", "happy that something bad didn't happen", "הוקל לי", "I'm so relieved the test is over."),
      w("frustrated", "annoyed because you can't change something", "מתוסכל", "I get frustrated when the app crashes."),
      w("overwhelmed", "too much to handle", "מוצף", "I felt overwhelmed in my first week."),
      w("fed up with", "tired and annoyed after too long", "נמאס לי מ", "I'm fed up with the traffic."),
      w("can't stand", "really dislike", "לא סובל", "I can't stand loud music in restaurants."),
      w("no big deal", "not important, it's fine", "לא נורא", "Don't worry, it's no big deal."),
      w("I'm into", "I really like", "אני בקטע של", "I'm really into history podcasts."),
      w("it's worth it", "the effort or price is justified", "שווה את זה", "It's a long hike, but it's worth it."),
      w("I don't mind", "it's fine with me", "לא אכפת לי", "I don't mind waiting."),
      w(
        "mixed feelings",
        "partly positive, partly negative",
        "רגשות מעורבים",
        "I have mixed feelings about the new job.",
      ),
      w("over the moon", "extremely happy", "בעננים", "She was over the moon about the trip."),
    ],
  },
];

export function deckById(id: string): Deck | undefined {
  return DECKS.find((d) => d.id === id);
}
