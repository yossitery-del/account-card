import {describe, expect, it} from "vitest";
import {
  balanceDelta,
  effectForType,
  resolveTypeFromIntent,
} from "../../lib/entryIntent";

describe("entry intent and delta helpers", () => {
  it("מחשב type, effect ו-delta ביחס ל-balancePerspectiveUid", () => {
    expect(resolveTypeFromIntent("to_receive", "yossi", "yossi")).toBe("charge");
    expect(effectForType("charge")).toBe("increase");
    expect(balanceDelta("increase", 500)).toBe(500);

    expect(resolveTypeFromIntent("to_receive", "stav", "yossi")).toBe("credit");
    expect(effectForType("credit")).toBe("decrease");
    expect(balanceDelta("decrease", 200)).toBe(-200);
  });
});
