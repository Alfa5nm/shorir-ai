import { useEffect, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { type Profile } from "@shorir/contracts";
import { Loader2, AlertCircle, Utensils, Info } from "lucide-react";
import { bangladeshiFoods, type FoodItem } from "./bangladeshiFoods";

interface MealFood {
  food: FoodItem;
  portionMultiplier: number;
}

interface MealPlan {
  name: string;
  targetCalories: number;
  foods: MealFood[];
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
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
        const p = await apiClient.getProfile(id);
        if (active) setProfile(p);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiClient]);

  if (isLoading) {
    return <div className="loading-state"><Loader2 className="spin" /> Loading your diet chart...</div>;
  }

  if (error) {
    return <div className="error-state"><AlertCircle /> {error}</div>;
  }

  if (!profile) return null;

  const { age, gender, height, weight, targetWeight } = profile;

  if (!age || !gender || !height || !weight || !targetWeight) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Personalized Diet Chart</h2>
        </div>
        <div className="card-content">
          <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', backgroundColor: 'rgba(255, 248, 234, 0.05)', border: '1px solid rgba(255, 248, 234, 0.1)', padding: '1.5rem 2rem', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Please enter personal information under Onboarding</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate BMR (Mifflin-St Jeor)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male") {
    bmr += 5;
  } else if (gender === "female") {
    bmr -= 161;
  } else {
    // Average for 'other'
    bmr -= 78;
  }

  // TDEE (Assume lightly active)
  const tdee = bmr * 1.375;

  // Calorie Target
  let targetCalories = Math.round(tdee);
  if (targetWeight < weight) targetCalories -= 500;
  if (targetWeight > weight) targetCalories += 500;
  
  // Safety bounds
  if (gender === "male" && targetCalories < 1500) targetCalories = 1500;
  if (gender === "female" && targetCalories < 1200) targetCalories = 1200;

  // Macro distribution (50% Carbs, 30% Protein, 20% Fat)
  const targetCarbs = Math.round((targetCalories * 0.5) / 4);
  const targetProtein = Math.round((targetCalories * 0.3) / 4);
  const targetFat = Math.round((targetCalories * 0.2) / 9);

  // Meal Calorie Split
  const breakfastCalories = targetCalories * 0.25;
  const lunchCalories = targetCalories * 0.40;
  const dinnerCalories = targetCalories * 0.35;

  // Meal Generators
  const generateMeal = (name: string, targetCal: number, foodIds: string[]): MealPlan => {
    const foods = foodIds.map(id => bangladeshiFoods.find(f => f.id === id)!).filter(Boolean);
    const baseCalories = foods.reduce((sum, f) => sum + f.calories, 0);
    const multiplier = targetCal / baseCalories;

    const mealFoods = foods.map(food => ({
      food,
      portionMultiplier: multiplier
    }));

    const totalCalories = mealFoods.reduce((sum, f) => sum + f.food.calories * f.portionMultiplier, 0);
    const totalCarbs = mealFoods.reduce((sum, f) => sum + f.food.macros.carbs * f.portionMultiplier, 0);
    const totalProtein = mealFoods.reduce((sum, f) => sum + f.food.macros.protein * f.portionMultiplier, 0);
    const totalFat = mealFoods.reduce((sum, f) => sum + f.food.macros.fat * f.portionMultiplier, 0);

    return {
      name,
      targetCalories: targetCal,
      foods: mealFoods,
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat
    };
  };

  const breakfast = generateMeal("Breakfast", breakfastCalories, ["paratha", "egg_curry"]);
  const lunch = generateMeal("Lunch", lunchCalories, ["white_rice", "dal", "chicken_curry", "mixed_vegetables"]);
  const dinner = generateMeal("Dinner", dinnerCalories, ["roti", "fish_curry", "spinach_bhaji"]);

  const meals = [breakfast, lunch, dinner];

  return (
    <div className="diet-chart-container">
      <header className="feature-header">
        <h1>Personalized Diet Chart</h1>
        <p>Based on your profile, here is your daily nutrition plan using local Bangladeshi ingredients.</p>
      </header>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card card">
          <div className="card-content">
            <h3 className="text-sm text-muted">Daily Calorie Target</h3>
            <p className="text-2xl font-bold">{Math.round(targetCalories)} kcal</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="card-content">
            <h3 className="text-sm text-muted">Carbs (50%)</h3>
            <p className="text-2xl font-bold">{targetCarbs}g</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="card-content">
            <h3 className="text-sm text-muted">Protein (30%)</h3>
            <p className="text-2xl font-bold">{targetProtein}g</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="card-content">
            <h3 className="text-sm text-muted">Fat (20%)</h3>
            <p className="text-2xl font-bold">{targetFat}g</p>
          </div>
        </div>
      </div>

      <div className="meals-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {meals.map((meal, index) => (
          <div key={index} className="card meal-card">
            <div className="card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Utensils size={20} />
                  {meal.name}
                </h2>
                <div className="meal-summary" style={{ textAlign: 'right' }}>
                  <span className="font-bold">{Math.round(meal.totalCalories)} kcal</span>
                  <div className="text-sm text-muted">
                    C: {Math.round(meal.totalCarbs)}g | P: {Math.round(meal.totalProtein)}g | F: {Math.round(meal.totalFat)}g
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-content">
              <div className="food-items" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {meal.foods.map((item, idx) => (
                  <div key={idx} className="food-item" style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 25%) 1fr', gap: '1.5rem', alignItems: 'start', marginBottom: '2.5rem' }}>
                    <div className="food-image" style={{ width: '100%', height: '100%', minHeight: '160px', borderRadius: '10px', overflow: 'hidden' }}>
                      <img 
                        src={item.food.imageUrl} 
                        alt={item.food.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="food-details" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 0.8 }}>{idx + 1}</span>
                        <div>
                          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', lineHeight: 1.2 }}>{item.food.name}</h4>
                          <p className="text-muted" style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>
                            Portion: {(item.food.portionSize * item.portionMultiplier).toFixed(1)} {item.food.portionUnit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="food-recipe" style={{ fontSize: '1rem', lineHeight: 1.5, color: 'rgba(255,248,234,0.85)' }}>
                        <p style={{ margin: 0 }}>{item.food.recipe}</p>
                      </div>

                      <div className="food-macros" style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,248,234,0.85)', marginTop: '0.25rem' }}>
                        <span>🔥 {Math.round(item.food.calories * item.portionMultiplier)} kcal</span>
                        <span>🌾 C: {Math.round(item.food.macros.carbs * item.portionMultiplier)}g</span>
                        <span>🍗 P: {Math.round(item.food.macros.protein * item.portionMultiplier)}g</span>
                        <span>🥑 F: {Math.round(item.food.macros.fat * item.portionMultiplier)}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
