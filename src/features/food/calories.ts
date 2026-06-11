export interface CalorieEstimate {
  calories: number | null;
  per100g?: number;
  grams?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  match?: string;
  reason?: "not_configured" | "no_match" | "error";
}

/**
 * Estimate calories for a meal description via the /api/calories route
 * (which queries USDA FoodData Central server-side so the key stays secret).
 * Pass `grams` for an exact portion; omit it for a ~150 g default estimate.
 * Returns `calories: null` on any failure so callers can save the meal anyway.
 */
export async function lookupCalories(
  query: string,
  grams?: number,
): Promise<CalorieEstimate> {
  try {
    const res = await fetch("/api/calories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, grams }),
    });
    if (!res.ok) return { calories: null, reason: "error" };
    return (await res.json()) as CalorieEstimate;
  } catch {
    return { calories: null, reason: "error" };
  }
}
