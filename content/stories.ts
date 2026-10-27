/**
 * Listening stories: short dialogues in real, natural speech (two voices, different accents),
 * then three questions: the gist, a detail, and one that needs reading between the lines.
 * The transcript stays hidden until he answers, like the listening part of a real exam, and
 * a few useful phrases can go to the word cards afterwards.
 */

import { RADIO } from "./radio";

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
  {
    id: "s-hotel",
    title: "A noisy room",
    level: "B1+",
    topic: "travel",
    setting: "A guest calls the hotel front desk",
    lines: [
      { voice: "ryan", name: "Front desk", text: "Front desk, Oliver speaking. How can I help?" },
      {
        voice: "andrew",
        name: "Guest",
        text: "Hi, I'm in room three-twelve. There's construction right outside my window, and it's been going since seven.",
      },
      {
        voice: "ryan",
        name: "Front desk",
        text: "I'm really sorry about that. The work should finish by noon, but I understand that doesn't help much.",
      },
      {
        voice: "andrew",
        name: "Guest",
        text: "Not really. I've got calls all morning. Is there any chance of moving to a quieter room?",
      },
      {
        voice: "ryan",
        name: "Front desk",
        text: "Let me check. I've got a room on the other side of the building, on the fifth floor. It's a bit smaller, but it's very quiet.",
      },
      { voice: "andrew", name: "Guest", text: "Smaller is fine. Quiet is what matters." },
      {
        voice: "ryan",
        name: "Front desk",
        text: "Great. I'll send someone up with a new key, and breakfast is on us today.",
      },
    ],
    questions: [
      {
        q: "What's the guest's problem?",
        options: ["The room is dirty", "Construction noise outside", "The Wi-Fi doesn't work"],
        answer: 1,
        why: "“There's construction right outside my window.”",
      },
      {
        q: "What's the downside of the new room?",
        options: ["It's more expensive", "It's a bit smaller", "It has no window"],
        answer: 1,
        why: "“It's a bit smaller, but it's very quiet.”",
      },
      {
        q: "What does the hotel offer to make up for it?",
        options: ["A free night", "Free breakfast today", "A late checkout"],
        answer: 1,
        why: "“Breakfast is on us today.”",
      },
    ],
    phrases: [
      {
        text: "Is there any chance of",
        meaningEn: "a polite way to ask if something is possible",
        meaningHe: "יש סיכוי ש",
      },
      { text: "what matters", meaningEn: "the important thing", meaningHe: "מה שחשוב" },
      { text: "send someone up", meaningEn: "send a person to your room", meaningHe: "לשלוח מישהו למעלה" },
    ],
  },
  {
    id: "s-tech-support",
    title: "The laptop won't connect",
    level: "B1+",
    topic: "tech",
    setting: "An employee calls IT support",
    lines: [
      { voice: "prabhat", name: "IT", text: "IT support, this is Arjun. What seems to be the problem?" },
      {
        voice: "andrew",
        name: "Hagai",
        text: "My laptop won't connect to the office Wi-Fi. It worked fine yesterday.",
      },
      { voice: "prabhat", name: "IT", text: "OK. Have you tried turning the Wi-Fi off and on again?" },
      { voice: "andrew", name: "Hagai", text: "Yeah, twice. I also restarted the laptop. No luck." },
      {
        voice: "prabhat",
        name: "IT",
        text: "Right. There was a password change last night, so your laptop is probably still using the old one. Go to the network settings, forget the network, and log in again with your new password.",
      },
      { voice: "andrew", name: "Hagai", text: "Oh, that makes sense. I didn't even know the password had changed." },
      {
        voice: "prabhat",
        name: "IT",
        text: "The email went out at midnight, so you're not the only one. Give it a try and call back if it's still not working.",
      },
    ],
    questions: [
      {
        q: "What has Hagai already tried?",
        options: ["Nothing yet", "Turning Wi-Fi off and on, and restarting", "Calling his manager"],
        answer: 1,
        why: "“Yeah, twice. I also restarted the laptop.”",
      },
      {
        q: "What's the likely cause?",
        options: ["A broken laptop", "The Wi-Fi password changed", "A virus"],
        answer: 1,
        why: "“There was a password change last night.”",
      },
      {
        q: "Why does IT say “you're not the only one”?",
        options: [
          "The email went out at midnight, so many people missed it",
          "Everyone's laptop is broken",
          "Hagai called twice",
        ],
        answer: 0,
        why: "“The email went out at midnight, so you're not the only one.”",
      },
    ],
    phrases: [
      { text: "What seems to be the problem?", meaningEn: "a polite way to ask what's wrong", meaningHe: "מה הבעיה?" },
      { text: "No luck.", meaningEn: "it didn't work", meaningHe: "בלי הצלחה" },
      { text: "Give it a try", meaningEn: "try it", meaningHe: "תנסה" },
    ],
  },
  {
    id: "s-feedback",
    title: "Feedback from the boss",
    level: "B2",
    topic: "work",
    setting: "A manager gives feedback after a presentation",
    lines: [
      {
        voice: "jenny",
        name: "Rachel",
        text: "Thanks for the presentation this morning. Do you have five minutes to go over it?",
      },
      { voice: "andrew", name: "Hagai", text: "Sure. How do you think it went?" },
      {
        voice: "jenny",
        name: "Rachel",
        text: "Overall, really well. The data was solid, and you handled the questions calmly. That's not easy in front of the directors.",
      },
      { voice: "andrew", name: "Hagai", text: "Thanks. Was there anything you'd change?" },
      {
        voice: "jenny",
        name: "Rachel",
        text: "Just one thing. You spent a long time on the background, so the recommendation came right at the end, when people were already checking their phones. Next time, lead with the main point.",
      },
      { voice: "andrew", name: "Hagai", text: "That's fair. Start with the answer, then explain." },
      {
        voice: "jenny",
        name: "Rachel",
        text: "Exactly. Do that and you'll be ready for the board meeting next month.",
      },
    ],
    questions: [
      {
        q: "What went well?",
        options: ["The jokes", "The data and how he handled questions", "The timing"],
        answer: 1,
        why: "“The data was solid, and you handled the questions calmly.”",
      },
      {
        q: "What should he change?",
        options: ["Use more slides", "Put the main point first", "Speak more slowly"],
        answer: 1,
        why: "“Next time, lead with the main point.”",
      },
      {
        q: "What does Rachel's last line suggest?",
        options: ["He might present at the board meeting", "He lost the project", "The board meeting is cancelled"],
        answer: 0,
        why: "“You'll be ready for the board meeting next month.”",
      },
    ],
    phrases: [
      { text: "go over", meaningEn: "review together", meaningHe: "לעבור על" },
      { text: "lead with", meaningEn: "start with", meaningHe: "לפתוח ב" },
      { text: "That's fair.", meaningEn: "I accept that, it's reasonable", meaningHe: "זה הוגן" },
    ],
  },
  {
    id: "s-flatmate",
    title: "The flatmate talk",
    level: "B1+",
    topic: "daily",
    setting: "Two flatmates in the kitchen",
    lines: [
      { voice: "william", name: "Liam", text: "Hey, got a sec? I wanted to talk about the kitchen." },
      { voice: "andrew", name: "You", text: "Sure. Is it the dishes? I know I left a few last night." },
      {
        voice: "william",
        name: "Liam",
        text: "Yeah, it's not a big deal, but it's been happening a lot lately, and I end up doing them before work.",
      },
      { voice: "andrew", name: "You", text: "Fair enough. Sorry, I've been getting home really late this week." },
      {
        voice: "william",
        name: "Liam",
        text: "No worries. How about a simple rule: whoever cooks, the other one washes up?",
      },
      {
        voice: "andrew",
        name: "You",
        text: "That works for me. And if I can't do them at night, I'll do them first thing in the morning.",
      },
    ],
    questions: [
      {
        q: "What's the issue?",
        options: ["Rent", "Dishes left in the kitchen", "Noise at night"],
        answer: 1,
        why: "“Is it the dishes? I know I left a few last night.”",
      },
      {
        q: "Why has this been happening?",
        options: ["He's been coming home late", "He's been sick", "He doesn't like cooking"],
        answer: 0,
        why: "“I've been getting home really late this week.”",
      },
      {
        q: "What rule do they agree on?",
        options: ["They take turns each week", "Whoever cooks, the other washes up", "They buy a dishwasher"],
        answer: 1,
        why: "“Whoever cooks, the other one washes up.”",
      },
    ],
    phrases: [
      { text: "got a sec?", meaningEn: "do you have a moment?", meaningHe: "יש לך רגע?" },
      { text: "Fair enough.", meaningEn: "that's reasonable, I accept that", meaningHe: "מקובל, הוגן" },
      { text: "That works for me.", meaningEn: "I agree with that plan", meaningHe: "זה מתאים לי" },
    ],
  },
  {
    id: "s-networking",
    title: "Meeting someone at an event",
    level: "B2",
    topic: "work",
    setting: "Two people at a tech meetup",
    lines: [
      {
        voice: "emma",
        name: "Nora",
        text: "Hi, I don't think we've met. I'm Nora, I work on the product team at Cloudly.",
      },
      {
        voice: "andrew",
        name: "Hagai",
        text: "Nice to meet you, I'm Hagai. I'm in the army right now, but I'm really into AI automation.",
      },
      { voice: "emma", name: "Nora", text: "Oh, interesting. What kind of things do you automate?" },
      {
        voice: "andrew",
        name: "Hagai",
        text: "Mostly reports and repetitive office tasks. I built a small tool that turns a spreadsheet into a weekly summary.",
      },
      {
        voice: "emma",
        name: "Nora",
        text: "That's exactly the kind of thing our customers ask about. Are you thinking of doing it professionally after the army?",
      },
      { voice: "andrew", name: "Hagai", text: "That's the plan. I'm trying to learn as much as I can before then." },
      {
        voice: "emma",
        name: "Nora",
        text: "Let's stay in touch. Here's my card, send me a message and I'll tell you about our internship.",
      },
    ],
    questions: [
      {
        q: "What does Hagai automate?",
        options: ["Social media posts", "Reports and repetitive office tasks", "Home devices"],
        answer: 1,
        why: "“Mostly reports and repetitive office tasks.”",
      },
      {
        q: "Why is Nora interested?",
        options: ["Her customers ask about that kind of thing", "She needs a new laptop", "She knows his commander"],
        answer: 0,
        why: "“That's exactly the kind of thing our customers ask about.”",
      },
      {
        q: "What might come from this conversation?",
        options: ["An internship opportunity", "A job in the army", "Nothing at all"],
        answer: 0,
        why: "“Send me a message and I'll tell you about our internship.”",
      },
    ],
    phrases: [
      {
        text: "I don't think we've met.",
        meaningEn: "a friendly way to start talking to someone new",
        meaningHe: "נראה לי שלא הכרנו",
      },
      { text: "I'm really into", meaningEn: "I really like", meaningHe: "אני ממש בקטע של" },
      { text: "stay in touch", meaningEn: "keep contacting each other", meaningHe: "לשמור על קשר" },
    ],
  },
  {
    id: "s-car-rental",
    title: "Picking up a rental car",
    level: "B1+",
    topic: "travel",
    setting: "At a car rental desk abroad",
    lines: [
      { voice: "guy", name: "Agent", text: "Good afternoon. Do you have a reservation with us?" },
      { voice: "andrew", name: "You", text: "Yes, under Tatar. A small car for three days." },
      {
        voice: "guy",
        name: "Agent",
        text: "Got it. Would you like to add full insurance? It's fifteen dollars a day, and it covers any damage with no deposit.",
      },
      { voice: "andrew", name: "You", text: "What happens if I don't take it?" },
      {
        voice: "guy",
        name: "Agent",
        text: "Then we hold five hundred dollars on your credit card, and you'd pay for any damage up to that amount.",
      },
      {
        voice: "andrew",
        name: "You",
        text: "OK, I'll take the full insurance then. And the tank, should I bring it back full?",
      },
      {
        voice: "guy",
        name: "Agent",
        text: "Yes, full to full. If it's not full, we charge for the fuel plus a service fee.",
      },
    ],
    questions: [
      {
        q: "How long is the rental?",
        options: ["One day", "Three days", "A week"],
        answer: 1,
        why: "“A small car for three days.”",
      },
      {
        q: "What happens without full insurance?",
        options: ["He can't rent the car", "They hold $500 on his card", "He pays double"],
        answer: 1,
        why: "“We hold five hundred dollars on your credit card.”",
      },
      {
        q: "What does “full to full” mean?",
        options: [
          "Bring the car back with a full tank",
          "The car is always full of passengers",
          "Pay in full at the start",
        ],
        answer: 0,
        why: "He gets it with a full tank and must return it full, or pay for fuel plus a fee.",
      },
    ],
    phrases: [
      { text: "under", meaningEn: "booked with the name", meaningHe: "על השם" },
      { text: "What happens if", meaningEn: "asking about the result of a choice", meaningHe: "מה קורה אם" },
      { text: "I'll take", meaningEn: "I'll choose / buy", meaningHe: "אני אקח" },
    ],
  },
  {
    id: "s-return",
    title: "Taking it back",
    level: "B1",
    topic: "daily",
    setting: "Returning headphones at an electronics store",
    lines: [
      {
        voice: "brian",
        name: "Customer",
        text: "Hi, I bought these headphones last week, but the left side keeps cutting out.",
      },
      { voice: "jenny", name: "Assistant", text: "Sorry to hear that. Do you have the receipt with you?" },
      { voice: "brian", name: "Customer", text: "I've got it on my phone. Here you go." },
      {
        voice: "jenny",
        name: "Assistant",
        text: "Thanks. Would you like a replacement, or would you rather have a refund?",
      },
      { voice: "brian", name: "Customer", text: "A replacement is fine, as long as it's not the same problem again." },
      {
        voice: "jenny",
        name: "Assistant",
        text: "It's a known issue with the first batch. The new ones have been fixed. If anything goes wrong, just bring them back.",
      },
    ],
    questions: [
      {
        q: "What's wrong with the headphones?",
        options: ["They're too big", "The left side keeps cutting out", "They don't charge"],
        answer: 1,
        why: "“The left side keeps cutting out.”",
      },
      {
        q: "What does the customer choose?",
        options: ["A refund", "A different brand", "A replacement"],
        answer: 2,
        why: "“A replacement is fine.”",
      },
      {
        q: "Why is the assistant confident the new pair will work?",
        options: [
          "The first batch had a problem that's now fixed",
          "They tested them in the store",
          "They're a more expensive model",
        ],
        answer: 0,
        why: "“It's a known issue with the first batch. The new ones have been fixed.”",
      },
    ],
    phrases: [
      { text: "keeps cutting out", meaningEn: "stops working again and again for a moment", meaningHe: "כל הזמן נקטע" },
      { text: "would you rather", meaningEn: "do you prefer", meaningHe: "האם תעדיף" },
      { text: "as long as", meaningEn: "on the condition that", meaningHe: "בתנאי ש, כל עוד" },
      { text: "a known issue", meaningEn: "a problem the company already knows about", meaningHe: "תקלה מוכרת" },
    ],
  },
  {
    id: "s-first-day",
    title: "First day at the office",
    level: "B1",
    topic: "work",
    setting: "A team lead shows a new colleague around",
    lines: [
      { voice: "emma", name: "Noa", text: "Welcome aboard! Let me show you around before the morning meeting." },
      { voice: "andrew", name: "Tom", text: "Thanks. I'm a bit nervous, to be honest. Everything's new." },
      {
        voice: "emma",
        name: "Noa",
        text: "That's normal. Nobody expects you to know everything in your first week. Just ask.",
      },
      { voice: "andrew", name: "Tom", text: "Good to know. Who should I go to if I get stuck with the systems?" },
      {
        voice: "emma",
        name: "Noa",
        text: "Dana sits right next to you. She's been here for years, and she's great at explaining things.",
      },
      { voice: "andrew", name: "Tom", text: "Great. And what's the plan for today?" },
      {
        voice: "emma",
        name: "Noa",
        text: "Take it easy. Read the guides, meet the team, and we'll catch up at four to see how it went.",
      },
    ],
    questions: [
      {
        q: "How does Tom feel?",
        options: ["Bored", "A bit nervous", "Angry about the meeting"],
        answer: 1,
        why: "“I'm a bit nervous, to be honest.”",
      },
      {
        q: "Who should Tom ask about the systems?",
        options: ["Noa", "His manager's boss", "Dana"],
        answer: 2,
        why: "“Dana sits right next to you… she's great at explaining things.”",
      },
      {
        q: "What happens at four?",
        options: ["They catch up to see how the day went", "The whole team goes home", "Tom has a test"],
        answer: 0,
        why: "“We'll catch up at four to see how it went.”",
      },
    ],
    phrases: [
      { text: "Welcome aboard", meaningEn: "welcome to the team", meaningHe: "ברוך הבא לצוות" },
      { text: "show you around", meaningEn: "give you a tour of a place", meaningHe: "לעשות לך סיור" },
      { text: "get stuck", meaningEn: "not know how to continue", meaningHe: "להיתקע" },
      { text: "catch up", meaningEn: "talk to update each other", meaningHe: "להתעדכן" },
    ],
  },
  {
    id: "s-phone-plan",
    title: "A better phone plan",
    level: "B1+",
    topic: "daily",
    setting: "Calling a phone company to change plans",
    lines: [
      { voice: "jenny", name: "Agent", text: "Thanks for holding. How can I help you today?" },
      {
        voice: "guy",
        name: "Customer",
        text: "Hi. I'm paying for 100 gigabytes a month, but I hardly use twenty. I'd like to switch to something cheaper.",
      },
      {
        voice: "jenny",
        name: "Agent",
        text: "Sure, let me pull up your account. You're still in a contract until March, so there might be a small fee.",
      },
      { voice: "guy", name: "Customer", text: "How much are we talking about?" },
      {
        voice: "jenny",
        name: "Agent",
        text: "Actually, I can waive the fee if you stay with us for another year. The 30-gigabyte plan would save you about forty shekels a month.",
      },
      { voice: "guy", name: "Customer", text: "That sounds fair. Let's go with that." },
    ],
    questions: [
      {
        q: "Why does the customer call?",
        options: ["His phone is broken", "He pays for far more data than he uses", "He's moving abroad"],
        answer: 1,
        why: "“I'm paying for 100 gigabytes a month, but I hardly use twenty.”",
      },
      {
        q: "What does the agent offer?",
        options: ["To cancel the fee if he stays another year", "A free new phone", "Unlimited data at the same price"],
        answer: 0,
        why: "“I can waive the fee if you stay with us for another year.”",
      },
      {
        q: "How much will the new plan save him?",
        options: ["About twenty shekels a month", "About a hundred shekels a year", "About forty shekels a month"],
        answer: 2,
        why: "“The 30-gigabyte plan would save you about forty shekels a month.”",
      },
    ],
    phrases: [
      { text: "Thanks for holding", meaningEn: "thank you for waiting on the line", meaningHe: "תודה על ההמתנה" },
      { text: "pull up your account", meaningEn: "open your details on the screen", meaningHe: "לפתוח את החשבון שלך" },
      { text: "How much are we talking about?", meaningEn: "what's the amount, roughly?", meaningHe: "על כמה מדובר?" },
      { text: "waive the fee", meaningEn: "not charge the fee", meaningHe: "לוותר על העמלה" },
    ],
  },
];

export function storyById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id) ?? RADIO.find((s) => s.id === id);
}
