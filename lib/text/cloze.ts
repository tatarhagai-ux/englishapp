/**
 * The example sentence with the word blanked out, for recall on a word card. Tries the exact
 * phrase, then the first word with an ending ("cut down on" in "I'm cutting down on sugar"),
 * with room for an object after it ("push back" in "they pushed it back") and any object
 * pronoun standing in for the phrase's own ("get it sorted" in "get that sorted"). A leading
 * "be" or "it's" is dropped only when the whole phrase isn't there ("be up for" in "are you
 * up for…"). Returns null when the word can't be found, so the card doesn't give it away.
 */
const OBJECTS = ["it", "that", "this", "them", "him", "her", "me", "us", "you"];

export function blankOut(example: string, phrase: string): string | null {
  const full = phrase
    .replace(/["“”]/g, "")
    .replace(/^to\s+/i, "")
    .trim();
  const forms = [full];
  const short = full.replace(/^(be|it's|it is)\s+/i, "");
  if (short !== full && short) forms.push(short);
  for (const form of forms) {
    const hit = blankForm(example, form.split(/\s+/).filter(Boolean));
    if (hit !== null) return hit;
  }
  return null;
}

function blankForm(example: string, words: string[]): string | null {
  if (!words.length) return null;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const objects = `(?:${OBJECTS.join("|")})`;
  const word = (w: string) => (OBJECTS.includes(w.toLowerCase()) ? objects : esc(w));
  const exact = new RegExp(`\\b${words.map(word).join("\\s+")}\\b`, "i");
  if (exact.test(example)) return example.replace(exact, "_____");
  // Inflected first word: work → works/worked/working, cut → cutting, make → making.
  const stem = words[0].replace(/e$/i, "");
  const rest = words.slice(1);
  const room = rest.length && !OBJECTS.includes(rest[0].toLowerCase()) ? `(?:\\s+${objects})?` : "";
  const loose = new RegExp(`\\b${esc(stem)}\\w{0,4}${room}${rest.map((w) => `\\s+${word(w)}`).join("")}\\b`, "i");
  if (stem.length >= 2 && loose.test(example)) return example.replace(loose, "_____");
  return null;
}
