import { describe, expect, it } from "vitest";
import { googleCalendarUrl, reminderIcs } from "@/lib/reminder/calendar";

const input = { time: "12:30", url: "https://speakwise.example/", minutes: 12, startDay: "2026-10-27" };

describe("daily reminder", () => {
  it("builds a daily recurring calendar event at local time", () => {
    const ics = reminderIcs(input, new Date("2026-10-26T10:00:00Z"));
    expect(ics).toContain("DTSTART:20261027T123000\r\n");
    expect(ics).toContain("DTEND:20261027T124200\r\n");
    expect(ics).toContain("RRULE:FREQ=DAILY\r\n");
    expect(ics).toContain("TRIGGER:PT0M");
    expect(ics).toContain("DESCRIPTION:12 minutes of speaking today. Open: https://speakwise.example/");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("wraps past midnight and escapes text", () => {
    const ics = reminderIcs({ ...input, time: "23:55", minutes: 10 });
    expect(ics).toContain("DTEND:20261028T000500");
    expect(reminderIcs({ ...input, url: "a,b;c" })).toContain("Open: a\\,b\;c");
  });

  it("prefills Google Calendar with the same event", () => {
    const url = new URL(googleCalendarUrl(input));
    expect(url.searchParams.get("dates")).toBe("20261027T123000/20261027T124200");
    expect(url.searchParams.get("recur")).toBe("RRULE:FREQ=DAILY");
  });
});
