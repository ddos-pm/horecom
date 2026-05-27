/**
 * Display prices for the 3-tier product card (the team brief #21):
 * - base:         one-off retail
 * - subscription: when the product is part of a recurring plan (-10%)
 * - group:        when a group buy completes (-18%)
 *
 * V1 strategy: derive from basePrice with default discounts. When the team
 * starts setting per-SKU prices manually, the Price model already has a
 * `groupPrice` column and can grow a `subscriptionPrice` column; this
 * helper switches over without breaking callers.
 */

const SUBSCRIPTION_DISCOUNT = 0.10;
const GROUP_DISCOUNT = 0.18;

export type DisplayPrices = {
  base: number;
  subscription: number;
  group: number;
  subscriptionSavingsPct: number;
  groupSavingsPct: number;
};

export function getDisplayPrices(
  basePrice: number | string,
  overrides?: { subscriptionPrice?: number | string | null; groupPrice?: number | string | null },
): DisplayPrices {
  const base = Number(basePrice);
  const sub = overrides?.subscriptionPrice != null
    ? Number(overrides.subscriptionPrice)
    : Math.round(base * (1 - SUBSCRIPTION_DISCOUNT));
  const grp = overrides?.groupPrice != null
    ? Number(overrides.groupPrice)
    : Math.round(base * (1 - GROUP_DISCOUNT));
  return {
    base,
    subscription: sub,
    group: grp,
    subscriptionSavingsPct: Math.round(((base - sub) / base) * 100),
    groupSavingsPct: Math.round(((base - grp) / base) * 100),
  };
}

export function formatKzt(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₸`;
}
