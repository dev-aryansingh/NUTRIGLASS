// Curated dataset of standard global and popular Indian foods.
// All nutrient values are per 100g.

export const foodDatabase = [
  // --- Indian Foods ---
  {
    name: "Roti (Whole Wheat Chapati)",
    category: "Indian Bread",
    calories: 264,
    protein: 9.0,
    carbs: 56.0,
    fat: 1.0,
    defaultServingSize: 30, // grams per 1 roti
    servingUnit: "roti",
    isIndian: true
  },
  {
    name: "Butter Roti",
    category: "Indian Bread",
    calories: 310,
    protein: 8.5,
    carbs: 53.0,
    fat: 6.5,
    defaultServingSize: 35, 
    servingUnit: "roti",
    isIndian: true
  },
  {
    name: "Plain Paratha",
    category: "Indian Bread",
    calories: 326,
    protein: 7.0,
    carbs: 51.0,
    fat: 11.0,
    defaultServingSize: 60,
    servingUnit: "paratha",
    isIndian: true
  },
  {
    name: "Aloo Paratha",
    category: "Indian Bread",
    calories: 280,
    protein: 5.5,
    carbs: 45.0,
    fat: 8.5,
    defaultServingSize: 80,
    servingUnit: "paratha",
    isIndian: true
  },
  {
    name: "Paneer Paratha",
    category: "Indian Bread",
    calories: 310,
    protein: 9.5,
    carbs: 42.0,
    fat: 11.5,
    defaultServingSize: 80,
    servingUnit: "paratha",
    isIndian: true
  },
  {
    name: "Plain Naan",
    category: "Indian Bread",
    calories: 310,
    protein: 9.0,
    carbs: 57.0,
    fat: 5.0,
    defaultServingSize: 75,
    servingUnit: "naan",
    isIndian: true
  },
  {
    name: "Garlic Butter Naan",
    category: "Indian Bread",
    calories: 345,
    protein: 8.5,
    carbs: 54.0,
    fat: 10.5,
    defaultServingSize: 85,
    servingUnit: "naan",
    isIndian: true
  },
  {
    name: "Basmati Rice (Cooked)",
    category: "Grains",
    calories: 130,
    protein: 2.7,
    carbs: 28.0,
    fat: 0.3,
    defaultServingSize: 150, // 1 bowl
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Jeera Rice",
    category: "Grains",
    calories: 145,
    protein: 2.5,
    carbs: 26.0,
    fat: 3.2,
    defaultServingSize: 150,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Yellow Dal Tadka",
    category: "Dal / Curry",
    calories: 90,
    protein: 5.0,
    carbs: 14.0,
    fat: 1.5,
    defaultServingSize: 150, // 1 bowl
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Dal Makhani",
    category: "Dal / Curry",
    calories: 140,
    protein: 4.8,
    carbs: 15.0,
    fat: 6.5,
    defaultServingSize: 150,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Paneer Butter Masala",
    category: "Dal / Curry",
    calories: 198,
    protein: 7.5,
    carbs: 8.0,
    fat: 15.5,
    defaultServingSize: 150,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Palak Paneer",
    category: "Dal / Curry",
    calories: 110,
    protein: 6.8,
    carbs: 4.5,
    fat: 7.5,
    defaultServingSize: 150,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Chole Masala (Chickpeas)",
    category: "Dal / Curry",
    calories: 135,
    protein: 6.0,
    carbs: 20.0,
    fat: 3.5,
    defaultServingSize: 150,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Chicken Biryani",
    category: "Rice Dish",
    calories: 165,
    protein: 9.5,
    carbs: 22.0,
    fat: 4.5,
    defaultServingSize: 250, // 1 large plate/bowl
    servingUnit: "plate",
    isIndian: true
  },
  {
    name: "Vegetable Biryani",
    category: "Rice Dish",
    calories: 140,
    protein: 3.5,
    carbs: 24.0,
    fat: 3.2,
    defaultServingSize: 250,
    servingUnit: "plate",
    isIndian: true
  },
  {
    name: "Butter Chicken (Murgh Makhani)",
    category: "Meat Dish",
    calories: 195,
    protein: 14.0,
    carbs: 5.5,
    fat: 13.0,
    defaultServingSize: 180,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Chicken Curry (Home Style)",
    category: "Meat Dish",
    calories: 130,
    protein: 15.0,
    carbs: 3.0,
    fat: 6.2,
    defaultServingSize: 180,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Egg Bhurji (Scrambled)",
    category: "Egg Dish",
    calories: 170,
    protein: 11.5,
    carbs: 2.5,
    fat: 12.5,
    defaultServingSize: 100, // 1 portion
    servingUnit: "plate",
    isIndian: true
  },
  {
    name: "Masala Dosa",
    category: "Breakfast / South Indian",
    calories: 180,
    protein: 3.8,
    carbs: 29.0,
    fat: 5.5,
    defaultServingSize: 120, // 1 large Dosa with filling
    servingUnit: "dosa",
    isIndian: true
  },
  {
    name: "Plain Dosa",
    category: "Breakfast / South Indian",
    calories: 150,
    protein: 3.5,
    carbs: 28.0,
    fat: 2.5,
    defaultServingSize: 80,
    servingUnit: "dosa",
    isIndian: true
  },
  {
    name: "Idli (Rice & Lentil Cake)",
    category: "Breakfast / South Indian",
    calories: 112,
    protein: 3.2,
    carbs: 23.5,
    fat: 0.5,
    defaultServingSize: 45, // 1 medium idli
    servingUnit: "idli",
    isIndian: true
  },
  {
    name: "Sambar",
    category: "Dal / Curry",
    calories: 65,
    protein: 2.5,
    carbs: 10.0,
    fat: 1.5,
    defaultServingSize: 120, // 1 small bowl
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Coconut Chutney",
    category: "Sauce / Dip",
    calories: 220,
    protein: 3.0,
    carbs: 8.5,
    fat: 20.0,
    defaultServingSize: 30, // 2 tbsp
    servingUnit: "tablespoon",
    isIndian: true
  },
  {
    name: "Poha (Flattened Rice)",
    category: "Breakfast",
    calories: 180,
    protein: 3.5,
    carbs: 34.0,
    fat: 3.0,
    defaultServingSize: 120, // 1 bowl
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Upma (Semolina Porridge)",
    category: "Breakfast",
    calories: 160,
    protein: 4.0,
    carbs: 28.0,
    fat: 3.5,
    defaultServingSize: 120,
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Samosa",
    category: "Snacks",
    calories: 310,
    protein: 4.5,
    carbs: 32.0,
    fat: 18.0,
    defaultServingSize: 70, // 1 piece
    servingUnit: "samosa",
    isIndian: true
  },
  {
    name: "Dhokla",
    category: "Snacks",
    calories: 160,
    protein: 6.0,
    carbs: 22.0,
    fat: 5.2,
    defaultServingSize: 50, // 1 piece
    servingUnit: "piece",
    isIndian: true
  },
  {
    name: "Aloo Tikki",
    category: "Snacks",
    calories: 210,
    protein: 3.2,
    carbs: 28.0,
    fat: 9.5,
    defaultServingSize: 60, // 1 patty
    servingUnit: "patty",
    isIndian: true
  },
  {
    name: "Gulab Jamun",
    category: "Dessert",
    calories: 320,
    protein: 4.0,
    carbs: 56.0,
    fat: 9.0,
    defaultServingSize: 45, // 1 piece
    servingUnit: "piece",
    isIndian: true
  },
  {
    name: "Jalebi",
    category: "Dessert",
    calories: 350,
    protein: 2.2,
    carbs: 72.0,
    fat: 6.0,
    defaultServingSize: 30, // 1 piece
    servingUnit: "piece",
    isIndian: true
  },
  {
    name: "Curd / Dahi (Whole Milk)",
    category: "Dairy",
    calories: 60,
    protein: 3.2,
    carbs: 4.0,
    fat: 3.3,
    defaultServingSize: 100, // 1 small bowl
    servingUnit: "bowl",
    isIndian: true
  },
  {
    name: "Masala Chai (with milk & sugar)",
    category: "Beverage",
    calories: 45,
    protein: 1.2,
    carbs: 6.5,
    fat: 1.5,
    defaultServingSize: 150, // 1 cup
    servingUnit: "cup",
    isIndian: true
  },

  // --- Global / Western Foods ---
  {
    name: "Avocado Toast",
    category: "Breakfast",
    calories: 195,
    protein: 4.8,
    carbs: 20.0,
    fat: 11.5,
    defaultServingSize: 120, // 1 slice
    servingUnit: "slice",
    isIndian: false
  },
  {
    name: "Boiled Egg",
    category: "Eggs",
    calories: 155,
    protein: 12.6,
    carbs: 1.1,
    fat: 10.6,
    defaultServingSize: 50, // 1 large egg
    servingUnit: "egg",
    isIndian: false
  },
  {
    name: "Omelette (2 Eggs)",
    category: "Eggs",
    calories: 160,
    protein: 11.0,
    carbs: 1.5,
    fat: 12.0,
    defaultServingSize: 100,
    servingUnit: "omelette",
    isIndian: false
  },
  {
    name: "Oatmeal (Cooked in Milk)",
    category: "Breakfast",
    calories: 95,
    protein: 4.0,
    carbs: 16.0,
    fat: 1.8,
    defaultServingSize: 200, // 1 cup/bowl
    servingUnit: "bowl",
    isIndian: false
  },
  {
    name: "Oatmeal (Cooked in Water)",
    category: "Breakfast",
    calories: 62,
    protein: 2.0,
    carbs: 11.5,
    fat: 1.0,
    defaultServingSize: 200,
    servingUnit: "bowl",
    isIndian: false
  },
  {
    name: "Greek Yogurt (Plain, Low Fat)",
    category: "Dairy",
    calories: 73,
    protein: 10.0,
    carbs: 3.6,
    fat: 2.0,
    defaultServingSize: 150, // 1 container
    servingUnit: "cup",
    isIndian: false
  },
  {
    name: "Grilled Chicken Breast",
    category: "Meat / Protein",
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.6,
    defaultServingSize: 150, // 1 breast portion
    servingUnit: "grams",
    isIndian: false
  },
  {
    name: "Grilled Salmon Fillet",
    category: "Meat / Protein",
    calories: 206,
    protein: 22.0,
    carbs: 0.0,
    fat: 12.0,
    defaultServingSize: 150,
    servingUnit: "grams",
    isIndian: false
  },
  {
    name: "Whey Protein Powder",
    category: "Supplements",
    calories: 390,
    protein: 80.0,
    carbs: 6.0,
    fat: 5.0,
    defaultServingSize: 30, // 1 scoop
    servingUnit: "scoop",
    isIndian: false
  },
  {
    name: "Peanut Butter",
    category: "Spreads",
    calories: 588,
    protein: 25.0,
    carbs: 20.0,
    fat: 50.0,
    defaultServingSize: 16, // 1 tbsp
    servingUnit: "tablespoon",
    isIndian: false
  },
  {
    name: "Banana",
    category: "Fruits",
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    defaultServingSize: 120, // 1 medium banana
    servingUnit: "banana",
    isIndian: false
  },
  {
    name: "Apple",
    category: "Fruits",
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    defaultServingSize: 150, // 1 medium apple
    servingUnit: "apple",
    isIndian: false
  },
  {
    name: "Orange",
    category: "Fruits",
    calories: 47,
    protein: 0.9,
    carbs: 11.8,
    fat: 0.1,
    defaultServingSize: 130, // 1 medium orange
    servingUnit: "orange",
    isIndian: false
  },
  {
    name: "Steamed Broccoli",
    category: "Vegetables",
    calories: 35,
    protein: 2.8,
    carbs: 7.0,
    fat: 0.4,
    defaultServingSize: 100, // 1 cup
    servingUnit: "bowl",
    isIndian: false
  },
  {
    name: "Mixed Salad Green",
    category: "Vegetables",
    calories: 15,
    protein: 1.4,
    carbs: 2.8,
    fat: 0.2,
    defaultServingSize: 100,
    servingUnit: "plate",
    isIndian: false
  },
  {
    name: "Almonds",
    category: "Nuts & Seeds",
    calories: 579,
    protein: 21.0,
    carbs: 22.0,
    fat: 49.0,
    defaultServingSize: 15, // ~10-12 almonds
    servingUnit: "grams",
    isIndian: false
  },
  {
    name: "Pizza (Cheese Slice)",
    category: "Fast Food",
    calories: 266,
    protein: 11.0,
    carbs: 30.0,
    fat: 10.0,
    defaultServingSize: 100, // 1 slice
    servingUnit: "slice",
    isIndian: false
  },
  {
    name: "Chicken Burger",
    category: "Fast Food",
    calories: 250,
    protein: 13.0,
    carbs: 28.0,
    fat: 9.0,
    defaultServingSize: 150, // 1 burger
    servingUnit: "burger",
    isIndian: false
  },
  {
    name: "French Fries",
    category: "Fast Food",
    calories: 312,
    protein: 3.4,
    carbs: 41.0,
    fat: 15.0,
    defaultServingSize: 100, // 1 medium portion
    servingUnit: "plate",
    isIndian: false
  },
  {
    name: "Whole Milk",
    category: "Dairy",
    calories: 61,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
    defaultServingSize: 240, // 1 glass / cup
    servingUnit: "glass",
    isIndian: false
  },
  {
    name: "Skimmed Milk",
    category: "Dairy",
    calories: 35,
    protein: 3.4,
    carbs: 5.0,
    fat: 0.1,
    defaultServingSize: 240,
    servingUnit: "glass",
    isIndian: false
  }
];
