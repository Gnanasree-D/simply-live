import { NextResponse } from "next/server";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface CalorieResult {
  calories: number | null;
  grams?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  match?: string;
  reason?: "not_configured" | "no_match" | "error";
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    calories: { type: "INTEGER" },
    protein: { type: "NUMBER" },
    carbs: { type: "NUMBER" },
    fat: { type: "NUMBER" },
    fiber: { type: "NUMBER" },
    assumed: { type: "STRING" },
  },
  required: ["calories", "protein", "carbs", "fat", "fiber"],
};

export async function POST(req: Request): Promise<NextResponse<CalorieResult>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ calories: null, reason: "not_configured" });
  }

  let query = "";
  let grams: number | null = null;
  try {
    const body = await req.json();
    query = String(body?.query ?? "").trim();
    const g = Number(body?.grams);
    if (Number.isFinite(g) && g > 0) grams = g;
  } catch {
    query = "";
  }
  if (!query) return NextResponse.json({ calories: null, reason: "no_match" });

  const portion = grams
    ? `The portion is exactly ${grams} grams (total, as served).`
    : "Assume one typical single serving.";
  const prompt = [
    "You are a nutrition estimator for an Indian home-cooking food diary.",
    "Estimate the nutrition of the food AS PREPARED AND EATEN — include any",
    "cooking oil, ghee, sugar, or ingredients implied by the description",
    '(e.g. a "fry" includes the oil it is cooked in).',
    `Food: "${query}".`,
    portion,
    "Return totals for the whole portion: calories (kcal), protein, carbs,",
    "fat, and fiber in grams. Use realistic Indian serving sizes and",
    "cooking practices. Numbers only — no ranges.",
  ].join(" ");

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ calories: null, reason: "error" });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ calories: null, reason: "no_match" });

    const parsed = JSON.parse(text) as {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      assumed?: string;
    };
    if (typeof parsed.calories !== "number") {
      return NextResponse.json({ calories: null, reason: "no_match" });
    }

    const round = (n: unknown): number | undefined =>
      typeof n === "number" && Number.isFinite(n) ? Math.round(n) : undefined;

    return NextResponse.json({
      calories: Math.round(parsed.calories),
      grams: grams ?? undefined,
      protein: round(parsed.protein),
      carbs: round(parsed.carbs),
      fat: round(parsed.fat),
      fiber: round(parsed.fiber),
      match: parsed.assumed,
    });
  } catch {
    return NextResponse.json({ calories: null, reason: "error" });
  }
}
