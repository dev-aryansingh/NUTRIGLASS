// Handles searching across three databases:
// 1. Curated Local Foods (foodData.js)
// 2. User's custom defined foods (localStorage)
// 3. Global Open Food Facts API (web)

import { foodDatabase } from "./foodData.js";
import { DietDatabase } from "./database.js";

export class FoodSearchApi {
  /**
   * Search for foods locally and online
   * @param {string} query The food search term
   * @param {string} userId Active user ID for custom foods
   * @returns {Promise<Array>} List of matching foods normalized
   */
  static async search(query, userId) {
    if (!query || query.trim().length < 2) return [];

    const cleanedQuery = query.toLowerCase().trim();
    
    // 1. Search custom user foods
    const customFoods = DietDatabase.getCustomFoods(userId);
    const matchedCustom = customFoods.filter(food => 
      food.name.toLowerCase().includes(cleanedQuery)
    ).map(food => ({
      ...food,
      source: "custom",
      score: this.calculateMatchScore(food.name, cleanedQuery) + 10 // custom foods get high priority
    }));

    // 2. Search local database
    const matchedLocal = foodDatabase.filter(food => 
      food.name.toLowerCase().includes(cleanedQuery) ||
      (food.category && food.category.toLowerCase().includes(cleanedQuery))
    ).map(food => ({
      ...food,
      source: "local",
      score: this.calculateMatchScore(food.name, cleanedQuery) + 5 // local foods get priority
    }));

    // Sort local/custom results by relevance score
    let localAndCustomResults = [...matchedCustom, ...matchedLocal]
      .sort((a, b) => b.score - a.score);

    // If we have strong matches locally, return them immediately and kick off background fetch
    // Or we fetch online results in parallel to merge them.
    try {
      const onlineResults = await this.searchOnline(cleanedQuery);
      // Merge results, filter out duplicate names
      const allResults = [...localAndCustomResults];
      const seenNames = new Set(allResults.map(r => r.name.toLowerCase()));

      for (const item of onlineResults) {
        const itemKey = item.name.toLowerCase();
        if (!seenNames.has(itemKey)) {
          seenNames.add(itemKey);
          allResults.push(item);
        }
      }

      return allResults;
    } catch (err) {
      console.warn("Failed fetching from Open Food Facts API:", err);
      // Return local results if offline search fails
      return localAndCustomResults;
    }
  }

  /**
   * Simple scoring helper to rank exact matches and prefix matches higher
   */
  static calculateMatchScore(text, query) {
    const textLower = text.toLowerCase();
    if (textLower === query) return 100;
    if (textLower.startsWith(query)) return 50;
    return textLower.indexOf(query);
  }

  /**
   * Query the free Open Food Facts API
   */
  static async searchOnline(query) {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
    
    // Set a timeout of 4 seconds so API calls don't hang forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.products || !Array.isArray(data.products)) return [];

      return data.products
        .filter(product => {
          // Keep only items that have a name and some calorie indicators
          const hasName = product.product_name && product.product_name.trim().length > 0;
          const nut = product.nutriments;
          const hasEnergy = nut && (nut["energy-kcal_100g"] !== undefined || nut["energy_100g"] !== undefined || nut["energy-kcal"] !== undefined);
          return hasName && hasEnergy;
        })
        .map(product => {
          const nut = product.nutriments;
          
          // Determine calories per 100g
          let kcal = 0;
          if (nut["energy-kcal_100g"] !== undefined) {
            kcal = Math.round(Number(nut["energy-kcal_100g"]));
          } else if (nut["energy-kcal"] !== undefined) {
            kcal = Math.round(Number(nut["energy-kcal"]));
          } else if (nut["energy_100g"] !== undefined) {
            // Conversion from kJ to kcal (1 kJ = 0.239 kcal)
            kcal = Math.round(Number(nut["energy_100g"]) * 0.239);
          }

          const protein = this.sanitizeNutrient(nut.proteins_100g || nut.proteins);
          const carbs = this.sanitizeNutrient(nut.carbohydrates_100g || nut.carbohydrates);
          const fat = this.sanitizeNutrient(nut.fat_100g || nut.fat);
          
          // Parse serving size if available, otherwise default to 100g
          let servingSize = 100;
          let servingUnit = "grams";

          if (product.serving_quantity) {
            servingSize = Math.round(Number(product.serving_quantity));
          } else if (product.serving_size) {
            // Attempt to parse something like "30 g" or "1 pot (125 g)"
            const matches = product.serving_size.match(/(\d+(?:\.\d+)?)\s*(g|ml|pcs|oz)/i);
            if (matches && matches[1]) {
              servingSize = Math.round(parseFloat(matches[1]));
              if (matches[2]) servingUnit = matches[2].toLowerCase();
            }
          }

          // Build a clean brand suffix if it exists
          const brand = product.brands ? ` (${product.brands.split(",")[0].trim()})` : "";
          const fullName = `${product.product_name.trim()}${brand}`;

          return {
            name: fullName,
            category: product.categories_tags ? product.categories_tags[0]?.replace("en:", "").replace(/-/g, " ") : "Packaged Food",
            calories: kcal,
            protein: protein,
            carbs: carbs,
            fat: fat,
            defaultServingSize: servingSize,
            servingUnit: servingUnit,
            source: "online"
          };
        });
    } catch (e) {
      if (e.name === "AbortError") {
        console.warn("Online food search request timed out");
      }
      return [];
    }
  }

  static sanitizeNutrient(val) {
    if (val === undefined || val === null) return 0;
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.round(num * 10) / 10; // Round to 1 decimal place
  }
}
export default FoodSearchApi;
