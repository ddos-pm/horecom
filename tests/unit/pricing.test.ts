import { describe, expect, it } from "vitest";
import { getDisplayPrices, formatKzt } from "@/lib/pricing";

describe("getDisplayPrices", () => {
  it("derives subscription -10% and group -18% from base when no overrides", () => {
    const p = getDisplayPrices(1000);
    expect(p.base).toBe(1000);
    expect(p.subscription).toBe(900);
    expect(p.group).toBe(820);
    expect(p.subscriptionSavingsPct).toBe(10);
    expect(p.groupSavingsPct).toBe(18);
  });

  it("accepts a string base price", () => {
    const p = getDisplayPrices("1000");
    expect(p.base).toBe(1000);
    expect(p.subscription).toBe(900);
  });

  it("uses explicit groupPrice override when supplied", () => {
    const p = getDisplayPrices(1000, { groupPrice: 750 });
    expect(p.group).toBe(750);
    expect(p.groupSavingsPct).toBe(25);
    // subscription still derived
    expect(p.subscription).toBe(900);
  });

  it("uses explicit subscriptionPrice override when supplied", () => {
    const p = getDisplayPrices(1000, { subscriptionPrice: 850 });
    expect(p.subscription).toBe(850);
    expect(p.subscriptionSavingsPct).toBe(15);
  });

  it("treats null overrides as 'use default discount'", () => {
    const p = getDisplayPrices(1000, { groupPrice: null, subscriptionPrice: null });
    expect(p.subscription).toBe(900);
    expect(p.group).toBe(820);
  });

  it("rounds derived prices to integer KZT", () => {
    // 333 × 0.9 = 299.7 → 300
    const p = getDisplayPrices(333);
    expect(p.subscription).toBe(300);
  });
});

describe("formatKzt", () => {
  it("formats KZT with ru-RU thin-space grouping and the ₸ suffix", () => {
    expect(formatKzt(1234567)).toMatch(/1[\s ]234[\s ]567[\s ]?₸/);
  });

  it("returns 0 ₸ for zero input", () => {
    expect(formatKzt(0)).toMatch(/^0[\s ]?₸/);
  });
});
