export interface FoodItem {
  id: string;
  name: string;
  category: "carb" | "protein" | "veg";
  calories: number;
  macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
  portionUnit: string;
  portionSize: number;
  recipe: string;
  imageUrl: string;
}

export const bangladeshiFoods: FoodItem[] = [
  {
    id: "white_rice",
    name: "White Rice (Sada Bhaat)",
    category: "carb",
    calories: 200,
    macros: { carbs: 45, protein: 3, fat: 0.5 },
    portionUnit: "cup",
    portionSize: 1,
    recipe: "Wash 1 cup of white rice thoroughly. Add 2 cups of water and bring to a boil. Reduce heat to low, cover, and simmer for 15-20 minutes until water is absorbed.",
    imageUrl: "/images/white_rice.png"
  },
  {
    id: "roti",
    name: "Roti / Chapati",
    category: "carb",
    calories: 120,
    macros: { carbs: 20, protein: 3, fat: 2 },
    portionUnit: "piece",
    portionSize: 1,
    recipe: "Mix whole wheat flour with water and a pinch of salt to form a dough. Roll into thin flat circles. Cook on a hot tawa (griddle) until brown spots appear on both sides.",
    imageUrl: "/images/roti.png"
  },
  {
    id: "dal",
    name: "Yellow Lentils (Dal)",
    category: "protein",
    calories: 110,
    macros: { carbs: 18, protein: 8, fat: 0.5 },
    portionUnit: "cup",
    portionSize: 1,
    recipe: "Boil washed masoor dal with water, turmeric, and salt. In a separate pan, fry garlic, onions, and dry red chilies in oil until golden (bagar/tarka). Pour over the boiled dal.",
    imageUrl: "/images/dal.png"
  },
  {
    id: "chicken_curry",
    name: "Chicken Curry (Murgir Mangsho)",
    category: "protein",
    calories: 220,
    macros: { carbs: 5, protein: 25, fat: 12 },
    portionUnit: "cup",
    portionSize: 1,
    recipe: "Fry onions, ginger-garlic paste, and spices (coriander, cumin, turmeric, chili powder) in oil. Add chicken pieces and cook until browned. Add potatoes and water, cover and simmer until tender.",
    imageUrl: "/images/chicken_curry.png"
  },
  {
    id: "fish_curry",
    name: "Fish Curry (Maacher Jhol)",
    category: "protein",
    calories: 180,
    macros: { carbs: 4, protein: 20, fat: 10 },
    portionUnit: "piece",
    portionSize: 1,
    recipe: "Marinate fish pieces (Rui/Ilish) with turmeric and salt, then lightly fry. Prepare a gravy with onion paste, ginger, cumin, and mustard oil. Add the fried fish and simmer for 10 minutes.",
    imageUrl: "/images/fish_curry.png"
  },
  {
    id: "egg_curry",
    name: "Egg Curry (Dimer Jhol)",
    category: "protein",
    calories: 150,
    macros: { carbs: 8, protein: 12, fat: 10 },
    portionUnit: "eggs",
    portionSize: 2,
    recipe: "Hard-boil 2 eggs and peel. Lightly fry them. Make a base with onions, tomatoes, ginger, garlic, and spices. Add water, bring to boil, and simmer the eggs in the gravy.",
    imageUrl: "/images/egg_curry.png"
  },
  {
    id: "mixed_vegetables",
    name: "Mixed Vegetables (Shobji Bhaji)",
    category: "veg",
    calories: 90,
    macros: { carbs: 12, protein: 3, fat: 4 },
    portionUnit: "cup",
    portionSize: 1,
    recipe: "Chop potatoes, carrots, papaya, and beans. Stir-fry in a little oil with sliced onions, green chilies, turmeric, and panch phoron (five-spice). Cover and cook until tender.",
    imageUrl: "/images/mixed_veg.png"
  },
  {
    id: "paratha",
    name: "Paratha",
    category: "carb",
    calories: 260,
    macros: { carbs: 35, protein: 4, fat: 12 },
    portionUnit: "piece",
    portionSize: 1,
    recipe: "Mix flour, water, salt, and a little oil into a dough. Roll out into a flat circle, fold to create layers, then roll again. Pan-fry on a tawa with oil or ghee until golden brown.",
    imageUrl: "/images/paratha.png"
  },
  {
    id: "beef_curry",
    name: "Beef Curry (Gorur Mangsho)",
    category: "protein",
    calories: 320,
    macros: { carbs: 5, protein: 30, fat: 20 },
    portionUnit: "cup",
    portionSize: 1,
    recipe: "Marinate beef with ginger, garlic, onions, and traditional spices. Cook in a heavy-bottomed pan slowly over medium heat until the meat is tender and the oil separates (Bhuna).",
    imageUrl: "/images/beef_curry.png"
  },
  {
    id: "spinach_bhaji",
    name: "Spinach Stir-fry (Palong Shaak Bhaji)",
    category: "veg",
    calories: 60,
    macros: { carbs: 8, protein: 4, fat: 2 },
    portionUnit: "cup",
    portionSize: 1,
    recipe: "Wash and chop spinach leaves. In a pan, fry sliced onions, garlic, and dry red chilies in a small amount of oil. Add the spinach and salt, and cook until wilted and moisture evaporates.",
    imageUrl: "/images/spinach_bhaji.png"
  }
];
