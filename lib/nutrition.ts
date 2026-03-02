import { nutritionSearchSchema } from "@/lib/validators";

export type NutritionCandidate = {
  source: "usda" | "openfoodfacts" | "manual";
  sourceRef: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
};

function numberOrZero(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return value;
}

async function fetchUsdaCandidates(query: string): Promise<NutritionCandidate[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return [];
  }

  const endpoint = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  endpoint.searchParams.set("api_key", apiKey);
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("pageSize", "6");

  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    foods?: Array<{
      fdcId: number;
      description: string;
      foodNutrients?: Array<{ nutrientName: string; value: number }>;
    }>;
  };

  return (data.foods ?? []).map((food) => {
    const nutrientMap = new Map(
      (food.foodNutrients ?? []).map((item) => [item.nutrientName.toLowerCase(), item.value])
    );
    return {
      source: "usda" as const,
      sourceRef: String(food.fdcId),
      name: food.description,
      caloriesPer100g: numberOrZero(nutrientMap.get("energy")),
      proteinPer100g: numberOrZero(nutrientMap.get("protein")),
      carbsPer100g: numberOrZero(nutrientMap.get("carbohydrate, by difference")),
      fatPer100g: numberOrZero(nutrientMap.get("total lipid (fat)")),
      fiberPer100g: numberOrZero(nutrientMap.get("fiber, total dietary"))
    };
  });
}

async function fetchOpenFoodFactsCandidates(query: string): Promise<NutritionCandidate[]> {
  const endpoint = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  endpoint.searchParams.set("search_terms", query);
  endpoint.searchParams.set("search_simple", "1");
  endpoint.searchParams.set("action", "process");
  endpoint.searchParams.set("json", "1");
  endpoint.searchParams.set("page_size", "6");

  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    products?: Array<{
      code?: string;
      product_name?: string;
      nutriments?: Record<string, number>;
    }>;
  };

  return (data.products ?? [])
    .filter((product) => product.product_name)
    .map((product) => ({
      source: "openfoodfacts" as const,
      sourceRef: product.code ?? "openfoodfacts",
      name: product.product_name ?? "Unknown product",
      caloriesPer100g: numberOrZero(product.nutriments?.["energy-kcal_100g"]),
      proteinPer100g: numberOrZero(product.nutriments?.proteins_100g),
      carbsPer100g: numberOrZero(product.nutriments?.carbohydrates_100g),
      fatPer100g: numberOrZero(product.nutriments?.fat_100g),
      fiberPer100g: numberOrZero(product.nutriments?.fiber_100g)
    }));
}

export async function nutritionSearch(queryInput: string): Promise<NutritionCandidate[]> {
  const parsed = nutritionSearchSchema.safeParse({ query: queryInput });
  if (!parsed.success) {
    return [];
  }

  const query = parsed.data.query;

  const usda = await fetchUsdaCandidates(query).catch(() => []);
  if (usda.length > 0) {
    return usda;
  }

  const off = await fetchOpenFoodFactsCandidates(query).catch(() => []);
  return off;
}

export function scaleNutritionFrom100g(
  candidate: NutritionCandidate,
  grams: number
): {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
} {
  const factor = grams / 100;
  return {
    calories_kcal: Number((candidate.caloriesPer100g * factor).toFixed(2)),
    protein_g: Number((candidate.proteinPer100g * factor).toFixed(2)),
    carbs_g: Number((candidate.carbsPer100g * factor).toFixed(2)),
    fat_g: Number((candidate.fatPer100g * factor).toFixed(2)),
    fiber_g: Number((candidate.fiberPer100g * factor).toFixed(2))
  };
}
