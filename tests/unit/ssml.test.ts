import { describe, expect, it } from "vitest";
import { buildSsml, escapeXml, rateToPercent } from "@/lib/text/ssml";

describe("ssml", () => {
  it("escapes XML special characters", () => {
    expect(escapeXml(`Tom & Jerry's "<show>"`)).toBe("Tom &amp; Jerry&apos;s &quot;&lt;show&gt;&quot;");
  });

  it("maps rates to signed percentages", () => {
    expect(rateToPercent(1)).toBe("+0%");
    expect(rateToPercent(0.75)).toBe("-25%");
    expect(rateToPercent(1.25)).toBe("+25%");
    expect(rateToPercent(0.9)).toBe("-10%");
  });

  it("builds SSML that cannot be broken out of by the text", () => {
    const ssml = buildSsml({
      text: "</prosody></voice><voice name='x'>hi",
      voice: "en-US-AvaMultilingualNeural",
      locale: "en-US",
    });
    expect(ssml).toContain('<voice name="en-US-AvaMultilingualNeural">');
    expect(ssml).not.toContain("<voice name='x'>");
    expect(ssml.match(/<voice /g)).toHaveLength(1);
  });
});
