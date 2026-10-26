/**
 * A daily practice reminder without a server: a recurring calendar event. The phone's (or
 * the office computer's) calendar does the reminding, and the event links back to the app.
 * Times are "floating" (no time zone), so they follow the device's local time.
 */

export interface ReminderInput {
  /** "HH:MM", 24-hour. */
  time: string;
  /** App address the event links to. */
  url: string;
  minutes: number;
  /** First day, YYYY-MM-DD. */
  startDay: string;
}

const TITLE = "Speakwise: English practice";

function stamp(day: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = day.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  // UTC arithmetic only to roll the date over midnight; the result is written as local time.
  const t = new Date(Date.UTC(y, mo - 1, d, h, m + addMinutes));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function description(input: ReminderInput): string {
  return `${input.minutes} minutes of speaking today. Open: ${input.url}`;
}

/** An .ics file most calendars accept (iPhone, Google, Outlook). */
export function reminderIcs(input: ReminderInput, now = new Date()): string {
  const dtstamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Speakwise//Daily reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:speakwise-daily-${input.startDay}-${input.time.replace(":", "")}@speakwise`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${stamp(input.startDay, input.time)}`,
    `DTEND:${stamp(input.startDay, input.time, input.minutes)}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText(TITLE)}`,
    `DESCRIPTION:${escapeText(description(input))}`,
    `URL:${input.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(TITLE)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Google Calendar's "add event" page, prefilled. Handy on Android and in Gmail. */
export function googleCalendarUrl(input: ReminderInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${stamp(input.startDay, input.time)}/${stamp(input.startDay, input.time, input.minutes)}`,
    recur: "RRULE:FREQ=DAILY",
    details: description(input),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
