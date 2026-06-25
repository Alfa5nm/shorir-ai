export interface FoodDatasetItem {
  name: string;
  category: string;
  typicalPortion: string;
  calorieRange: string;
  uncertaintyNote: string;
}

export const foodDataset: FoodDatasetItem[] = [
  {
    name: "Rice",
    category: "staple",
    typicalPortion: "1 plate",
    calorieRange: "250-450 kcal",
    uncertaintyNote: "Portion size varies heavily by plate and serving spoon."
  },
  {
    name: "Dal",
    category: "protein",
    typicalPortion: "1 bowl",
    calorieRange: "120-260 kcal",
    uncertaintyNote: "Oil, thickness, and lentil quantity change the estimate."
  },
  {
    name: "Chicken curry",
    category: "protein",
    typicalPortion: "1 piece with gravy",
    calorieRange: "220-420 kcal",
    uncertaintyNote: "Skin, oil, and gravy amount need confirmation."
  }
];
