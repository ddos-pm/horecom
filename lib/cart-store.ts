import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  minOrderQty: number;
  packLabel: string;
  unitType: string;
};

type CartActions = {
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

type CartState = {
  items: CartItem[];
} & CartActions;

const FREE_DELIVERY_THRESHOLD = 20_000;
const MIN_ORDER_TOTAL = 5_000;
const DELIVERY_FEE = 1_000;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (input) =>
        set((state) => {
          const requested = input.quantity ?? input.minOrderQty;
          const quantity = Math.max(requested, input.minOrderQty);

          const existing = state.items.find((i) => i.productId === input.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === input.productId ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...input, quantity }],
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              const next = Math.max(quantity, i.minOrderQty);
              return { ...i, quantity: next };
            })
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "horecom-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

export function getDeliveryFee(subtotal: number) {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function getCartTotal(items: CartItem[]) {
  const subtotal = getCartSubtotal(items);
  return subtotal + getDeliveryFee(subtotal);
}

export function getCartWarnings(items: CartItem[]) {
  const subtotal = getCartSubtotal(items);
  const warnings: string[] = [];
  if (items.length === 0) return warnings;
  if (subtotal < MIN_ORDER_TOTAL) {
    warnings.push(`Минимальный заказ — ${MIN_ORDER_TOTAL.toLocaleString("ru-RU")} ₸. До минимума: ${(MIN_ORDER_TOTAL - subtotal).toLocaleString("ru-RU")} ₸.`);
  }
  if (subtotal < FREE_DELIVERY_THRESHOLD) {
    warnings.push(`До бесплатной доставки: ${(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString("ru-RU")} ₸.`);
  }
  return warnings;
}

export const CART_LIMITS = {
  MIN_ORDER_TOTAL,
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
};
