import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format KZT price with thin space separator: 1234567 → "1 234 567 ₸" */
export function formatPrice(value: number | string, currency = "₸"): string {
  const n = typeof value === "string" ? Number(value) : value;
  const formatted = n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
  return `${formatted}\u00A0${currency}`;
}

/** Stock status badge text + color */
export function stockStatusInfo(status: string): { label: string; tone: "success" | "warning" | "danger" } {
  switch (status) {
    case "IN_STOCK":
      return { label: "В наличии", tone: "success" };
    case "LOW_STOCK":
      return { label: "Мало", tone: "warning" };
    case "OUT_OF_STOCK":
      return { label: "Нет в наличии", tone: "danger" };
    default:
      return { label: status, tone: "warning" };
  }
}

export function segmentLabel(segment: string): string {
  switch (segment) {
    case "ENTERPRISE":
      return "HoReCa / ресторан";
    case "SMB_REPLENISHMENT":
      return "Кондитерская";
    case "MICRO_GROUPBUY":
      return "Самозанятый кондитер";
    default:
      return segment;
  }
}
