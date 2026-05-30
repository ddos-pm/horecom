import { describe, expect, it } from "vitest";
import { formatPrice, stockStatusInfo, segmentLabel, cn } from "@/lib/utils";

// formatPrice intentionally inserts U+00A0 NBSP between the digits-and-grouping
// block and the currency symbol so the price never breaks mid-render across a
// CSS line wrap. Use the literal here so assertions test the actual output.
const NBSP = " ";

describe("formatPrice", () => {
  it("defaults to ru-RU NBSP grouping + NBSP-before-currency", () => {
    expect(formatPrice(1234567)).toBe(`1${NBSP}234${NBSP}567${NBSP}₸`);
  });

  it("accepts a string input", () => {
    expect(formatPrice("1234567")).toBe(`1${NBSP}234${NBSP}567${NBSP}₸`);
  });

  it("uses en-US comma grouping on locale=en", () => {
    expect(formatPrice(1234567, "₸", "en")).toBe(`1,234,567${NBSP}₸`);
  });

  it("kz locale falls back to ru-RU style (Kazakhstan formal)", () => {
    expect(formatPrice(1234, "₸", "kz")).toBe(`1${NBSP}234${NBSP}₸`);
  });

  it("rounds to zero fractional digits", () => {
    expect(formatPrice(123.74)).toBe(`124${NBSP}₸`);
  });

  it("respects a custom currency symbol", () => {
    expect(formatPrice(100, "$", "en")).toBe(`100${NBSP}$`);
  });
});

describe("stockStatusInfo", () => {
  it("returns RU labels by default", () => {
    expect(stockStatusInfo("IN_STOCK")).toEqual({ label: "В наличии", tone: "success" });
    expect(stockStatusInfo("LOW_STOCK")).toEqual({ label: "Мало", tone: "warning" });
    expect(stockStatusInfo("OUT_OF_STOCK")).toEqual({ label: "Нет в наличии", tone: "danger" });
  });

  it("returns EN labels on locale=en", () => {
    expect(stockStatusInfo("IN_STOCK", "en")).toEqual({ label: "In stock", tone: "success" });
    expect(stockStatusInfo("LOW_STOCK", "en")).toEqual({ label: "Low stock", tone: "warning" });
    expect(stockStatusInfo("OUT_OF_STOCK", "en")).toEqual({ label: "Out of stock", tone: "danger" });
  });

  it("falls back to the raw status with warning tone for unknown values", () => {
    expect(stockStatusInfo("UNKNOWN")).toEqual({ label: "UNKNOWN", tone: "warning" });
  });
});

describe("segmentLabel", () => {
  it("maps segments to RU by default", () => {
    expect(segmentLabel("ENTERPRISE")).toBe("HoReCa / ресторан");
    expect(segmentLabel("SMB_REPLENISHMENT")).toBe("Кондитерская");
    expect(segmentLabel("MICRO_GROUPBUY")).toBe("Самозанятый кондитер");
  });

  it("maps segments to EN on locale=en", () => {
    expect(segmentLabel("ENTERPRISE", "en")).toBe("HoReCa / restaurant");
    expect(segmentLabel("SMB_REPLENISHMENT", "en")).toBe("Bakery");
    expect(segmentLabel("MICRO_GROUPBUY", "en")).toBe("Independent pastry maker");
  });

  it("passes through unknown segments unchanged", () => {
    expect(segmentLabel("FUTURE_SEGMENT", "en")).toBe("FUTURE_SEGMENT");
  });
});

describe("cn (className merger)", () => {
  it("dedupes conflicting Tailwind utilities", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("filters falsy values", () => {
    expect(cn("a", undefined, false && "b", "c")).toBe("a c");
  });
});
