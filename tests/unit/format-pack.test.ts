import { describe, expect, it } from "vitest";
import { localizePackLabel } from "@/lib/format-pack";

describe("localizePackLabel", () => {
  it("passes RU labels through unchanged on locale=ru", () => {
    expect(localizePackLabel("10 кг", "ru")).toBe("10 кг");
    expect(localizePackLabel("12 шт", "ru")).toBe("12 шт");
    expect(localizePackLabel("1 л", "ru")).toBe("1 л");
  });

  it("transliterates common unit suffixes on locale=en", () => {
    expect(localizePackLabel("10 кг", "en")).toBe("10 kg");
    expect(localizePackLabel("12 шт", "en")).toBe("12 pcs");
    expect(localizePackLabel("1 л", "en")).toBe("1 L");
    expect(localizePackLabel("500 мл", "en")).toBe("500 mL");
    expect(localizePackLabel("250 г", "en")).toBe("250 g");
    expect(localizePackLabel("100 гр", "en")).toBe("100 g");
  });

  it("translates upak/up abbreviations to pack", () => {
    expect(localizePackLabel("3 упак", "en")).toBe("3 pack");
    expect(localizePackLabel("3 уп.", "en")).toBe("3 pack");
    expect(localizePackLabel("3 уп", "en")).toBe("3 pack");
  });

  it("does not translate product brand or name parts", () => {
    expect(localizePackLabel("Шокодель 10 кг", "en")).toBe("Шокодель 10 kg");
    expect(localizePackLabel("Barry Callebaut 500 г", "en")).toBe("Barry Callebaut 500 g");
  });

  it("does NOT touch suffixes embedded in words (word-boundary)", () => {
    // "Любимо" should NOT lose its 'м' even though "ml" maps to mL —
    // this guards against false-positive substring replacement.
    expect(localizePackLabel("Любимо 10 кг", "en")).toBe("Любимо 10 kg");
  });

  it("handles null and empty inputs", () => {
    expect(localizePackLabel(null, "en")).toBe("");
    expect(localizePackLabel(undefined, "en")).toBe("");
    expect(localizePackLabel("", "en")).toBe("");
  });

  it("is a no-op for non-en locales", () => {
    expect(localizePackLabel("10 кг", "kz")).toBe("10 кг");
    expect(localizePackLabel("10 кг", "fr")).toBe("10 кг");
  });

  it("handles multiple unit suffixes in one label", () => {
    expect(localizePackLabel("12 шт по 250 г", "en")).toBe("12 pcs по 250 g");
  });
});
