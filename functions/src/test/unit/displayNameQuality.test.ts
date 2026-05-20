import {describe, expect, it} from "vitest";
import {isCleanDisplayName} from "../../lib/displayNameQuality";

describe("isCleanDisplayName", () => {
  it("accepts Hebrew human names", () => {
    expect(isCleanDisplayName("יוסי טיירי")).toBe(true);
    expect(isCleanDisplayName("דוד כהן")).toBe(true);
  });

  it("rejects email and technical handles", () => {
    expect(isCleanDisplayName("yossi@example.com")).toBe(false);
    expect(isCleanDisplayName("joseph.tyren1989.ai")).toBe(false);
    expect(isCleanDisplayName("first-test-account")).toBe(false);
    expect(isCleanDisplayName("yossitery")).toBe(false);
  });

  it("rejects empty and mostly numeric", () => {
    expect(isCleanDisplayName("")).toBe(false);
    expect(isCleanDisplayName("12345678")).toBe(false);
  });
});
