import { describe, expect, it } from "vitest";
import { scaleNutritionFrom100g } from "@/lib/nutrition";

describe("nutrition helpers", () => {
  it("scales per-100g values correctly", () => {
    const scaled = scaleNutritionFrom100g(
      {
        source: "manual",
        sourceRef: "x",
        name: "Test food",
        caloriesPer100g: 200,
        proteinPer100g: 10,
        carbsPer100g: 20,
        fatPer100g: 5,
        fiberPer100g: 4
      },
      150
    );

    expect(scaled.calories_kcal).toBe(300);
    expect(scaled.protein_g).toBe(15);
    expect(scaled.carbs_g).toBe(30);
    expect(scaled.fat_g).toBe(7.5);
    expect(scaled.fiber_g).toBe(6);
  });
});
