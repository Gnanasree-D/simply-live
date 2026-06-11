import { NextResponse } from "next/server";

const FDC_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

// USDA reports energy per 100 g and has no portion parser, so we scale by a
// typical mixed-dish serving to produce a per-meal estimate. Rough by nature —
// the UI prefixes the number with "~".
const DEFAULT_SERVING_G = 150;

interface CalorieResult {
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

interface FdcNutrient {
  nutrientName?: string;
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
}
interface FdcFood {
  description?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: FdcNutrient[];
}

function pickNutrient(
  food: FdcFood,
  numbers: string[],
  unit: RegExp,
): number | null {
  const n = (food.foodNutrients ?? []).find(
    (x) => numbers.includes(x.nutrientNumber ?? "") && unit.test(x.unitName ?? ""),
  );
  return typeof n?.value === "number" ? n.value : null;
}

const KCAL = /kcal/i;
const GRAM = /^g$/i;
// FDC nutrient numbers: energy 208, protein 203, total fat 204, carbs 205,
// fiber 291.
function energyKcalPer100g(food: FdcFood): number | null {
  return pickNutrient(food, ["208", "1008"], KCAL);
}

export async function POST(req: Request): Promise<NextResponse<CalorieResult>> {
  const apiKey = process.env.FDC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ calories: null, reason: "not_configured" });
  }

  let query = "";
  let userGrams: number | null = null;
  try {
    const body = await req.json();
    query = String(body?.query ?? "").trim();
    const g = Number(body?.grams);
    if (Number.isFinite(g) && g > 0) userGrams = g;
  } catch {
    query = "";
  }
  if (!query) return NextResponse.json({ calories: null, reason: "no_match" });

  const url = new URL(FDC_SEARCH_URL);
  url.searchParams.set("api_key", apiKey);

  try {
    // POST with a JSON body so dataType (which contains spaces/parens) isn't
    // mangled in the query string. Restricting to USDA's generic databases
    // avoids branded junk matches (e.g. "banana" → banana chips) and their
    // arbitrary serving sizes.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        dataType: ["Survey (FNDDS)", "SR Legacy", "Foundation"],
        pageSize: 1,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json({ calories: null, reason: "error" });
    }

    const data = (await res.json()) as { foods?: FdcFood[] };
    const food = data.foods?.[0];
    const per100g = food ? energyKcalPer100g(food) : null;
    if (!food || per100g === null) {
      return NextResponse.json({ calories: null, reason: "no_match" });
    }

    const grams =
      userGrams ??
      (food.servingSizeUnit?.toLowerCase() === "g" && food.servingSize
        ? food.servingSize
        : DEFAULT_SERVING_G);
    const scale = grams / 100;
    const calories = Math.round(per100g * scale);

    const scaleMacro = (per100: number | null): number | undefined =>
      per100 === null ? undefined : Math.round(per100 * scale);

    return NextResponse.json({
      calories,
      per100g: Math.round(per100g),
      grams,
      protein: scaleMacro(pickNutrient(food, ["203", "1003"], GRAM)),
      carbs: scaleMacro(pickNutrient(food, ["205", "1005"], GRAM)),
      fat: scaleMacro(pickNutrient(food, ["204", "1004"], GRAM)),
      fiber: scaleMacro(pickNutrient(food, ["291", "1079"], GRAM)),
      match: food.description,
    });
  } catch {
    return NextResponse.json({ calories: null, reason: "error" });
  }
}
