import type { CategoryId } from "@/data/products/types";

/**
 * Category base values are the average listed price across that category's
 * real catalog entries (see src/data/products/*.ts) — not arbitrary numbers.
 * A buyback offer is a fraction of that, scaled down further by condition.
 */
export const SELL_CATEGORY_BASE_VALUE: Partial<Record<CategoryId, number>> = {
  smartphones: 103618,
  laptops: 187808,
  tablets: 82808,
  watches: 51570,
  audio: 28589,
  cameras: 177570,
  gaming: 46879,
  accessories: 13180,
};

export const SELL_CATEGORIES = Object.keys(
  SELL_CATEGORY_BASE_VALUE,
) as CategoryId[];

export const CONDITION_OPTIONS = [
  { id: "excellent", label: "Excellent — like new", factor: 0.55 },
  { id: "very-good", label: "Very Good — light wear", factor: 0.45 },
  { id: "good", label: "Good — visible wear", factor: 0.35 },
  { id: "fair", label: "Fair — heavy wear / minor faults", factor: 0.22 },
] as const;

export type ConditionId = (typeof CONDITION_OPTIONS)[number]["id"];

export type SellIssues = {
  screenIntact: boolean;
  powersOn: boolean;
  hasCharger: boolean;
};

export function estimateOffer(
  category: CategoryId,
  condition: ConditionId,
  issues: SellIssues,
): number {
  const base = SELL_CATEGORY_BASE_VALUE[category];
  const conditionFactor = CONDITION_OPTIONS.find(
    (c) => c.id === condition,
  )?.factor;
  if (!base || !conditionFactor) return 0;

  let value = base * conditionFactor;
  if (!issues.screenIntact) value *= 0.85;
  if (!issues.powersOn) value *= 0.5;
  if (!issues.hasCharger) value *= 0.97;

  return Math.max(0, Math.round(value / 100) * 100);
}
