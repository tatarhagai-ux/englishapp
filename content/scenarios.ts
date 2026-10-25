/**
 * Scenario library. Every scenario must earn its place: it serves one of Hagai's goals for
 * the year (job interview, confident free talk, life abroad), targets at least one of his
 * recurring mistakes, and ends with a task the analyzer can check as done or not done.
 */

export type ScenarioCategory = "interview" | "free" | "work" | "abroad" | "world";

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  /** One line shown on the card: what you will do. */
  summary: string;
  /** Voice id from content/voices.ts, or null to talk with your own tutor. */
  voiceId: string | null;
  /** Who the AI plays (for roleplays). */
  role?: string;
  setting: string;
  /** The learner's goal. Shown before starting, checked in the report. */
  task: string;
  /** Concrete things the analyzer checks to decide whether the task was completed. */
  successCriteria: string[];
  /** Structures the AI should give natural chances to use (keys from learner-seed or plain text). */
  targets: string[];
  /** Phrases worth trying. Shown as optional help, saved to the phrase bank after use. */
  phrases: string[];
  /** The AI's first line. Short, natural, ends with a question. */
  opener: string;
  minutes: number;
  /** Extra instructions for the AI in this scenario only. */
  tutorNotes?: string;
  /** Not listed in the library (e.g. the placement chat, reached from Home). */
  hidden?: boolean;
}

export const CATEGORY_INFO: Record<ScenarioCategory, { label: string; goal: string }> = {
  interview: { label: "Job interview", goal: "Pass a job interview in English" },
  free: { label: "Free talk", goal: "Talk freely and confidently" },
  work: { label: "At work", goal: "Talk freely and confidently" },
  abroad: { label: "Life abroad", goal: "Travel and live abroad" },
  world: { label: "World & ideas", goal: "Talk freely and confidently" },
};

export const PLACEMENT_ID = "placement";

export const SCENARIOS: readonly Scenario[] = [
  // Placement: a short chat that climbs from easy to hard so the analyzer can place him.
  {
    id: PLACEMENT_ID,
    category: "free",
    title: "Speaking level check",
    summary: "Five questions that get a little harder each time. No corrections, just talk.",
    voiceId: null,
    setting: "A relaxed level check with your tutor",
    task: "Answer five questions as fully as you can. Long answers help us measure you better.",
    successCriteria: ["Answers at least four questions", "Gives at least one answer of three sentences or more"],
    targets: ["present_perfect_duration", "answer_all_parts"],
    phrases: ["To be honest…", "It depends on…", "For example…", "If I could…"],
    opener:
      "Let's find your level. No stress, there are no wrong answers. First, tell me a bit about yourself: what do you do these days?",
    minutes: 4,
    hidden: true,
    tutorNotes: `This is a placement check. Ask exactly five questions, one per turn, each a little harder:
1 (already asked) about himself now. 2 a past experience he remembers well. 3 his plans for the next few years. 4 his opinion on something that matters to him, and why. 5 a hypothetical: what he would change if he could.
Do not correct anything. React in a few words, then ask the next question. After his fifth answer, thank him and say his report is ready.`,
  },

  // Job interview track (5). Completing all five unlocks "Interview ready".
  {
    id: "interview-about-you",
    category: "interview",
    title: "Tell me about yourself",
    summary: "The opening question of every interview. Give a clear 60-second story.",
    voiceId: "andrew",
    role: "Daniel, a friendly hiring manager at a cloud services company, interviewing for a junior cloud support role",
    setting: "First-round video interview",
    task: "Introduce yourself in about a minute: where you are now, what you've done, and why you're applying.",
    successCriteria: [
      "Describes current situation (present / present perfect)",
      "Mentions at least one past experience with a concrete detail",
      "Says why they want this kind of role",
    ],
    targets: ["present_perfect_duration", "answer_all_parts"],
    phrases: ["I've been working on…", "Right now I'm…", "What drew me to this role is…", "Before that, I…"],
    opener: "Thanks for joining today. To start, could you tell me a little about yourself?",
    minutes: 8,
  },
  {
    id: "interview-why-role",
    category: "interview",
    title: "Why this role, why us?",
    summary: "Show you know what you want and that you did your homework.",
    voiceId: "sonia",
    role: "Claire, a recruiter at a fast-growing tech company in London",
    setting: "Phone screen with a recruiter",
    task: "Explain why you want this role and this company, and connect it to your own goals.",
    successCriteria: [
      "Gives at least two reasons for the role",
      "Connects the role to a personal goal",
      "Asks the recruiter one relevant question",
    ],
    targets: ["looking_forward_to_ing", "answer_all_parts"],
    phrases: [
      "What really appeals to me is…",
      "I'm looking forward to…",
      "It fits where I want to be in…",
      "Could you tell me more about…?",
    ],
    opener: "Hi, thanks for taking the call. So, what made you apply for this position?",
    minutes: 8,
  },
  {
    id: "interview-strengths",
    category: "interview",
    title: "Strengths and weaknesses",
    summary: "Talk about yourself honestly without sounding arrogant or negative.",
    voiceId: "neerja",
    role: "Priya, a team lead interviewing for her support team",
    setting: "Second-round interview",
    task: "Name one real strength with an example, and one weakness with what you're doing about it.",
    successCriteria: [
      "Names a strength and backs it with an example",
      "Names a genuine weakness (not a disguised strength)",
      "Explains what they do to improve it",
    ],
    targets: ["present_perfect_duration", "missing_be"],
    phrases: ["One of my strengths is…", "For example, when I…", "Something I'm working on is…", "I've started to…"],
    opener: "Let's talk about you a bit more. What would you say is your biggest strength?",
    minutes: 8,
  },
  {
    id: "interview-star",
    category: "interview",
    title: "A challenge you handled",
    summary: "Tell a short story using Situation, Task, Action, Result.",
    voiceId: "ryan",
    role: "Tom, a senior engineer who asks behavioral questions and follows up on details",
    setting: "Behavioral interview",
    task: "Describe a real challenge using STAR: the situation, your task, what you did, and the result.",
    successCriteria: [
      "Sets the situation in the past tense",
      "Explains their own actions (I, not we)",
      "States a clear result or lesson",
    ],
    targets: ["answer_all_parts", "present_perfect_duration"],
    phrases: ["At the time, I was…", "My job was to…", "So what I did was…", "In the end…", "What I learned was…"],
    opener: "Tell me about a time something went wrong and you had to fix it. What happened?",
    minutes: 10,
  },
  {
    id: "interview-final",
    category: "interview",
    title: "Final round: tough questions",
    summary: "Salary expectations, gaps, and your questions for them.",
    voiceId: "ava",
    role: "Rachel, head of the department, direct but fair, at the final interview",
    setting: "Final interview",
    task: "Handle one tough question calmly, and end by asking two good questions of your own.",
    successCriteria: [
      "Answers the tough question without freezing or switching to Hebrew",
      "Asks at least two questions about the team or role",
      "Closes politely",
    ],
    targets: ["answer_all_parts", "office_idioms"],
    phrases: [
      "That's a fair question.",
      "Based on my research…",
      "What does success look like in the first three months?",
      "Thanks for your time today.",
    ],
    opener: "We're nearly done. Before your questions, what are your salary expectations for this role?",
    minutes: 10,
  },

  // Free talk with your own tutor (3).
  {
    id: "free-your-week",
    category: "free",
    title: "Your week",
    summary: "Catch up with your tutor about what you've been doing.",
    voiceId: null,
    setting: "Relaxed chat with your tutor",
    task: "Talk about what you've been doing lately and what's coming up next week.",
    successCriteria: [
      "Describes recent activities (present perfect or past simple)",
      "Talks about at least one future plan",
    ],
    targets: ["present_perfect_duration", "study_for", "looking_forward_to_ing"],
    phrases: ["Lately I've been…", "This week I…", "Next week I'm planning to…", "I'm looking forward to…"],
    opener: "Hey! So, what have you been up to this week?",
    minutes: 10,
  },
  {
    id: "free-ai-tools",
    category: "free",
    title: "AI and the tools you use",
    summary: "Explain the AI tools you build with and what you think about them.",
    voiceId: null,
    setting: "Chat with your tutor about technology",
    task: "Explain one AI tool or automation you use, how it works, and one thing you'd improve.",
    successCriteria: [
      "Explains what the tool does in simple terms",
      "Gives an example of using it",
      "Gives an opinion with a reason",
    ],
    targets: ["missing_be", "noun_modifier_order", "online_not_at_internet"],
    phrases: ["It's basically a tool that…", "It's used for…", "What I like about it is…", "The downside is…"],
    opener: "I heard you've been building things with AI. What's a tool you actually use every week?",
    minutes: 10,
  },
  {
    id: "free-book",
    category: "free",
    title: "A book you're reading",
    summary: "Share the main idea of a book and whether you agree with it.",
    voiceId: null,
    setting: "Book chat with your tutor",
    task: "Summarize the main idea of a book you're reading and say what you agree or disagree with.",
    successCriteria: [
      "Summarizes the main idea in a few sentences",
      "Gives one example from the book",
      "States agreement or disagreement with a reason",
    ],
    targets: ["present_perfect_duration", "answer_all_parts"],
    phrases: [
      "The main idea is that…",
      "The author argues that…",
      "One example he gives is…",
      "I'm not sure I agree, because…",
    ],
    opener: "What are you reading at the moment, and what's it about?",
    minutes: 10,
  },

  // At work (4).
  {
    id: "work-small-talk",
    category: "work",
    title: "Small talk at a conference",
    summary: "Start and keep a light conversation with a stranger at a tech event.",
    voiceId: "william",
    role: "Jack, an easygoing Australian developer at the coffee break of a tech conference",
    setting: "Coffee break at a tech conference in Berlin",
    task: "Introduce yourself, find one thing in common, and end by exchanging contacts.",
    successCriteria: [
      "Introduces themselves",
      "Asks at least two follow-up questions",
      "Closes naturally and suggests staying in touch",
    ],
    targets: ["office_idioms", "present_perfect_duration"],
    phrases: [
      "Mind if I join you?",
      "So what brings you here?",
      "How long have you been working on…?",
      "Let's stay in touch.",
    ],
    opener: "Good coffee, finally! First time at this conference?",
    minutes: 8,
  },
  {
    id: "work-standup",
    category: "work",
    title: "Daily stand-up update",
    summary: "Give a clear, short update: done, doing, blocked.",
    voiceId: "emma",
    role: "Megan, a team lead running a quick daily stand-up",
    setting: "Video stand-up with a remote team",
    task: "Say what you finished yesterday, what you're doing today, and one thing that's blocking you.",
    successCriteria: [
      "Reports yesterday's work in the past",
      "States today's plan",
      "Explains a blocker and asks for help",
    ],
    targets: ["office_idioms", "answer_all_parts"],
    phrases: ["Yesterday I finished…", "Today I'm going to…", "I'm blocked on…", "Could someone help me with…?"],
    opener: "Morning everyone. Hagai, you're up. How's it going?",
    minutes: 6,
  },
  {
    id: "work-delay",
    category: "work",
    title: "Explaining a delay",
    summary: "Tell your manager a task will be late, without over-apologizing.",
    voiceId: "guy",
    role: "Mark, a busy manager who wants facts and a new date",
    setting: "Quick call with your manager",
    task: "Explain why the task is late, give a new realistic date, and offer what you can deliver now.",
    successCriteria: ["Explains the reason briefly", "Gives a specific new date (by …)", "Offers a partial solution"],
    targets: ["present_perfect_duration", "office_idioms"],
    phrases: [
      "I wanted to give you a heads-up.",
      "It's taking longer because…",
      "I can have it ready by…",
      "In the meantime, I can…",
    ],
    opener: "Hey, got a minute? Where are we with the client report?",
    minutes: 6,
  },
  {
    id: "work-negotiate",
    category: "work",
    title: "Negotiating a better deal",
    summary: "Practice calm negotiation: labels, calibrated questions, no splitting the difference.",
    voiceId: "brian",
    role: "Steve, a supplier who starts with a high price and only moves when given good reasons",
    setting: "Negotiating a software license price",
    task: "Get a better price or better terms using at least one label (“It seems like…”) and one calibrated question (“How am I supposed to…?”).",
    successCriteria: [
      "Uses a label such as “It seems like…” or “It sounds like…”",
      "Asks a calibrated how/what question",
      "Reaches an agreement or a clear next step",
    ],
    targets: ["office_idioms", "missing_be"],
    phrases: ["It seems like…", "How am I supposed to do that?", "What would it take to…?", "That's a fair point."],
    opener: "So, for the annual license we're looking at twelve thousand dollars. Does that work for you?",
    minutes: 10,
  },

  // Life abroad (5).
  {
    id: "abroad-airport",
    category: "abroad",
    title: "Problem at the airport",
    summary: "Your flight is overbooked. Get yourself on another one.",
    voiceId: "natasha",
    role: "Kate, a busy but helpful airline agent at the check-in desk",
    setting: "Check-in desk at Sydney airport",
    task: "Find out your options and get a confirmed seat on another flight, plus a meal voucher.",
    successCriteria: ["Explains the problem clearly", "Asks about options", "Gets a confirmed alternative"],
    targets: ["missing_be", "answer_all_parts"],
    phrases: [
      "I was told that…",
      "What are my options?",
      "Is there any way to…?",
      "Could you confirm that in writing?",
    ],
    opener: "Next, please. Hi there, I'm sorry, this flight is overbooked. Can I see your passport?",
    minutes: 6,
  },
  {
    id: "abroad-hotel",
    category: "abroad",
    title: "Complaint at the hotel",
    summary: "Your room isn't what you booked. Fix it politely but firmly.",
    voiceId: "ryan",
    role: "Oliver, a polite hotel receptionist who first offers a small discount",
    setting: "Hotel reception in London",
    task: "Explain the problem and get a different room or a real solution, staying polite.",
    successCriteria: [
      "Describes the problem with details",
      "Rejects a weak offer politely",
      "Gets an acceptable solution",
    ],
    targets: ["missing_be", "online_not_at_internet"],
    phrases: [
      "I booked… but…",
      "It says online that…",
      "I'm afraid that doesn't really work for me.",
      "Would it be possible to…?",
    ],
    opener: "Good evening, how can I help you?",
    minutes: 6,
  },
  {
    id: "abroad-doctor",
    category: "abroad",
    title: "At the doctor",
    summary: "Describe symptoms and understand the instructions.",
    voiceId: "jenny",
    role: "Dr. Lisa Moore, a calm GP at a walk-in clinic",
    setting: "Walk-in clinic in New York",
    task: "Explain your symptoms and how long you've had them, and repeat back the doctor's instructions.",
    successCriteria: [
      "Describes symptoms",
      "Says how long (I've had it for…)",
      "Repeats back the instructions correctly",
    ],
    targets: ["present_perfect_duration", "answer_all_parts"],
    phrases: ["I've had… for…", "It hurts when I…", "Just to make sure I understand…", "How often should I take it?"],
    opener: "Hi, have a seat. So what brings you in today?",
    minutes: 6,
  },
  {
    id: "abroad-renting",
    category: "abroad",
    title: "Renting an apartment",
    summary: "Ask the right questions before signing a lease.",
    voiceId: "prabhat",
    role: "Raj, a landlord showing an apartment, eager to sign quickly",
    setting: "Apartment viewing in Toronto",
    task: "Ask about rent, bills, deposit and the lease length, and negotiate one thing.",
    successCriteria: ["Asks at least three practical questions", "Clarifies what's included", "Negotiates one term"],
    targets: ["missing_be", "answer_all_parts"],
    phrases: [
      "Is that including bills?",
      "How much is the deposit?",
      "Is the rent negotiable?",
      "Could we do a six-month lease?",
    ],
    opener: "Welcome, come in! So this is the place. What do you think so far?",
    minutes: 8,
  },
  {
    id: "abroad-neighbor",
    category: "abroad",
    title: "Meeting a neighbor",
    summary: "Everyday chat with someone who just moved in next door.",
    voiceId: "emma",
    role: "Sarah, a chatty neighbor who just moved into the building",
    setting: "Hallway of your building",
    task: "Introduce yourself, tell her how long you've lived there, and give her one useful local tip.",
    successCriteria: ["Introduces themselves", "Uses I've lived / I've been living here for…", "Gives a local tip"],
    targets: ["present_perfect_duration", "online_not_at_internet"],
    phrases: [
      "I've been living here for…",
      "If you need anything…",
      "There's a great place nearby…",
      "Nice to meet you!",
    ],
    opener: "Oh hi! I just moved in next door. Have you been living here long?",
    minutes: 6,
  },

  // World and ideas (3).
  {
    id: "world-news",
    category: "world",
    title: "What's in the news",
    summary: "Pick a story you've followed and discuss it.",
    voiceId: null,
    setting: "Discussion with your tutor",
    task: "Summarize a news story you've been following and give your opinion with one argument.",
    successCriteria: ["Summarizes what happened", "Gives an opinion", "Supports it with a reason or example"],
    targets: ["present_perfect_duration", "answer_all_parts"],
    phrases: ["I've been following…", "From what I've read…", "In my opinion…", "On the other hand…"],
    opener: "Is there a news story you've been following lately? What's going on with it?",
    minutes: 10,
  },
  {
    id: "world-ai-jobs",
    category: "world",
    title: "Will AI take our jobs?",
    summary: "A friendly debate. Your tutor takes the other side.",
    voiceId: null,
    setting: "Friendly debate with your tutor",
    task: "Defend your position with two arguments and respond to one counterargument.",
    successCriteria: ["States a position", "Gives two arguments", "Responds to a counterargument"],
    targets: ["missing_be", "answer_all_parts"],
    phrases: ["I'd argue that…", "That's true, but…", "Look at…", "At the end of the day…"],
    opener: "Here's a big one: in ten years, will AI have taken more jobs than it created? What do you think?",
    minutes: 10,
  },
  {
    id: "world-money",
    category: "world",
    title: "Money and investing",
    summary: "Explain your approach to saving and long-term investing.",
    voiceId: null,
    setting: "Chat with your tutor",
    task: "Explain your long-term investing approach and why it suits you.",
    successCriteria: ["Explains the approach", "Uses at least two finance words correctly", "Gives a reason"],
    targets: ["noun_modifier_order", "missing_be"],
    phrases: ["My approach is to…", "It's a long-term thing.", "An index fund is…", "The idea is that…"],
    opener: "Money talk! Some people save, some invest, some do neither. What's your approach?",
    minutes: 8,
  },
];

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
