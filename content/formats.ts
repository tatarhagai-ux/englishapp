/**
 * Conversation formats: the shape of a tutor conversation, chosen fresh each time so the
 * same theme ("your day", "fitness") doesn't turn into the same questions and the same
 * answers. Task-based teaching suggests the kind of task changes what learners have to
 * produce: an argument needs reasons and concessions, a story needs past tenses, a
 * hypothetical needs conditionals, explaining needs precise words. Speaking apps that keep
 * learners (Langua, TalkPal, Speak) mix roleplays, discussions, debates and stories for
 * the same reason.
 *
 * Roleplays keep their own scene; formats are for conversations with his own tutor.
 */
import type { TutorLevel } from "@/lib/learner/adapt";

export interface ConversationFormat {
  id: string;
  title: string;
  /** What he will do, shown before starting. */
  howEn: string;
  howHe: string;
  minLevel: TutorLevel;
  /** How the tutor runs it. `theme` is the topic of the conversation. */
  tutor: (theme: string) => string;
  /** A scripted first line if the fresh one can't be written. */
  starter: (theme: string) => string;
}

export const FORMATS: readonly ConversationFormat[] = [
  {
    id: "deep-dive",
    title: "Deep dive",
    howEn: "One specific question, then deeper and deeper: why, how, what changed.",
    howHe: "שאלה אחת ספציפית, ואז עמוק יותר ויותר: למה, איך, מה השתנה.",
    minLevel: "easier",
    tutor: (t) =>
      `Format: deep dive on "${t}". Open with one specific, unusual question about it (never a generic "how was your day"). Then stay on it and go deeper with each follow-up: reasons, feelings, what changed over time, what he'd do differently.`,
    starter: (t) => `Today let's go deep on one thing: ${t}. What's one detail about it most people wouldn't guess?`,
  },
  {
    id: "story",
    title: "Story time",
    howEn: "Tell one real story from start to finish. Your tutor asks what happened next.",
    howHe: "לספר סיפור אמיתי אחד מההתחלה עד הסוף. המורה שואל מה קרה אחר כך.",
    minLevel: "easier",
    tutor: (t) =>
      `Format: story time, connected to "${t}". Ask him for one real story (a time something went wrong, surprised him, or changed his mind). Let him tell it; ask what happened next, how he felt, how it ended. Gently push past tenses and sequence words (first, then, in the end).`,
    starter: (t) =>
      `Story time. Thinking about ${t}: tell me about a time something didn't go as planned. What happened?`,
  },
  {
    id: "what-if",
    title: "What if…",
    howEn: "Imaginary situations and would-you-rather choices. Explain your choice.",
    howHe: 'מצבים דמיוניים ובחירות של "מה היית מעדיף". להסביר את הבחירה.',
    minLevel: "easier",
    tutor: (t) =>
      `Format: what if, around "${t}". Give him one imaginative hypothetical or would-you-rather choice at a time (three or four in the conversation), and make him explain and defend each choice. This practices conditionals (If I had..., I would...), so recast them naturally if he misses them.`,
    starter: (t) =>
      `Let's play "what if". About ${t}: would you rather have twice the time or twice the money for it? Why?`,
  },
  {
    id: "teach-me",
    title: "Teach me",
    howEn: "You're the expert. Explain something to your tutor, who knows nothing about it.",
    howHe: "אתה המומחה. להסביר משהו למורה, שלא יודע עליו כלום.",
    minLevel: "easier",
    tutor: (t) =>
      `Format: teach me. He is the expert and you are a curious beginner. Pick something within "${t}" that he likely knows well (from what you know about him) and ask him to explain it step by step. Ask naive but sharp questions, ask for an example, and say when something isn't clear so he has to explain it another way.`,
    starter: (t) =>
      `Today you're the teacher. Explain something about ${t} to me like I know nothing. Where do I start?`,
  },
  {
    id: "advice",
    title: "Give advice",
    howEn: "A friend has a problem. Give advice, and defend it when they push back.",
    howHe: "לחבר יש בעיה. לתת עצה, ולהגן עליה כשהוא מתווכח.",
    minLevel: "easier",
    tutor: (t) =>
      `Format: give advice. Describe a realistic problem a friend of yours has, related to "${t}", and ask what he'd advise. Push back on his advice once or twice ("But what if...?") so he has to adjust it. This practices should, could, if I were you.`,
    starter: (t) =>
      `I need your advice. A friend of mine is struggling with ${t}, and nothing he tries works. What would you tell him?`,
  },
  {
    id: "compare",
    title: "Compare and choose",
    howEn: "Two options. Compare them, weigh the pros and cons, and pick one.",
    howHe: "שתי אפשרויות. להשוות, לשקול יתרונות וחסרונות, ולבחור.",
    minLevel: "steady",
    tutor: (t) =>
      `Format: compare and choose. Give him two concrete options related to "${t}" and ask him to compare them and choose. Ask for pros and cons, what would change his mind, and who the other option is better for. This practices comparatives and linking words (whereas, on the other hand).`,
    starter: (t) =>
      `Quick choice about ${t}: the safe, familiar option or the risky new one. Which do you pick, and why?`,
  },
  {
    id: "debate",
    title: "Debate",
    howEn: "Your tutor states an opinion and argues against you. Hold your ground.",
    howHe: "המורה אומר דעה ומתווכח איתך. לעמוד על שלך.",
    minLevel: "steady",
    tutor: (t) =>
      `Format: debate. Start with one bold, arguable statement about "${t}" and ask whether he agrees. Whatever he says, take the other side, politely but firmly, with real arguments. Ask for evidence and examples. Concede only points he earns, and near the end ask him to sum up his position in two sentences.`,
    starter: (t) =>
      `Here's a bold claim about ${t}: most people get it completely wrong. Agree or disagree? Convince me.`,
  },
  {
    id: "solve-it",
    title: "Solve it together",
    howEn: "A real problem with limits (time, money, people). Plan a solution with your tutor.",
    howHe: "בעיה אמיתית עם מגבלות (זמן, כסף, אנשים). לתכנן פתרון יחד עם המורה.",
    minLevel: "steady",
    tutor: (t) =>
      `Format: solve it together. Set up one concrete problem around "${t}" with clear limits (a budget in shekels, a deadline, people involved). Work it out with him: ask for his plan, add one complication halfway, and ask him to adjust and summarize the final plan. Numbers and planning language are welcome.`,
    starter: (t) => `Let's solve a problem. It's about ${t}: you have one week and 500 shekels. What's your plan?`,
  },
  {
    id: "podcast",
    title: "The podcast",
    howEn: "You're the guest on a podcast. The host asks about your experience and opinions.",
    howHe: "אתה האורח בפודקאסט. המנחה שואל על הניסיון והדעות שלך.",
    minLevel: "steady",
    tutor: (t) =>
      `Format: podcast interview. You are a lively podcast host and he is today's guest, talking about "${t}". Introduce him in one line, then ask host-style questions: his story, a surprising lesson, a hot take, advice for listeners. React like a host and ask for examples.`,
    starter: (t) =>
      `Welcome to the show! Today's topic is ${t}, and my guest is Hagai. So, how did you first get into it?`,
  },
  {
    id: "pitch",
    title: "Pitch it",
    howEn: "Pitch an idea (an app, a plan, a change). Your tutor is a skeptical listener.",
    howHe: "להציג רעיון (אפליקציה, תוכנית, שינוי). המורה מקשיב סקפטי.",
    minLevel: "stretch",
    tutor: (t) =>
      `Format: pitch it. Ask him to pitch an idea related to "${t}": a product, a service, or a change he'd make. You are a friendly but skeptical investor: ask about the problem it solves, who would pay, the risks, and why him. Make him answer objections clearly and finish with a one-sentence pitch.`,
    starter: (t) => `You have two minutes to pitch me an idea about ${t}. I'm a skeptical investor. Go!`,
  },
];

export function formatById(id: string | undefined): ConversationFormat | undefined {
  return FORMATS.find((f) => f.id === id);
}

/**
 * Topics for the surprise conversation: his interests (AI, fitness, money, books, the
 * army, travel, languages) mixed with everyday and big-picture ones, so it isn't always
 * about him. Each is a phrase that fits after "about".
 */
export const SURPRISE_TOPICS: readonly { id: string; title: string }[] = [
  { id: "ai-jobs", title: "AI taking over boring work" },
  { id: "ai-agents", title: "building your own AI assistant" },
  { id: "ai-school", title: "AI in schools and exams" },
  { id: "phones", title: "phones and attention" },
  { id: "social-media", title: "social media and real friendships" },
  { id: "fitness-myths", title: "fitness myths people still believe" },
  { id: "crossfit", title: "training hard versus training smart" },
  { id: "sleep", title: "sleep and how we treat it" },
  { id: "food", title: "food you grew up with" },
  { id: "cooking", title: "learning to cook" },
  { id: "saving", title: "saving money in your twenties" },
  { id: "investing", title: "long-term investing versus quick wins" },
  { id: "spending", title: "the best and worst things you've spent money on" },
  { id: "books", title: "a book that changed how you think" },
  { id: "negotiation", title: "negotiating for what you want" },
  { id: "army", title: "what the army teaches you about people" },
  { id: "office-life", title: "office life and small routines" },
  { id: "bosses", title: "what makes a good boss" },
  { id: "remote-work", title: "working from home versus the office" },
  { id: "first-job", title: "choosing a first real job" },
  { id: "freelance", title: "freelancing and being your own boss" },
  { id: "marketing", title: "ads that actually work on people" },
  { id: "languages", title: "learning a language as an adult" },
  { id: "spanish", title: "learning Spanish with an app" },
  { id: "travel-budget", title: "traveling on a small budget" },
  { id: "dream-city", title: "a city you'd love to live in" },
  { id: "moving-abroad", title: "moving abroad for a few years" },
  { id: "tourists", title: "being a good tourist" },
  { id: "habits", title: "habits that stuck and habits that didn't" },
  { id: "mornings", title: "morning people versus night people" },
  { id: "free-time", title: "what to do with free time" },
  { id: "boredom", title: "boredom and why it might be useful" },
  { id: "friendship", title: "keeping old friends close" },
  { id: "family", title: "family traditions" },
  { id: "holidays", title: "holidays and how people celebrate" },
  { id: "music", title: "music that brings back memories" },
  { id: "movies", title: "a movie everyone should see" },
  { id: "series", title: "binge-watching series" },
  { id: "sports-fans", title: "being a sports fan" },
  { id: "games", title: "video games and what they teach" },
  { id: "tech-israel", title: "why Israel has so many startups" },
  { id: "future-cities", title: "what cities will look like in 30 years" },
  { id: "cars", title: "electric cars and the end of gas stations" },
  { id: "climate", title: "small things people do for the planet" },
  { id: "health-tech", title: "apps that track your health" },
  { id: "privacy", title: "privacy online" },
  { id: "news", title: "how people get their news today" },
  { id: "luck", title: "luck versus hard work" },
  { id: "failure", title: "failing and starting again" },
  { id: "risk", title: "taking risks when you're young" },
  { id: "decisions", title: "making big decisions" },
  { id: "advice", title: "the best advice you ever got" },
  { id: "kindness", title: "small acts of kindness" },
  { id: "manners", title: "manners that are disappearing" },
  { id: "shopping", title: "shopping online versus in stores" },
  { id: "minimalism", title: "owning less stuff" },
  { id: "pets", title: "dogs, cats and people who love them" },
  { id: "nature", title: "a place in nature you love" },
  { id: "weather", title: "how weather changes your mood" },
  { id: "space", title: "space travel for normal people" },
  { id: "history", title: "a moment in history you'd like to see" },
  { id: "inventions", title: "the most useful invention of the last 50 years" },
  { id: "education", title: "what school should teach but doesn't" },
  { id: "teachers", title: "a teacher you remember" },
  { id: "volunteering", title: "volunteering and giving time" },
  { id: "competition", title: "competition: motivating or stressful" },
];

export function surpriseTopicById(id: string | undefined): { id: string; title: string } | undefined {
  return SURPRISE_TOPICS.find((t) => t.id === id);
}
