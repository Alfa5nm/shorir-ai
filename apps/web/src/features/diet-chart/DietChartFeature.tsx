import type { FitnessLevel, Profile } from "@shorir/contracts";
import { AlertCircle, CalendarDays, Loader2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";
import { bangladeshiFoods, type FoodItem } from "./bangladeshiFoods";

interface MealFood {
  food: FoodItem;
  portionMultiplier: number;
}

interface MealPlan {
  name: string;
  note: string;
  foods: MealFood[];
}

interface NutritionTarget {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  source: "body_metrics" | "fitness_level";
}

const levelPortion: Record<FitnessLevel, number> = {
  beginner: 0.9,
  returning: 1,
  intermediate: 1.12
};

function foodById(id: string) {
  const food = bangladeshiFoods.find((item) => item.id === id);
  if (!food) throw new Error(`Missing food item: ${id}`);
  return food;
}

function mealTotal(meal: MealPlan) {
  return meal.foods.reduce(
    (total, item) => ({
      calories: total.calories + item.food.calories * item.portionMultiplier,
      carbs: total.carbs + item.food.macros.carbs * item.portionMultiplier,
      protein: total.protein + item.food.macros.protein * item.portionMultiplier,
      fat: total.fat + item.food.macros.fat * item.portionMultiplier
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
}

function calculateNutritionTarget(profile: Profile): NutritionTarget | null {
  const { age, gender, height, weight, targetWeight } = profile;
  if (!age || !gender || !height || !weight || !targetWeight) return null;

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male") bmr += 5;
  else if (gender === "female") bmr -= 161;
  else bmr -= 78;

  let calories = Math.round(bmr * 1.375);
  if (targetWeight < weight) calories -= 500;
  if (targetWeight > weight) calories += 500;
  if (gender === "male" && calories < 1500) calories = 1500;
  if (gender === "female" && calories < 1200) calories = 1200;
  if (gender === "other" && calories < 1350) calories = 1350;

  return {
    calories,
    carbs: Math.round((calories * 0.5) / 4),
    protein: Math.round((calories * 0.3) / 4),
    fat: Math.round((calories * 0.2) / 9),
    source: "body_metrics"
  };
}

function scaleMealToCalories(meal: MealPlan, targetCalories: number): MealPlan {
  const total = mealTotal(meal).calories;
  if (total <= 0) return meal;
  const multiplier = targetCalories / total;
  return {
    ...meal,
    foods: meal.foods.map((item) => ({
      ...item,
      portionMultiplier: item.portionMultiplier * multiplier
    }))
  };
}

function buildMeals(profile: Profile): MealPlan[] {
  const base = levelPortion[profile.fitnessLevel];
  const goal = profile.goal.toLowerCase();
  const proteinBoost = goal.includes("muscle") || goal.includes("strength") || goal.includes("build") ? 1.12 : 1;
  const lighterCarb = goal.includes("weight") || goal.includes("fat") ? 0.86 : 1;

  const meals = [
    {
      name: "Breakfast",
      note: "A familiar, filling start with protein and slow energy.",
      foods: [
        { food: foodById("paratha"), portionMultiplier: base * lighterCarb },
        { food: foodById("egg_curry"), portionMultiplier: base * proteinBoost }
      ]
    },
    {
      name: "Lunch",
      note: "Balanced rice, lentils, vegetables, and lean protein for training days.",
      foods: [
        { food: foodById("white_rice"), portionMultiplier: base * lighterCarb },
        { food: foodById("dal"), portionMultiplier: base },
        { food: foodById("chicken_curry"), portionMultiplier: base * proteinBoost },
        { food: foodById("mixed_vegetables"), portionMultiplier: base * 1.15 }
      ]
    },
    {
      name: "Dinner",
      note: "A lighter evening plate with fish, roti, and greens.",
      foods: [
        { food: foodById("roti"), portionMultiplier: base * lighterCarb },
        { food: foodById("fish_curry"), portionMultiplier: base * proteinBoost },
        { food: foodById("spinach_bhaji"), portionMultiplier: base * 1.2 }
      ]
    }
  ];
  const target = calculateNutritionTarget(profile);
  if (!target) return meals;
  return [
    scaleMealToCalories(meals[0]!, target.calories * 0.25),
    scaleMealToCalories(meals[1]!, target.calories * 0.4),
    scaleMealToCalories(meals[2]!, target.calories * 0.35)
  ];
}

export function DietChartFeature() {
  const { apiClient } = useAppServices();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void ensureProfileId(apiClient)
      .then(async (id) => {
        const nextProfile = await apiClient.getProfile(id);
        if (active) setProfile(nextProfile);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Failed to load profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiClient]);

  const meals = useMemo(() => (profile ? buildMeals(profile) : []), [profile]);
  const dayTotal = meals.reduce(
    (total, meal) => {
      const next = mealTotal(meal);
      return {
        calories: total.calories + next.calories,
        carbs: total.carbs + next.carbs,
        protein: total.protein + next.protein,
        fat: total.fat + next.fat
      };
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
  const nutritionTarget = profile ? calculateNutritionTarget(profile) : null;
  const summaryTarget: NutritionTarget = nutritionTarget ?? {
    calories: Math.round(dayTotal.calories),
    carbs: Math.round(dayTotal.carbs),
    protein: Math.round(dayTotal.protein),
    fat: Math.round(dayTotal.fat),
    source: "fitness_level"
  };

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> Loading diet chart...</section>;
  }

  if (error) {
    return <section className="panel loading-state"><AlertCircle /> {error}</section>;
  }

  if (!profile) {
    return (
      <section className="empty-state">
        <h2>Complete onboarding first</h2>
        <p>Save your coaching profile to generate a Bangladeshi meal template.</p>
        <a href="/onboarding">Open onboarding</a>
      </section>
    );
  }

  return (
    <section className="diet-chart">
      <header className="feature-header">
        <StatusPill tone="neutral">Food guidance</StatusPill>
        <h1>Personalized diet chart</h1>
        <p>
          A cautious Bangladeshi meal template based on your goal and fitness level. Use it for planning,
          not as medical or clinical nutrition advice.
        </p>
      </header>

      <div className="diet-summary">
        <article>
          <Utensils size={22} aria-hidden="true" />
          <span>{summaryTarget.source === "body_metrics" ? "Daily calorie target" : "Estimated daily energy"}</span>
          <strong>{summaryTarget.calories} kcal</strong>
        </article>
        <article>
          <span>Protein target</span>
          <strong>{summaryTarget.protein} g</strong>
        </article>
        <article>
          <span>Carbs target</span>
          <strong>{summaryTarget.carbs} g</strong>
        </article>
        <article>
          <CalendarDays size={22} aria-hidden="true" />
          <span>Fat target</span>
          <strong>{summaryTarget.fat} g</strong>
        </article>
      </div>

      {!nutritionTarget && (
        <div className="coach-feedback">
          <AlertCircle size={20} aria-hidden="true" />
          <p>Add age, gender, height, current weight, and target weight in onboarding for a more personalized calorie target.</p>
        </div>
      )}

      {profile.safety.hasPain && (
        <div className="coach-feedback">
          <AlertCircle size={20} aria-hidden="true" />
          <p>Because you reported pain or a limitation, keep training conservative and seek qualified guidance if symptoms persist.</p>
        </div>
      )}

      <div className="diet-meal-list">
        {meals.map((meal) => {
          const total = mealTotal(meal);
          return (
            <article className="diet-meal" key={meal.name}>
              <div className="diet-meal__header">
                <div>
                  <h2>{meal.name}</h2>
                  <p>{meal.note}</p>
                </div>
                <strong>{Math.round(total.calories)} kcal</strong>
              </div>
              <div className="diet-food-grid">
                {meal.foods.map((item) => (
                  <section className="diet-food" key={item.food.id}>
                    <img src={item.food.imageUrl} alt={item.food.name} />
                    <div>
                      <h3>{item.food.name}</h3>
                      <p>
                        Portion: {(item.food.portionSize * item.portionMultiplier).toFixed(1)} {item.food.portionUnit}
                      </p>
                      <dl>
                        <div><dt>Calories</dt><dd>{Math.round(item.food.calories * item.portionMultiplier)}</dd></div>
                        <div><dt>Protein</dt><dd>{Math.round(item.food.macros.protein * item.portionMultiplier)} g</dd></div>
                        <div><dt>Carbs</dt><dd>{Math.round(item.food.macros.carbs * item.portionMultiplier)} g</dd></div>
                        <div><dt>Fat</dt><dd>{Math.round(item.food.macros.fat * item.portionMultiplier)} g</dd></div>
                      </dl>
                      <small>{item.food.recipe}</small>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
