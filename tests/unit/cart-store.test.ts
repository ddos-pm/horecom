import { describe, expect, it } from "vitest";
import {
  type CartItem,
  getCartSubtotal,
  getCartItemCount,
  getDeliveryFee,
  getCartTotal,
  getCartWarnings,
  CART_LIMITS,
} from "@/lib/cart-store";

const sampleItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: "p1",
  slug: "sample",
  name: "Sample",
  image: null,
  price: 1000,
  quantity: 1,
  minOrderQty: 1,
  packLabel: "1 кг",
  unitType: "kg",
  ...overrides,
});

describe("getCartSubtotal", () => {
  it("multiplies price × quantity across items", () => {
    const items = [
      sampleItem({ price: 1000, quantity: 2 }),
      sampleItem({ productId: "p2", price: 500, quantity: 4 }),
    ];
    expect(getCartSubtotal(items)).toBe(4000);
  });

  it("returns 0 for an empty cart", () => {
    expect(getCartSubtotal([])).toBe(0);
  });
});

describe("getCartItemCount", () => {
  it("sums quantities, not line count", () => {
    const items = [
      sampleItem({ quantity: 3 }),
      sampleItem({ productId: "p2", quantity: 7 }),
    ];
    expect(getCartItemCount(items)).toBe(10);
  });
});

describe("getDeliveryFee", () => {
  it("returns 0 for an empty cart", () => {
    expect(getDeliveryFee(0)).toBe(0);
  });

  it("returns DELIVERY_FEE below the free threshold", () => {
    expect(getDeliveryFee(CART_LIMITS.FREE_DELIVERY_THRESHOLD - 1)).toBe(CART_LIMITS.DELIVERY_FEE);
  });

  it("returns 0 at and above the free threshold", () => {
    expect(getDeliveryFee(CART_LIMITS.FREE_DELIVERY_THRESHOLD)).toBe(0);
    expect(getDeliveryFee(CART_LIMITS.FREE_DELIVERY_THRESHOLD + 5000)).toBe(0);
  });
});

describe("getCartTotal", () => {
  it("adds delivery to subtotal when below the free threshold", () => {
    const items = [sampleItem({ price: 10_000, quantity: 1 })]; // 10_000 < 20_000
    expect(getCartTotal(items)).toBe(10_000 + CART_LIMITS.DELIVERY_FEE);
  });

  it("skips delivery once the threshold is met", () => {
    const items = [sampleItem({ price: 20_000, quantity: 1 })];
    expect(getCartTotal(items)).toBe(20_000);
  });

  it("returns 0 for an empty cart", () => {
    expect(getCartTotal([])).toBe(0);
  });
});

describe("getCartWarnings", () => {
  it("returns no warnings for an empty cart", () => {
    expect(getCartWarnings([])).toEqual([]);
  });

  it("flags below-MIN_ORDER_TOTAL in RU by default", () => {
    const items = [sampleItem({ price: 1000, quantity: 1 })]; // 1000 < 5000
    const w = getCartWarnings(items);
    expect(w.some((s) => s.includes("Минимальный заказ"))).toBe(true);
    expect(w.some((s) => s.includes("До минимума"))).toBe(true);
  });

  it("flags below-MIN_ORDER_TOTAL in EN when locale=en", () => {
    const items = [sampleItem({ price: 1000, quantity: 1 })];
    const w = getCartWarnings(items, "en");
    expect(w.some((s) => s.includes("Minimum order"))).toBe(true);
    expect(w.some((s) => s.includes("To reach the minimum"))).toBe(true);
  });

  it("flags below-FREE_DELIVERY_THRESHOLD when MOQ is met", () => {
    const items = [sampleItem({ price: 6000, quantity: 1 })]; // 5000 ≤ 6000 < 20000
    const w = getCartWarnings(items);
    expect(w.some((s) => s.includes("До бесплатной доставки"))).toBe(true);
    // MOQ already met, so MOQ warning should not appear
    expect(w.some((s) => s.includes("Минимальный заказ"))).toBe(false);
  });

  it("returns no warnings once both thresholds are met", () => {
    const items = [sampleItem({ price: 25_000, quantity: 1 })];
    expect(getCartWarnings(items)).toEqual([]);
  });

  it("uses en-US digit grouping in EN warnings", () => {
    const items = [sampleItem({ price: 1000, quantity: 1 })];
    const w = getCartWarnings(items, "en");
    // 5000 → "5,000" in en-US, not "5 000"
    expect(w[0]).toMatch(/5,000/);
  });

  it("uses ru-RU thin-space grouping in RU warnings", () => {
    const items = [sampleItem({ price: 1000, quantity: 1 })];
    const w = getCartWarnings(items);
    // 5000 → "5 000" with thin no-break space
    expect(w[0]).toMatch(/5 000/);
  });
});
