import { describe, expect, it } from "vitest";
import { pickLocalized } from "@/lib/i18n-field";

describe("pickLocalized", () => {
  it("returns the base field for the default (RU) locale", () => {
    const row = { name: "Сгущёнка", nameEn: "Condensed milk", nameKz: "Қойыртпақ" };
    expect(pickLocalized(row, "ru", "name")).toBe("Сгущёнка");
  });

  it("returns nameEn on locale=en when present", () => {
    const row = { name: "Сгущёнка", nameEn: "Condensed milk" };
    expect(pickLocalized(row, "en", "name")).toBe("Condensed milk");
  });

  it("falls back to base when the English variant is missing", () => {
    const row = { name: "Сгущёнка", nameEn: null };
    expect(pickLocalized(row, "en", "name")).toBe("Сгущёнка");
  });

  it("falls back to base when the English variant is an empty string", () => {
    const row = { name: "Сгущёнка", nameEn: "  " };
    expect(pickLocalized(row, "en", "name")).toBe("Сгущёнка");
  });

  it("returns nameKz on locale=kz when present", () => {
    const row = { name: "Сгущёнка", nameKz: "Қойыртпақ" };
    expect(pickLocalized(row, "kz", "name")).toBe("Қойыртпақ");
  });

  it("works for arbitrary field names (description)", () => {
    const row = {
      description: "Описание",
      descriptionEn: "Description",
      descriptionKz: "Сипаттама",
    };
    expect(pickLocalized(row, "en", "description")).toBe("Description");
    expect(pickLocalized(row, "kz", "description")).toBe("Сипаттама");
    expect(pickLocalized(row, "ru", "description")).toBe("Описание");
  });

  it("returns empty string when base is null and locale has no variant", () => {
    const row: { name?: string | null; nameEn?: string | null } = { name: null, nameEn: null };
    expect(pickLocalized(row, "en", "name")).toBe("");
  });
});
