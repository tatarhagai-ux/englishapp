/**
 * Listening stories: short dialogues in real, natural speech (two voices, different accents),
 * then three questions: the gist, a detail, and one that needs reading between the lines.
 * The transcript stays hidden until he answers, like the listening part of a real exam, and
 * a few useful phrases can go to the word cards afterwards.
 */

export interface StoryLine {
  /** Voice id from content/voices.ts. */
  voice: string;
  name: string;
  text: string;
}

export interface StoryQuestion {
  q: string;
  options: [string, string, string];
  /** Index of the right option. */
  answer: 0 | 1 | 2;
  /** Shown after answering: where it was said. */
  why: string;
}

export interface Story {
  id: string;
  title: string;
  level: "B1" | "B1+" | "B2";
  topic: "work" | "travel" | "daily" | "interview" | "tech";
  setting: string;
  lines: StoryLine[];
  questions: StoryQuestion[];
  phrases: { text: string; meaningEn: string; meaningHe: string }[];
}

export const STORIES: readonly Story[] = [
  {
    id: "s-monday",
    title: "Monday morning",
    level: "B1",
    topic: "work",
    setting: "Two colleagues at the coffee machine",
    lines: [
      { voice: "emma", name: "Kate", text: "Morning! You look exhausted. Rough weekend?" },
      { voice: "brian", name: "Dan", text: "Kind of. My neighbors had a party till three, so I barely slept." },
      { voice: "emma", name: "Kate", text: "Oh no. And we've got the client call at ten, right?" },
      { voice: "brian", name: "Dan", text: "Actually, they pushed it back to two. I got the email last night." },
      { voice: "emma", name: "Kate", text: "Thank God. That gives us time to finish the slides." },
      { voice: "brian", name: "Dan", text: "Exactly. Let me grab a coffee first, then we can go over them together." },
    ],
    questions: [
      {
        q: "Why is Dan tired?",
        options: ["He worked all weekend", "A party next door kept him awake", "He was sick"],
        answer: 1,
        why: "“My neighbors had a party till three, so I barely slept.”",
      },
      {
        q: "When is the client call now?",
        options: ["At ten", "At two", "Tomorrow"],
        answer: 1,
        why: "“They pushed it back to two.”",
      },
      {
        q: "How does Kate feel about the change?",
        options: ["Relieved", "Annoyed", "Confused"],
        answer: 0,
        why: "“Thank God. That gives us time to finish the slides.”",
      },
    ],
    phrases: [
      { text: "rough weekend", meaningEn: "a hard or tiring weekend", meaningHe: "סוף שבוע קשה" },
      { text: "push back", meaningEn: "move to a later time", meaningHe: "לדחות" },
      { text: "go over", meaningEn: "check or review something", meaningHe: "לעבור על" },
    ],
  },
  {
    id: "s-gate",
    title: "Gate change",
    level: "B1",
    topic: "travel",
    setting: "At the airport, a traveler asks an agent",
    lines: [
      { voice: "andrew", name: "Traveler", text: "Hi, sorry. Is this the gate for the flight to Lisbon?" },
      {
        voice: "sonia",
        name: "Agent",
        text: "It was, but it's been moved to gate forty-two. That's at the far end, past the shops.",
      },
      { voice: "andrew", name: "Traveler", text: "Oh no. Is it still leaving at six fifteen?" },
      { voice: "sonia", name: "Agent", text: "There's a short delay. Boarding should start around six thirty." },
      { voice: "andrew", name: "Traveler", text: "OK, so I've got time to get something to eat?" },
      {
        voice: "sonia",
        name: "Agent",
        text: "You should be fine, but keep an eye on the screens, just in case it changes again.",
      },
    ],
    questions: [
      {
        q: "What happened to the flight?",
        options: ["It was cancelled", "It moved to another gate and is a bit late", "It left early"],
        answer: 1,
        why: "“It's been moved to gate forty-two… There's a short delay.”",
      },
      {
        q: "When should boarding start?",
        options: ["Around six fifteen", "Around six thirty", "Around seven"],
        answer: 1,
        why: "“Boarding should start around six thirty.”",
      },
      {
        q: "What does the agent advise?",
        options: ["Go to the gate now", "Watch the screens for changes", "Ask again later"],
        answer: 1,
        why: "“Keep an eye on the screens, just in case it changes again.”",
      },
    ],
    phrases: [
      { text: "at the far end", meaningEn: "at the end that is furthest away", meaningHe: "בקצה הרחוק" },
      { text: "keep an eye on", meaningEn: "watch something carefully", meaningHe: "לשים עין על" },
      { text: "just in case", meaningEn: "to be ready if something happens", meaningHe: "ליתר ביטחון" },
    ],
  },
  {
    id: "s-flat",
    title: "Viewing an apartment",
    level: "B1+",
    topic: "travel",
    setting: "A renter visits a flat in London",
    lines: [
      { voice: "ryan", name: "Agent", text: "So this is the living room. It gets loads of light in the afternoon." },
      { voice: "andrew", name: "Renter", text: "It's nice. Are bills included in the rent?" },
      { voice: "ryan", name: "Agent", text: "Water and internet are. Electricity and gas you'd pay separately." },
      { voice: "andrew", name: "Renter", text: "And how long is the contract?" },
      { voice: "ryan", name: "Agent", text: "Twelve months minimum. You'd also need a deposit of five weeks' rent." },
      {
        voice: "andrew",
        name: "Renter",
        text: "That's quite a lot upfront. Is there any flexibility on the deposit?",
      },
      { voice: "ryan", name: "Agent", text: "I can ask the landlord, but I wouldn't count on it, to be honest." },
    ],
    questions: [
      {
        q: "Which bills are included?",
        options: ["All of them", "Water and internet", "Electricity and gas"],
        answer: 1,
        why: "“Water and internet are. Electricity and gas you'd pay separately.”",
      },
      {
        q: "What worries the renter?",
        options: ["The size of the deposit", "The noise", "The location"],
        answer: 0,
        why: "“That's quite a lot upfront. Is there any flexibility on the deposit?”",
      },
      {
        q: "Will the landlord probably lower the deposit?",
        options: ["Yes, definitely", "Probably not", "The agent already agreed"],
        answer: 1,
        why: "“I can ask… but I wouldn't count on it.”",
      },
    ],
    phrases: [
      { text: "upfront", meaningEn: "paid before, at the start", meaningHe: "מראש" },
      { text: "flexibility on", meaningEn: "room to change something", meaningHe: "גמישות ב" },
      { text: "I wouldn't count on it", meaningEn: "it probably won't happen", meaningHe: "לא הייתי סומך על זה" },
    ],
  },
  {
    id: "s-gym",
    title: "New at the gym",
    level: "B1",
    topic: "daily",
    setting: "Two people between sets",
    lines: [
      { voice: "william", name: "Josh", text: "Hey, are you using this bench, mate?" },
      { voice: "andrew", name: "You", text: "Just one more set, then it's all yours." },
      { voice: "william", name: "Josh", text: "No rush. You new here? Haven't seen you before." },
      { voice: "andrew", name: "You", text: "Yeah, I just signed up last week. I usually train in the evenings." },
      {
        voice: "william",
        name: "Josh",
        text: "Smart. Mornings are packed. If you ever want a spotter, just give me a shout.",
      },
      { voice: "andrew", name: "You", text: "Thanks, I might take you up on that." },
    ],
    questions: [
      {
        q: "What does Josh want?",
        options: ["To use the bench", "To borrow weights", "To join a class"],
        answer: 0,
        why: "“Are you using this bench?”",
      },
      {
        q: "When is the gym busy, according to Josh?",
        options: ["In the evenings", "In the mornings", "At lunchtime"],
        answer: 1,
        why: "“Mornings are packed.”",
      },
      {
        q: "What does Josh offer?",
        options: ["A free class", "To help him while he lifts", "A discount"],
        answer: 1,
        why: "“If you ever want a spotter, just give me a shout.” A spotter watches and helps while you lift.",
      },
    ],
    phrases: [
      { text: "it's all yours", meaningEn: "you can use it now", meaningHe: "כולו שלך" },
      { text: "give me a shout", meaningEn: "tell me, call me", meaningHe: "תקרא לי, תגיד לי" },
      { text: "take you up on that", meaningEn: "accept your offer", meaningHe: "להיענות להצעה" },
    ],
  },
  {
    id: "s-interview-small-talk",
    title: "Before the interview",
    level: "B1+",
    topic: "interview",
    setting: "A recruiter meets a candidate at reception",
    lines: [
      { voice: "jenny", name: "Recruiter", text: "Hi, you must be Hagai. Did you find us OK?" },
      { voice: "andrew", name: "Hagai", text: "Yes, thanks. The directions were really clear." },
      {
        voice: "jenny",
        name: "Recruiter",
        text: "Great. The team's just finishing a meeting, so we'll start in about five minutes. Can I get you some water?",
      },
      { voice: "andrew", name: "Hagai", text: "Water would be great, thank you." },
      {
        voice: "jenny",
        name: "Recruiter",
        text: "Just so you know, it'll be you, me and the team lead. Around forty-five minutes, and we'll leave time for your questions at the end.",
      },
      { voice: "andrew", name: "Hagai", text: "Perfect. I've actually prepared a few." },
    ],
    questions: [
      {
        q: "Why do they have to wait?",
        options: ["The recruiter is late", "The team is finishing a meeting", "The room isn't ready"],
        answer: 1,
        why: "“The team's just finishing a meeting.”",
      },
      {
        q: "Who will be in the interview?",
        options: ["Only the recruiter", "The recruiter and the team lead", "The whole team"],
        answer: 1,
        why: "“It'll be you, me and the team lead.”",
      },
      {
        q: "What does Hagai's last line show?",
        options: ["He's nervous", "He's prepared", "He's in a hurry"],
        answer: 1,
        why: "“I've actually prepared a few.”",
      },
    ],
    phrases: [
      {
        text: "Did you find us OK?",
        meaningEn: "a polite question: was it easy to get here?",
        meaningHe: "הגעת בקלות?",
      },
      { text: "just so you know", meaningEn: "I'm telling you this to prepare you", meaningHe: "רק שתדע" },
      { text: "leave time for", meaningEn: "keep some time free for", meaningHe: "להשאיר זמן ל" },
    ],
  },
  {
    id: "s-ai-tool",
    title: "The new AI tool",
    level: "B2",
    topic: "tech",
    setting: "A manager and an employee talk about automating reports",
    lines: [
      {
        voice: "guy",
        name: "Mark",
        text: "I heard you've been playing around with that AI tool for the weekly reports.",
      },
      {
        voice: "andrew",
        name: "Hagai",
        text: "Yeah. It pulls the numbers from the spreadsheet and drafts the summary. It cut my time from two hours to about twenty minutes.",
      },
      { voice: "guy", name: "Mark", text: "That's impressive. Any downsides?" },
      {
        voice: "andrew",
        name: "Hagai",
        text: "Sometimes it gets a figure wrong, so I still double-check everything before it goes out.",
      },
      {
        voice: "guy",
        name: "Mark",
        text: "Good. Could you show the rest of the team on Thursday? If it works for them, we could roll it out across the department.",
      },
      { voice: "andrew", name: "Hagai", text: "Sure, I'll put together a quick demo." },
    ],
    questions: [
      {
        q: "What does the tool do?",
        options: ["Sends emails to clients", "Drafts the weekly report from the numbers", "Books meetings"],
        answer: 1,
        why: "“It pulls the numbers from the spreadsheet and drafts the summary.”",
      },
      {
        q: "How much time does Hagai save each week?",
        options: ["About twenty minutes", "About an hour and forty minutes", "Two hours"],
        answer: 1,
        why: "From two hours to about twenty minutes: he saves about an hour and forty minutes.",
      },
      {
        q: "What might happen after Thursday?",
        options: [
          "The tool might be used by the whole department",
          "Hagai will stop using it",
          "Mark will buy a new tool",
        ],
        answer: 0,
        why: "“We could roll it out across the department.”",
      },
    ],
    phrases: [
      { text: "play around with", meaningEn: "try something to see how it works", meaningHe: "להתנסות ב, לשחק עם" },
      { text: "roll out", meaningEn: "start using something widely", meaningHe: "להטמיע, להפיץ" },
      { text: "put together", meaningEn: "prepare, create", meaningHe: "להכין, לארגן" },
    ],
  },
  {
    id: "s-restaurant",
    title: "Wrong order",
    level: "B1",
    topic: "travel",
    setting: "At a restaurant in Sydney",
    lines: [
      { voice: "natasha", name: "Waiter", text: "Here you go, the chicken burger with fries." },
      { voice: "andrew", name: "You", text: "Sorry, I think there's been a mix-up. I ordered the veggie burger." },
      {
        voice: "natasha",
        name: "Waiter",
        text: "Oh, I'm so sorry about that. Let me get that sorted for you right away.",
      },
      { voice: "andrew", name: "You", text: "No worries. Could I get a side salad instead of the fries too?" },
      {
        voice: "natasha",
        name: "Waiter",
        text: "Of course. It'll be about ten minutes. And the drinks are on us, for the trouble.",
      },
    ],
    questions: [
      {
        q: "What was the problem?",
        options: ["The food was cold", "He got the wrong burger", "The bill was wrong"],
        answer: 1,
        why: "“I ordered the veggie burger.”",
      },
      {
        q: "What does he change?",
        options: ["Fries to salad", "Burger to pasta", "Water to juice"],
        answer: 0,
        why: "“Could I get a side salad instead of the fries?”",
      },
      {
        q: "What does “the drinks are on us” mean?",
        options: ["The drinks are on the table", "The drinks are free", "The drinks are coming"],
        answer: 1,
        why: "“On us” = we pay for it.",
      },
    ],
    phrases: [
      { text: "a mix-up", meaningEn: "a mistake where things got confused", meaningHe: "בלבול, טעות" },
      { text: "get it sorted", meaningEn: "fix it", meaningHe: "לסדר את זה" },
      { text: "it's on us", meaningEn: "we'll pay for it", meaningHe: "על חשבוננו" },
    ],
  },
  {
    id: "s-doctor-call",
    title: "Calling the clinic",
    level: "B1+",
    topic: "daily",
    setting: "A phone call to book a doctor's appointment abroad",
    lines: [
      { voice: "neerja", name: "Receptionist", text: "Good morning, Greenfield Clinic, how can I help?" },
      {
        voice: "andrew",
        name: "You",
        text: "Hi, I'd like to make an appointment. I've had a sore throat for about four days and it's getting worse.",
      },
      {
        voice: "neerja",
        name: "Receptionist",
        text: "Are you registered with us?",
      },
      { voice: "andrew", name: "You", text: "No, I'm only here for a few months, for work." },
      {
        voice: "neerja",
        name: "Receptionist",
        text: "That's fine, you can come as a temporary patient. The earliest I have is tomorrow at nine forty. Please bring some ID and arrive ten minutes early to fill in a form.",
      },
      { voice: "andrew", name: "You", text: "Tomorrow at nine forty is perfect. Thank you." },
    ],
    questions: [
      {
        q: "Why is he calling?",
        options: ["He hurt his back", "He has had a sore throat for days", "He needs a prescription refill"],
        answer: 1,
        why: "“I've had a sore throat for about four days.”",
      },
      {
        q: "What's the problem with registering?",
        options: ["He's only there for a few months", "The clinic is full", "He has no insurance"],
        answer: 0,
        why: "“I'm only here for a few months.” He can come as a temporary patient.",
      },
      {
        q: "What should he do tomorrow?",
        options: ["Arrive at 9:40 exactly", "Arrive about 9:30 with ID", "Call again at nine"],
        answer: 1,
        why: "“Bring some ID and arrive ten minutes early.”",
      },
    ],
    phrases: [
      { text: "make an appointment", meaningEn: "book a time to see someone", meaningHe: "לקבוע תור" },
      { text: "registered with", meaningEn: "officially on the list of", meaningHe: "רשום ב" },
      { text: "fill in a form", meaningEn: "complete a document", meaningHe: "למלא טופס" },
    ],
  },
  {
    id: "s-weekend-plans",
    title: "Weekend plans",
    level: "B1",
    topic: "daily",
    setting: "Two friends on the phone",
    lines: [
      { voice: "prabhat", name: "Ravi", text: "Hey! Are you still up for the hike on Saturday?" },
      { voice: "andrew", name: "You", text: "I was, but they're saying it might rain all morning." },
      { voice: "prabhat", name: "Ravi", text: "Hmm. What if we go Sunday instead? It's supposed to clear up." },
      { voice: "andrew", name: "You", text: "Sunday works. Let's leave early though, it gets crowded after ten." },
      { voice: "prabhat", name: "Ravi", text: "Deal. I'll pick you up at seven. Bring snacks, I always forget." },
    ],
    questions: [
      {
        q: "Why do they change the plan?",
        options: ["Ravi is busy", "Rain is expected on Saturday", "The trail is closed"],
        answer: 1,
        why: "“They're saying it might rain all morning.”",
      },
      {
        q: "Why leave early?",
        options: ["It gets crowded later", "It gets too hot", "Ravi works in the afternoon"],
        answer: 0,
        why: "“It gets crowded after ten.”",
      },
      {
        q: "What does Ravi ask him to bring?",
        options: ["Water", "Snacks", "A map"],
        answer: 1,
        why: "“Bring snacks, I always forget.”",
      },
    ],
    phrases: [
      { text: "be up for", meaningEn: "want to do, be ready for", meaningHe: "להיות בעניין של" },
      { text: "clear up", meaningEn: "(weather) become sunny", meaningHe: "להתבהר" },
      { text: "Deal.", meaningEn: "OK, agreed", meaningHe: "סגרנו" },
    ],
  },
  {
    id: "s-investing",
    title: "Saving for the future",
    level: "B2",
    topic: "daily",
    setting: "Two friends talk about money",
    lines: [
      {
        voice: "ryan",
        name: "Tom",
        text: "So I finally opened that investment account. I just have no idea what to buy.",
      },
      {
        voice: "andrew",
        name: "Hagai",
        text: "Honestly, I keep it simple. I put a fixed amount into an index fund every month and basically never touch it.",
      },
      { voice: "ryan", name: "Tom", text: "Don't you get nervous when the market drops?" },
      {
        voice: "andrew",
        name: "Hagai",
        text: "A bit, but I'm thinking fifteen years ahead. If anything, a drop means I'm buying cheaper.",
      },
      { voice: "ryan", name: "Tom", text: "Fair point. What about fees?" },
      {
        voice: "andrew",
        name: "Hagai",
        text: "That's the main thing to check. Even half a percent a year adds up to a lot over time.",
      },
    ],
    questions: [
      {
        q: "What's Hagai's approach?",
        options: ["Picking single stocks", "A fixed monthly amount into an index fund", "Saving cash only"],
        answer: 1,
        why: "“I put a fixed amount into an index fund every month.”",
      },
      {
        q: "How does Hagai see a market drop?",
        options: ["A reason to sell", "A chance to buy cheaper", "A disaster"],
        answer: 1,
        why: "“If anything, a drop means I'm buying cheaper.”",
      },
      {
        q: "Why does he care about fees?",
        options: ["They're illegal", "Small yearly fees grow big over many years", "They change every month"],
        answer: 1,
        why: "“Even half a percent a year adds up to a lot over time.”",
      },
    ],
    phrases: [
      { text: "keep it simple", meaningEn: "don't make it complicated", meaningHe: "לשמור על פשטות" },
      { text: "if anything", meaningEn: "actually, the opposite might be true", meaningHe: "אם כבר" },
      { text: "fair point", meaningEn: "you're right about that", meaningHe: "נקודה הוגנת" },
    ],
  },
];

export function storyById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
