import { describe, expect, it } from "vitest";
import { formatUnit } from "@/lib/units";

describe("formatUnit", () => {
  it("translates common units to RU by default", () => {
    expect(formatUnit("kg")).toBe("кг");
    expect(formatUnit("piece")).toBe("шт");
    expect(formatUnit("pcs")).toBe("шт");
    expect(formatUnit("pack")).toBe("уп");
    expect(formatUnit("l")).toBe("л");
    expect(formatUnit("ml")).toBe("мл");
    expect(formatUnit("g")).toBe("г");
  });

  it("translates to EN on locale=en", () => {
    expect(formatUnit("kg", "en")).toBe("kg");
    expect(formatUnit("piece", "en")).toBe("pc");
    expect(formatUnit("pcs", "en")).toBe("pcs");
    expect(formatUnit("pack", "en")).toBe("pack");
    expect(formatUnit("l", "en")).toBe("L");
    expect(formatUnit("ml", "en")).toBe("mL");
    expect(formatUnit("g", "en")).toBe("g");
  });

  it("translates piece units to KZ Kazakh form", () => {
    expect(formatUnit("piece", "kz")).toBe("дана");
    expect(formatUnit("pcs", "kz")).toBe("дана");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatUnit(null)).toBe("");
    expect(formatUnit(undefined)).toBe("");
  });

  it("falls back to the raw value for unknown units", () => {
    expect(formatUnit("teaspoon")).toBe("teaspoon");
    expect(formatUnit("teaspoon", "en")).toBe("teaspoon");
  });

  it("is case-insensitive on input", () => {
    expect(formatUnit("KG")).toBe("кг");
    expect(formatUnit("Pack", "en")).toBe("pack");
  });
});
