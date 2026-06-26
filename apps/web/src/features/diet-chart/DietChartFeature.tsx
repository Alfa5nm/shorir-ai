import type { FitnessLevel, Profile } from "@shorir/contracts";
import { AlertCircle, CalendarDays, Loader2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";
import { bangladeshiFoods, type FoodItem } from "./bangladeshiFoods";
import { useAppLanguage } from "../../app/language";

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
  const { t } = useAppLanguage();

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

  const translateMealName = (name: string) => {
    if (name === "Breakfast") return t("Breakfast", "সকালের নাস্তা");
    if (name === "Lunch") return t("Lunch", "দুপুরের খাবার");
    if (name === "Dinner") return t("Dinner", "রাতের খাবার");
    return name;
  };

  const translateMealNote = (note: string) => {
    if (note === "A familiar, filling start with protein and slow energy.") {
      return t(note, "প্রোটিন ও ধীরগতির শক্তির একটি পরিচিত ও পেট-ভরা নাস্তা।");
    }
    if (note === "Balanced rice, lentils, vegetables, and lean protein for training days.") {
      return t(note, "অনুশীলনের দিনগুলোর জন্য প্রয়োজনীয় ভাত, ডাল, সবজি এবং লীন প্রোটিনের একটি সুষম খাবার।");
    }
    if (note === "A lighter evening plate with fish, roti, and greens.") {
      return t(note, "মাছ, রুটি এবং সবুজ শাকসবজি সমৃদ্ধ তুলনামূলক হালকা রাতের খাবার।");
    }
    return note;
  };

  const translateFoodName = (id: string, name: string) => {
    const map: Record<string, string> = {
      white_rice: "সাদা ভাত (Sada Bhaat)",
      roti: "রুটি / চপাটি (Roti / Chapati)",
      dal: "মসুর ডাল (Yellow Lentils)",
      chicken_curry: "মুরগির মাংসের কারি (Chicken Curry)",
      fish_curry: "মাছের ঝোল (Fish Curry)",
      egg_curry: "ডিমের ঝোল (Egg Curry)",
      mixed_vegetables: "সবজি ভাজি (Mixed Vegetables)",
      paratha: "পরোটা (Paratha)",
      beef_curry: "গরুর মাংসের কারি (Beef Curry)",
      spinach_bhaji: "পালং শাক ভাজি (Spinach Stir-fry)"
    };
    return t(name, map[id] || name);
  };

  const translatePortionUnit = (unit: string) => {
    const map: Record<string, string> = {
      cup: "কাপ",
      piece: "পিস",
      eggs: "টি ডিম"
    };
    return t(unit, map[unit] || unit);
  };

  const translateRecipe = (id: string, recipe: string) => {
    const map: Record<string, string> = {
      white_rice: "১ কাপ সাদা ভাত ভালো করে ধুয়ে নিন। ২ কাপ পানি দিয়ে ফুটিয়ে নিন। জ্বাল কমিয়ে ঢাকনা দিন এবং পানি শুকিয়ে যাওয়া পর্যন্ত ১৫-২০ মিনিট মৃদু আঁচে রান্না করুন।",
      roti: "আটা বা ময়দার সাথে পানি ও সামান্য লবণ মিশিয়ে খামির তৈরি করুন। পাতলা গোল রুটি বেলে নিন। গরম তাওয়ায় সেঁকে নিন দুই পাশেই বাদামি দাগ পড়া পর্যন্ত।",
      dal: "মসুর ডাল পানি, হলুদ ও লবণ দিয়ে সেদ্ধ করুন। অন্য একটি পাত্রে রসুন, পেঁয়াজ ও শুকনা মরিচ তেলে ভেজে বাগার/তড়কা তৈরি করুন এবং তা সেদ্ধ ডালের ওপর ঢেলে দিন।",
      chicken_curry: "তেলে পেঁয়াজ, আদা-রসুন বাটা এবং মশলা (ধনে, জিরা, হলুদ, মরিচ গুঁড়ো) কষিয়ে নিন। মুরগির টুকরো যোগ করে ভাজুন। আলু ও পানি দিয়ে ঢেকে মৃদু আঁচে রান্না করুন।",
      fish_curry: "মাছের টুকরো (রুই/ইলিশ) হলুদ ও লবণ দিয়ে মেখে হালকা ভেজে নিন। পেঁয়াজ বাটা, আদা ও জিরা দিয়ে ঝোল তৈরি করুন। ভাজা মাছ দিয়ে ১০ মিনিট রান্না করুন।",
      egg_curry: "২টি ডিম সেদ্ধ করে খোসা ছাড়িয়ে হালকা ভেজে নিন। পেঁয়াজ, টমেটো, আদা ও মশলা দিয়ে ঝোল তৈরি করুন। ঝোল ফুটে উঠলে ডিমগুলো দিয়ে কিছু সময় রাখুন।",
      mixed_vegetables: "আলু, গাজর, পেঁপে ও শিম কুচি করুন। সামান্য তেলে পেঁয়াজ, কাঁচা মরিচ ও পাঁচফোড়ন দিয়ে হালকা ভাজুন। ঢেকে মৃদু আঁচে সেদ্ধ হওয়া পর্যন্ত রান্না করুন।",
      paratha: "ময়দা, পানি, লবণ ও সামান্য তেল দিয়ে খামির করুন। রুটি বেলে ভাঁজ করে লেয়ার করুন এবং আবার বেলুন। তাওয়ায় তেল বা ঘি দিয়ে সোনালী বাদামি করে ভাজুন।",
      beef_curry: "আদা, রসুন, পেঁয়াজ ও ঐতিহ্যবাহী মশলা দিয়ে গরুর মাংস মেখে নিন। কড়াইতে ঢাকনা দিয়ে মৃদু আঁচে রান্না করুন মাংস নরম হওয়া পর্যন্ত (ভুনা)।",
      spinach_bhaji: "পালং শাক ভালো করে ধুয়ে কুচি করে নিন। কড়াইতে পেঁয়াজ, রসুন ও শুকনা মরিচ তেলে ভাজুন। শাক ও লবণ দিয়ে ঢাকনা ছাড়া রান্না করুন পানি শুকানো পর্যন্ত।"
    };
    return t(recipe, map[id] || recipe);
  };

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> {t("Loading diet chart...", "ডায়েট চার্ট লোড করা হচ্ছে...")}</section>;
  }

  if (error) {
    return <section className="panel loading-state"><AlertCircle /> {error}</section>;
  }

  if (!profile) {
    return (
      <section className="empty-state">
        <h2>{t("Complete onboarding first", "প্রথমে অনবোর্ডিং সম্পন্ন করুন")}</h2>
        <p>{t("Save your coaching profile to generate a Bangladeshi meal template.", "একটি কাস্টম বাংলাদেশী খাবার চার্ট তৈরি করতে আপনার প্রোফাইলটি সংরক্ষণ করুন।")}</p>
        <a href="/onboarding">{t("Open onboarding", "অনবোর্ডিং শুরু করুন")}</a>
      </section>
    );
  }

  return (
    <section className="diet-chart">
      <header className="feature-header">
        <StatusPill tone="neutral">{t("Food guidance", "খাবার গাইড")}</StatusPill>
        <h1>{t("Personalized diet chart", "আপনার ডায়েট চার্ট")}</h1>
        <p>
          {t("A cautious Bangladeshi meal template based on your goal and fitness level. Use it for planning, not as medical or clinical nutrition advice.", "আপনার লক্ষ্য এবং ফিটনেস স্তরের উপর ভিত্তি করে একটি সতর্কতামূলক বাংলাদেশী খাদ্য তালিকা। এটি শুধুমাত্র পরিকল্পনার জন্য ব্যবহার করুন, কোনো চিকিৎসাগত বা ক্লিনিকাল পুষ্টি পরামর্শ হিসেবে নয়।")}
        </p>
      </header>

      <div className="diet-summary">
        <article>
          <Utensils size={22} aria-hidden="true" />
          <span>{summaryTarget.source === "body_metrics" ? t("Daily calorie target", "দৈনিক ক্যালোরি লক্ষ্য") : t("Estimated daily energy", "আনুমানিক দৈনিক শক্তি")}</span>
          <strong>{summaryTarget.calories} kcal</strong>
        </article>
        <article>
          <span>{t("Protein target", "প্রোটিন লক্ষ্য")}</span>
          <strong>{summaryTarget.protein} g</strong>
        </article>
        <article>
          <span>{t("Carbs target", "কার্বোহাইড্রেট লক্ষ্য")}</span>
          <strong>{summaryTarget.carbs} g</strong>
        </article>
        <article>
          <CalendarDays size={22} aria-hidden="true" />
          <span>{t("Fat target", "ফ্যাট লক্ষ্য")}</span>
          <strong>{summaryTarget.fat} g</strong>
        </article>
      </div>

      {!nutritionTarget && (
        <div className="coach-feedback">
          <AlertCircle size={20} aria-hidden="true" />
          <p>{t("Add age, gender, height, current weight, and target weight in onboarding for a more personalized calorie target.", "অনবোর্ডিংয়ে বয়স, লিঙ্গ, উচ্চতা, বর্তমান ওজন এবং লক্ষ্য ওজন যোগ করুন যাতে আরও সঠিক ক্যালোরি লক্ষ্য তৈরি করা যায়।")}</p>
        </div>
      )}

      {profile.safety.hasPain && (
        <div className="coach-feedback">
          <AlertCircle size={20} aria-hidden="true" />
          <p>{t("Because you reported pain or a limitation, keep training conservative and seek qualified guidance if symptoms persist.", "যেহেতু আপনি ব্যথা বা চলাফেরার সীমাবদ্ধতা উল্লেখ করেছেন, তাই সতর্কতার সাথে অনুশীলন করুন এবং লক্ষণগুলো স্থায়ী হলে চিকিৎসকের পরামর্শ নিন।")}</p>
        </div>
      )}

      <div className="diet-meal-list">
        {meals.map((meal) => {
          const total = mealTotal(meal);
          return (
            <article className="diet-meal" key={meal.name}>
              <div className="diet-meal__header">
                <div>
                  <h2>{translateMealName(meal.name)}</h2>
                  <p>{translateMealNote(meal.note)}</p>
                </div>
                <strong>{Math.round(total.calories)} kcal</strong>
              </div>
              <div className="diet-food-grid">
                {meal.foods.map((item) => (
                  <section className="diet-food" key={item.food.id}>
                    <img src={item.food.imageUrl} alt={item.food.name} />
                    <div>
                      <h3>{translateFoodName(item.food.id, item.food.name)}</h3>
                      <p>
                        {t("Portion:", "পরিমাণ:")} {(item.food.portionSize * item.portionMultiplier).toFixed(1)} {translatePortionUnit(item.food.portionUnit)}
                      </p>
                      <dl>
                        <div><dt>{t("Calories", "ক্যালোরি")}</dt><dd>{Math.round(item.food.calories * item.portionMultiplier)}</dd></div>
                        <div><dt>{t("Protein", "প্রোটিন")}</dt><dd>{Math.round(item.food.macros.protein * item.portionMultiplier)} g</dd></div>
                        <div><dt>{t("Carbs", "কার্বোহাইড্রেট")}</dt><dd>{Math.round(item.food.macros.carbs * item.portionMultiplier)} g</dd></div>
                        <div><dt>{t("Fat", "ফ্যাট")}</dt><dd>{Math.round(item.food.macros.fat * item.portionMultiplier)} g</dd></div>
                      </dl>
                      <small>{translateRecipe(item.food.id, item.food.recipe)}</small>
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
