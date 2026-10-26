/**
 * The 12-week plan: five short days a week (about 12 minutes), each week with one theme,
 * one thing to get right, and eight "stretch words" a little above his everyday English.
 * The tutor gives him chances to use the week's words; using one counts in the phrase bank.
 *
 * Progress is not stored here: a session started from the plan carries its day ("w3d2"),
 * so the next day is simply the first one without a finished session. Doing two days in
 * one go is fine; nothing is locked, and a missed day just waits.
 *
 * A day either reuses a library scenario or is a tutor talk on its own topic (its id then
 * starts with "plan-", and scenarioById builds it from here).
 */
import type { Scenario } from "./scenarios";

export interface StretchWord {
  text: string;
  meaningEn: string;
  meaningHe: string;
  example: string;
}

/** A tutor conversation on a plan topic. */
export interface PlanTopic {
  title: string;
  summary: string;
  task: string;
  successCriteria: string[];
  opener: string;
}

export interface PlanDay {
  /** "w3d2" */
  key: string;
  /** A library scenario id, or "plan-w3d2" for a topic day. */
  scenarioId: string;
  topic?: PlanTopic;
  /** The monthly speaking check (the same level chat as the first one, to compare). */
  check?: boolean;
}

export interface PlanWeek {
  week: number;
  title: string;
  /** What finishing the week gives him, in one line. */
  goal: string;
  /** The one thing to get right this week, shown on Today and nudged by the tutor. */
  focus: string;
  /** Learner-seed mistake keys the tutor should create chances for. */
  targets: string[];
  words: StretchWord[];
  days: PlanDay[];
}

const CHECK = "placement";

function w(text: string, meaningEn: string, meaningHe: string, example: string): StretchWord {
  return { text, meaningEn, meaningHe, example };
}

function topic(week: number, day: number, t: PlanTopic): PlanDay {
  const key = `w${week}d${day}`;
  return { key, scenarioId: `plan-${key}`, topic: t };
}

function lib(week: number, day: number, scenarioId: string): PlanDay {
  return { key: `w${week}d${day}`, scenarioId };
}

function check(week: number, day: number): PlanDay {
  return { key: `w${week}d${day}`, scenarioId: CHECK, check: true };
}

export const PLAN: readonly PlanWeek[] = [
  {
    week: 1,
    title: "You and your days",
    goal: "Talk about your routine and your life for a few minutes without stopping.",
    focus: "“I've been doing it for two years” (present perfect for how long), not “I do it two years”.",
    targets: ["present_perfect_duration", "study_for"],
    words: [
      w("routine", "the things you usually do every day", "שגרה", "My morning routine starts with a run."),
      w("demanding", "needs a lot of time or effort", "תובעני", "My job is demanding, but I like it."),
      w("flexible", "can change easily", "גמיש", "My hours are pretty flexible."),
      w("to juggle", "to manage several things at once", "ללהטט, לאזן בין", "I'm juggling work and studying."),
      w("eventually", "in the end, after some time", "בסופו של דבר", "Eventually I want to work abroad."),
      w("to take up", "to start a new hobby or activity", "להתחיל לעסוק ב", "I took up running last year."),
      w("consistent", "doing something the same way all the time", "עקבי", "I try to be consistent with my training."),
      w("to keep up with", "to not fall behind", "לעמוד בקצב של", "It's hard to keep up with everything."),
    ],
    days: [
      lib(1, 1, "free-your-week"),
      topic(1, 2, {
        title: "A normal day in your life",
        summary: "Walk your tutor through a typical day, morning to night.",
        task: "Describe a normal day in order, with at least two details about how you feel about parts of it.",
        successCriteria: ["Describes a day in a clear order", "Says how he feels about at least two parts of it"],
        opener: "Let's start simple: walk me through a normal day for you. What does your morning look like?",
      }),
      lib(1, 3, "free-fitness"),
      topic(1, 4, {
        title: "Something you've done for years",
        summary: "A habit, hobby or skill you've had for a long time.",
        task: "Talk about something you've been doing for a long time: how it started and why you kept going.",
        successCriteria: ["Says how long, using “I've been … for …” or “since …”", "Explains why he kept doing it"],
        opener:
          "Tell me about something you've been doing for a long time. A hobby, a habit, anything. How long has it been?",
      }),
      lib(1, 5, "free-plans"),
    ],
  },
  {
    week: 2,
    title: "Small talk that keeps going",
    goal: "Start a chat with someone new and keep it going with follow-up questions.",
    focus: "Answer, add one detail, then ask something back. Don't stop at “yes” or “no”.",
    targets: ["looking_forward_to_ing"],
    words: [
      w("to bump into", "to meet someone by chance", "להיתקל במישהו", "I bumped into an old friend at the mall."),
      w(
        "to catch up",
        "to talk about what happened since you last met",
        "להשלים פערים, להתעדכן",
        "We should catch up over coffee.",
      ),
      w("hectic", "very busy, full of activity", "עמוס, קדחתני", "This week has been hectic."),
      w("genuinely", "really, honestly", "באמת, בכנות", "I'm genuinely interested in that."),
      w("to come across", "to find or meet by chance", "להיתקל ב", "I came across a great podcast."),
      w("laid-back", "relaxed, calm", "רגוע, נינוח", "He's a very laid-back guy."),
      w("awkward", "uncomfortable, embarrassing", "מביך", "There was an awkward silence."),
      w("to get along with", "to have a good relationship with", "להסתדר עם", "I get along with most people at work."),
    ],
    days: [
      lib(2, 1, "work-small-talk"),
      lib(2, 2, "abroad-neighbor"),
      topic(2, 3, {
        title: "Catching up with an old friend",
        summary: "Your tutor plays a friend you haven't seen in a while.",
        task: "Catch up with an old friend: share two pieces of news and ask about theirs.",
        successCriteria: ["Shares at least two pieces of news", "Asks at least two follow-up questions"],
        opener: "Hey, no way! It's been ages. How have you been? What's new with you?",
      }),
      lib(2, 4, "abroad-restaurant"),
      topic(2, 5, {
        title: "Meeting someone at a party",
        summary: "A friend-of-a-friend at a party. Keep the chat alive.",
        task: "Get to know someone new at a party: find two things you have in common.",
        successCriteria: ["Asks open questions", "Finds at least two things in common"],
        opener: "Hi! I don't think we've met. I'm Sam, I came with Noa. How do you know the host?",
      }),
    ],
  },
  {
    week: 3,
    title: "Work updates and problems",
    goal: "Give a clear update at work and explain a problem without panicking.",
    focus:
      "Past simple for finished things (“I finished it yesterday”), present perfect for news (“I've finished it”).",
    targets: ["office_idioms", "noun_modifier_order"],
    words: [
      w("deadline", "the time by which something must be done", "מועד אחרון, דדליין", "The deadline is Thursday."),
      w("to postpone", "to move to a later time", "לדחות", "We had to postpone the meeting."),
      w("to prioritize", "to decide what is most important first", "לתעדף", "I prioritized the urgent tasks."),
      w("bottleneck", "the part that slows everything down", "צוואר בקבוק", "Approvals are the bottleneck."),
      w("to follow up", "to check or continue later", "לעקוב, לחזור על הנושא", "I'll follow up with him tomorrow."),
      w("to clarify", "to make clearer", "להבהיר", "Can you clarify what you need?"),
      w("workload", "the amount of work you have", "עומס עבודה", "My workload is heavy this month."),
      w(
        "to delegate",
        "to give a task to someone else",
        "להאציל, להעביר משימה",
        "I delegated the report to a colleague.",
      ),
    ],
    days: [
      lib(3, 1, "work-standup"),
      lib(3, 2, "work-delay"),
      topic(3, 3, {
        title: "A problem at work you solved",
        summary: "Tell the story of a real problem and how you handled it.",
        task: "Describe a problem you had at work or in the army and how you solved it, step by step.",
        successCriteria: ["Explains what the problem was", "Says what he did, step by step", "Says how it ended"],
        opener: "Tell me about a problem you had to solve at work, or in the army. What went wrong?",
      }),
      lib(3, 4, "work-support-call"),
      lib(3, 5, "work-feedback"),
    ],
  },
  {
    week: 4,
    title: "Travel: sorting things out",
    goal: "Fix a travel problem politely and firmly, and get what you need.",
    focus: "Polite requests: “Could you…?”, “Would it be possible to…?”, “I was wondering if…”.",
    targets: ["missing_be"],
    words: [
      w("to reschedule", "to change the time of something planned", "לשנות מועד", "Can I reschedule my flight?"),
      w("refund", "money given back", "החזר כספי", "I'd like a full refund."),
      w("inconvenience", "trouble or annoyance", "אי נוחות", "Sorry for the inconvenience."),
      w("to sort out", "to fix or organize a problem", "לסדר, לפתור", "Let's sort this out quickly."),
      w("availability", "whether something is free to use", "זמינות", "Do you have any availability tomorrow?"),
      w(
        "to compensate",
        "to give something to make up for a problem",
        "לפצות",
        "Will you compensate me for the delay?",
      ),
      w("itinerary", "a plan of a journey", "מסלול נסיעה", "Here's my itinerary for the trip."),
      w("to insist", "to say firmly that something must happen", "להתעקש", "I insisted on speaking to a manager."),
    ],
    days: [
      lib(4, 1, "abroad-airport"),
      lib(4, 2, "abroad-hotel"),
      lib(4, 3, "abroad-directions"),
      lib(4, 4, "abroad-bank-phone"),
      check(4, 5),
    ],
  },
  {
    week: 5,
    title: "Opinions with reasons",
    goal: "Give an opinion, back it with a reason and an example, and handle disagreement.",
    focus: "Opinion + because + example: “I think…, because…. For example, …”.",
    targets: ["answer_all_parts"],
    words: [
      w("to argue", "to give reasons for an opinion", "לטעון", "Some people argue that remote work is lonely."),
      w("to acknowledge", "to accept that something is true", "להכיר ב, להודות ש", "I acknowledge it has some risks."),
      w("drawback", "a disadvantage", "חיסרון", "The main drawback is the cost."),
      w("to outweigh", "to be more important than", "לעלות על, להכריע את", "The benefits outweigh the risks."),
      w("convincing", "makes you believe something", "משכנע", "That's a convincing argument."),
      w("perspective", "a way of seeing things", "נקודת מבט", "From my perspective, it's worth it."),
      w("controversial", "causes a lot of disagreement", "שנוי במחלוקת", "It's a controversial topic in Israel."),
      w("in the long run", "after a long time", "בטווח הארוך", "In the long run, it saves money."),
    ],
    days: [
      lib(5, 1, "world-remote-work"),
      lib(5, 2, "world-ai-jobs"),
      topic(5, 3, {
        title: "Is social media good for us?",
        summary: "Take a side and defend it. Your tutor will push back.",
        task: "Give your opinion on social media with two reasons and one real example, then answer a counter-argument.",
        successCriteria: [
          "States a clear opinion",
          "Gives two reasons and an example",
          "Responds to the counter-argument",
        ],
        opener: "Here's a big one: is social media good for us, or not? What do you think, and why?",
      }),
      lib(5, 4, "free-ai-tools"),
      topic(5, 5, {
        title: "A rule you'd change",
        summary: "One rule or law you'd change, and why it would help.",
        task: "Pick one rule (at work, in the army or in the country) you would change, and convince your tutor.",
        successCriteria: ["Names the rule and the change", "Explains why with a reason and an example"],
        opener: "If you could change one rule, at work, in the army, or in the country, what would it be?",
      }),
    ],
  },
  {
    week: 6,
    title: "Interview: about you",
    goal: "Answer “Tell me about yourself” and “Why this job?” clearly in under two minutes.",
    focus: "Answer the question first, then a short example. Start with “I”, not “we”.",
    targets: ["answer_all_parts", "present_perfect_duration"],
    words: [
      w("to thrive", "to do very well, to grow", "לשגשג", "I thrive in fast-paced teams."),
      w("motivated", "wanting to do something well", "בעל מוטיבציה", "I'm very motivated to learn."),
      w("to contribute", "to give something that helps", "לתרום", "I'd like to contribute to the team."),
      w("resilient", "recovers quickly from problems", "חסין, בעל חוסן", "The army made me more resilient."),
      w("background", "your past experience and education", "רקע", "My background is in marketing."),
      w("to stand out", "to be noticed as better", "לבלוט", "What makes you stand out?"),
      w("track record", "your past results", "רקורד, היסטוריית הישגים", "I have a good track record with clients."),
      w("to be eager to", "to want to very much", "להיות להוט ל", "I'm eager to grow in this role."),
    ],
    days: [
      lib(6, 1, "interview-about-you"),
      lib(6, 2, "interview-why-role"),
      topic(6, 3, {
        title: "Your background in two minutes",
        summary: "Practice the short story of your experience so far.",
        task: "Tell your story in about two minutes: what you've done, what you're good at, and what you want next.",
        successCriteria: ["Covers past, present and future in order", "Names one strength with an example"],
        opener: "Imagine we just met at a job fair. In about two minutes, tell me your story so far.",
      }),
      lib(6, 4, "interview-about-you"),
      lib(6, 5, "work-present-idea"),
    ],
  },
  {
    week: 7,
    title: "Interview: stories that prove it",
    goal: "Tell short, strong stories: situation, what you did, and the result.",
    focus: "Tell it in order: the situation, what YOU did, and how it ended (with a number if you can).",
    targets: ["answer_all_parts"],
    words: [
      w("to tackle", "to deal with a difficult problem", "להתמודד עם", "I tackled the problem head-on."),
      w("setback", "a problem that slows progress", "מכשול, נסיגה", "It was a setback, but we recovered."),
      w("to overcome", "to succeed despite a difficulty", "להתגבר על", "I overcame my fear of speaking."),
      w("outcome", "the result", "תוצאה", "The outcome was better than expected."),
      w("to take initiative", "to act without being told", "ליזום, לקחת יוזמה", "I took the initiative to fix it."),
      w("under pressure", "with stress and little time", "תחת לחץ", "I work well under pressure."),
      w("to streamline", "to make simpler and faster", "לייעל, לפשט", "We streamlined the process."),
      w("constructive", "helpful, aimed at improving", "בונה", "I got some constructive feedback."),
    ],
    days: [
      lib(7, 1, "interview-strengths"),
      lib(7, 2, "interview-star"),
      topic(7, 3, {
        title: "A mistake you learned from",
        summary: "An honest story about getting something wrong, and what changed.",
        task: "Tell a story about a mistake you made: what happened, what you did about it, and what you learned.",
        successCriteria: ["Owns the mistake clearly", "Says what he did to fix it", "Ends with what he learned"],
        opener: "Everyone makes mistakes. Tell me about one you made and what you learned from it.",
      }),
      lib(7, 4, "interview-final"),
      topic(7, 5, {
        title: "A goal you achieved",
        summary: "Something you worked hard for and got.",
        task: "Describe a goal you achieved: why it mattered, the hardest part, and the result.",
        successCriteria: ["Explains why the goal mattered", "Describes the hardest part", "Gives the result"],
        opener: "What's something you worked hard for and actually achieved? I want the whole story.",
      }),
    ],
  },
  {
    week: 8,
    title: "Money, tech and the future",
    goal: "Talk about plans and possibilities: what would happen if…",
    focus: "“If I had…, I would…” for imagined situations; “If it rains, I'll…” for real ones.",
    targets: ["looking_forward_to_ing"],
    words: [
      w("to invest", "to put money in to get more back", "להשקיע", "I invest a little every month."),
      w("sustainable", "can continue for a long time", "בר קיימא", "Is that a sustainable plan?"),
      w("to afford", "to have enough money for", "להרשות לעצמי", "I can't afford a car yet."),
      w("breakthrough", "a sudden important discovery", "פריצת דרך", "AI was a real breakthrough."),
      w("to automate", "to make a machine do a task", "לעשות אוטומציה", "We automated the boring parts."),
      w("risky", "might go wrong", "מסוכן, מסוכן כלכלית", "Putting it all in one stock is risky."),
      w("long-term", "over a long time", "לטווח ארוך", "I'm thinking long-term."),
      w("to rely on", "to depend on", "לסמוך על, להסתמך על", "I rely on my phone for everything."),
    ],
    days: [
      lib(8, 1, "world-money"),
      topic(8, 2, {
        title: "Tech and your future job",
        summary: "How technology might change the work you want to do.",
        task: "Explain how AI or tech could change your future work, with one benefit and one risk.",
        successCriteria: ["Names one benefit and one risk", "Uses at least one “if … would …” sentence"],
        opener: "Let's look ahead. How do you think AI and tech will change the kind of work you want to do?",
      }),
      topic(8, 3, {
        title: "If you could live anywhere",
        summary: "Dream a little: where, why, and what would change.",
        task: "Describe where you would live if you could choose anywhere, and how your life would be different.",
        successCriteria: ["Uses “if I could …, I would …”", "Gives at least two reasons"],
        opener: "If you could live anywhere in the world for a year, where would you go?",
      }),
      lib(8, 4, "world-news"),
      check(8, 5),
    ],
  },
  {
    week: 9,
    title: "Living abroad",
    goal: "Handle housing, health and paperwork in English without freezing.",
    focus: "Explain clearly in steps: first…, then…, the problem is… .",
    targets: ["missing_be", "online_not_at_internet"],
    words: [
      w("lease", "a contract for renting a home", "חוזה שכירות", "The lease is for one year."),
      w("deposit", "money paid first as security", "פיקדון", "I paid a two-month deposit."),
      w("to apply for", "to formally ask for something", "להגיש בקשה ל", "I applied for a work visa."),
      w("symptoms", "signs that you are sick", "תסמינים", "My symptoms started on Monday."),
      w("prescription", "a doctor's note for medicine", "מרשם", "Do I need a prescription for this?"),
      w("to be entitled to", "to have a right to", "להיות זכאי ל", "You're entitled to a refund."),
      w("paperwork", "forms and documents", "ניירת", "There's so much paperwork."),
      w("to settle in", "to get used to a new place", "להתאקלם", "It took me a month to settle in."),
    ],
    days: [
      lib(9, 1, "abroad-renting"),
      lib(9, 2, "abroad-doctor"),
      topic(9, 3, {
        title: "Settling into a new country",
        summary: "Your first month abroad: what was hard, what helped.",
        task: "Imagine your first month living abroad: describe two challenges and how you handled them.",
        successCriteria: ["Describes two challenges", "Explains how he handled each one"],
        opener: "Imagine it's your first month living abroad. What do you think would be the hardest part?",
      }),
      topic(9, 4, {
        title: "Dealing with paperwork",
        summary: "A clerk at a government office. Get your form accepted.",
        task: "Get help from a clerk to fill in a residence form: ask what you need and clarify two things.",
        successCriteria: ["Asks what documents he needs", "Asks the clerk to clarify at least two things"],
        opener: "Next, please. Hi, how can I help you today?",
      }),
      lib(9, 5, "abroad-bank-phone"),
    ],
  },
  {
    week: 10,
    title: "Persuading and negotiating",
    goal: "Ask for what you want, soften it, and find a deal both sides accept.",
    focus: "Soften it: “I was wondering if…”, “Would you consider…?”, “What if we…?”.",
    targets: ["office_idioms"],
    words: [
      w("to compromise", "to agree by each side giving a little", "להתפשר", "We both had to compromise."),
      w("to concede", "to admit or give up a point", "לוותר על נקודה, להודות", "I'll concede that it's expensive."),
      w("reasonable", "fair and sensible", "סביר", "That sounds reasonable."),
      w("counteroffer", "a new offer in reply to one", "הצעה נגדית", "They made a counteroffer."),
      w("to propose", "to suggest formally", "להציע", "I'd like to propose a different plan."),
      w("mutually", "for both sides", "הדדית", "a mutually beneficial deal"),
      w("terms", "the conditions of an agreement", "תנאים", "Let's agree on the terms."),
      w("to justify", "to give good reasons for", "להצדיק", "Can you justify the price?"),
    ],
    days: [
      lib(10, 1, "work-negotiate"),
      topic(10, 2, {
        title: "Asking for a raise",
        summary: "Your tutor plays your manager. Make your case.",
        task: "Ask your manager for a raise: give two reasons based on your results and respond to their concern.",
        successCriteria: [
          "Asks clearly and politely",
          "Gives two reasons based on results",
          "Handles the concern calmly",
        ],
        opener: "Come in, sit down. You wanted to talk to me about something?",
      }),
      lib(10, 3, "work-feedback"),
      topic(10, 4, {
        title: "Convince a friend",
        summary: "Get a friend to try something you love.",
        task: "Convince your friend to try something you love (a sport, a place, a book). Answer their doubts.",
        successCriteria: ["Gives at least two convincing reasons", "Answers at least one doubt"],
        opener: "Okay, you keep telling me about this thing you love. Convince me. Why should I try it?",
      }),
      lib(10, 5, "work-present-idea"),
    ],
  },
  {
    week: 11,
    title: "Stories and ideas",
    goal: "Tell a story people want to hear and talk about ideas with some depth.",
    focus: "Link your ideas: “meanwhile”, “as a result”, “it turned out that…”.",
    targets: [],
    words: [
      w("meanwhile", "at the same time", "בינתיים, באותו זמן", "Meanwhile, my friend was waiting outside."),
      w("consequently", "as a result", "כתוצאה מכך", "I missed the bus and consequently was late."),
      w(
        "ironically",
        "in a way that is the opposite of what you expect",
        "באופן אירוני",
        "Ironically, the shortcut took longer.",
      ),
      w("to turn out", "to end up being", "להתברר", "It turned out he was right."),
      w("to reflect on", "to think carefully about", "להרהר ב, לחשוב על", "I reflected on what went wrong."),
      w("striking", "very noticeable", "בולט, מרשים", "The difference was striking."),
      w("to highlight", "to make something stand out", "להדגיש", "I want to highlight one point."),
      w("nuance", "a small but important difference", "ניואנס, דקות", "There's a nuance here."),
    ],
    days: [
      lib(11, 1, "free-book"),
      lib(11, 2, "world-news"),
      lib(11, 3, "world-israel"),
      topic(11, 4, {
        title: "A story you love telling",
        summary: "That one story you always tell. Tell it well.",
        task: "Tell a funny or surprising story from your life, with a beginning, a twist and an ending.",
        successCriteria: [
          "Clear beginning, middle and end",
          "Uses linking words like “then”, “meanwhile”, “in the end”",
        ],
        opener: "Everyone has that one story they love telling. What's yours?",
      }),
      topic(11, 5, {
        title: "Something that surprised you",
        summary: "Something you saw, read or learned lately that surprised you.",
        task: "Talk about something that surprised you lately and what it made you think about.",
        successCriteria: ["Explains what surprised him", "Reflects on why it matters to him"],
        opener: "What's something that surprised you recently? Something you saw, read, or found out?",
      }),
    ],
  },
  {
    week: 12,
    title: "The full interview",
    goal: "Get through a full 15-minute interview calmly, then measure how far you've come.",
    focus: "Fewer fillers (“like”, “um”): pause instead, then say the full sentence.",
    targets: ["answer_all_parts", "present_perfect_duration"],
    words: [
      w("to elaborate", "to explain in more detail", "להרחיב", "Could you elaborate on that?"),
      w("to articulate", "to express clearly", "לנסח בבהירות", "She articulated her ideas well."),
      w("versatile", "good at many different things", "רב-גוני, ורסטילי", "I'm a versatile team member."),
      w("to adapt", "to change to fit a new situation", "להסתגל", "I adapt quickly to new tools."),
      w("ambitious", "wanting a lot of success", "שאפתן", "I'm ambitious, but realistic."),
      w("to align with", "to match or fit with", "להתיישר עם, להתאים ל", "My goals align with this role."),
      w("insight", "a deep understanding", "תובנה", "That gave me a new insight."),
      w("to wrap up", "to finish", "לסכם, לסיים", "Let's wrap up with your questions."),
    ],
    days: [
      lib(12, 1, "interview-final"),
      lib(12, 2, "interview-star"),
      lib(12, 3, "interview-mock"),
      topic(12, 4, {
        title: "You, one year from now",
        summary: "Where you see yourself in a year, and the plan to get there.",
        task: "Describe where you want to be in a year and three steps you'll take to get there.",
        successCriteria: ["Describes a clear goal", "Gives three concrete steps"],
        opener: "Picture yourself one year from now. Where are you, and what are you doing?",
      }),
      check(12, 5),
    ],
  },
];

export const PLAN_DAYS: readonly (PlanDay & { week: number; day: number })[] = PLAN.flatMap((wk) =>
  wk.days.map((d, i) => ({ ...d, week: wk.week, day: i + 1 })),
);

export function planDayByKey(key: string) {
  return PLAN_DAYS.find((d) => d.key === key);
}

export function planWeek(week: number): PlanWeek | undefined {
  return PLAN.find((w) => w.week === week);
}

/** A topic day as a full scenario (talk with your own tutor), for scenarioById. */
export function planScenario(id: string): Scenario | undefined {
  if (!id.startsWith("plan-")) return undefined;
  const day = planDayByKey(id.slice("plan-".length));
  if (!day?.topic) return undefined;
  const week = planWeek(day.week)!;
  return {
    id,
    category: "free",
    title: day.topic.title,
    summary: day.topic.summary,
    voiceId: null,
    setting: `A plan conversation (week ${week.week}: ${week.title}) with your own tutor`,
    task: day.topic.task,
    successCriteria: day.topic.successCriteria,
    targets: week.targets,
    phrases: week.words.slice(0, 4).map((x) => x.text),
    opener: day.topic.opener,
    minutes: 10,
    tutorNotes: `This week's focus: ${week.focus} Give him natural chances to practice it.`,
    hidden: true,
  };
}
