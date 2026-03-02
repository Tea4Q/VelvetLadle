import { Recipe } from "../lib/supabase";
import { isNetworkFetchError } from "../utils/networkUtils";
import { CorsProxyService } from "./corsProxyService";
import { fetchNutrition } from "./nutritionService";
import { WebScrapingAPIService } from "./webScrapingAPIService";

export class RecipeExtractor {
  private static toUserFriendlyExtractionError(error: unknown): string {
    const message = String(
      (error as any)?.message ?? error ?? "",
    ).toLowerCase();

    if (isNetworkFetchError(error)) {
      return "Could not access this website right now. Please check your connection, try again, or use manual entry.";
    }

    if (message.includes("timeout")) {
      return "The website took too long to respond. Please try again or use manual entry.";
    }

    if (
      message.includes("cors") ||
      message.includes("blocked") ||
      message.includes("forbidden")
    ) {
      return "This website blocks automated access. Please use manual entry for this recipe.";
    }

    return "Could not extract recipe from this URL. The site may be unsupported or blocked.";
  }

  /**
   * Remove duplicate directions (case-insensitive comparison)
   * Handles recipe sites that repeat instructions in multiple sections (mobile/print views)
   */
  private static deduplicateDirections(directions: string[]): string[] {
    const uniqueDirections: string[] = [];
    const seenLowerCase = new Set<string>();

    for (const dir of directions) {
      const lowerDir = dir.toLowerCase().trim();
      if (!seenLowerCase.has(lowerDir)) {
        seenLowerCase.add(lowerDir);
        uniqueDirections.push(dir);
      }
    }

    return uniqueDirections;
  }

  /**
   * Convert ISO 8601 duration (PT30M, PT1H30M, PT2H) to minutes
   */
  private static iso8601ToMinutes(
    duration: string | undefined,
  ): number | undefined {
    if (!duration) return undefined;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return undefined;

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const totalMinutes = hours * 60 + minutes;

    return totalMinutes > 0 ? totalMinutes : undefined;
  }

  /**
   * Parse calories value - extract number only
   * Examples: "765", "765 kcal", "765 calories" -> 765
   */
  private static parseCalories(value: any): number | undefined {
    if (!value) return undefined;

    const str = String(value);
    const match = str.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return Math.round(parseFloat(match[1]));
    }
    return undefined;
  }

  /**
   * Parse nutrition string value - ensure format with units
   * Examples: "44.0", "44", "44g", "44.0 g" -> "44g"
   */
  private static parseNutritionValue(value: any): string | undefined {
    if (!value) return undefined;

    const str = String(value);
    const match = str.match(/(\d+(?:\.\d+)?)\s*(g|mg|mcg|µg)?/i);
    if (match) {
      const number = parseFloat(match[1]);
      const unit = match[2] || "g";
      return `${Math.round(number)}${unit}`;
    }
    return undefined;
  }
  /**
   * Returns { recipe, error } where only one is set.
   */
  static async extractRecipeFromUrl(
    url: string,
  ): Promise<{ recipe?: Recipe; error?: string }> {
    try {
      // Production build: console.log removed

      // Validate URL format first
      if (!this.isValidUrl(url)) {
        const msg = "Invalid website URL format.";
        console.error("❌", msg, url);
        return { error: msg };
      }

      // Strategy 1: Try API-based extraction first (most reliable)
      // Production build: console.log removed
      try {
        const apiRecipe = await Promise.race([
          WebScrapingAPIService.extractRecipeWithAPIs(url),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("API timeout")), 45000),
          ),
        ]);
        if (apiRecipe) {
          // Production build: console.log removed
          // Production build: console.log removed
          // Production build: console.log removed

          // If we have directions, return the recipe
          if (apiRecipe.directions && apiRecipe.directions.length > 0) {
            return { recipe: apiRecipe };
          }

          // If no directions, try to supplement with HTML extraction
          // Production build: console.log removed
          try {
            const response = await Promise.race([
              CorsProxyService.fetchWithCorsProxy(url),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error("CORS proxy timeout")),
                  30000,
                ),
              ),
            ]);

            if (response.ok) {
              const html = await response.text();
              // Production build: console.log removed

              // Try all HTML extraction methods
              const jsonLdRecipe = this.extractFromJsonLd(html);
              if (
                jsonLdRecipe?.directions &&
                jsonLdRecipe.directions.length > 0
              ) {
                // Production build: console.log removed
                apiRecipe.directions = jsonLdRecipe.directions;
                return { recipe: apiRecipe };
              }

              const microdataRecipe = this.extractFromMicrodata(html);
              if (
                microdataRecipe?.directions &&
                microdataRecipe.directions.length > 0
              ) {
                // Production build: console.log removed
                apiRecipe.directions = microdataRecipe.directions;
                return { recipe: apiRecipe };
              }

              const manualRecipe = this.extractManually(html, url);
              if (
                manualRecipe?.directions &&
                manualRecipe.directions.length > 0
              ) {
                // Production build: console.log removed
                // Production build: console.log removed
                apiRecipe.directions = manualRecipe.directions;
                // Production build: console.log removed

                // Also supplement with cook times if API didn't provide them
                // Prefer HTML times when reasonable, as they're often more accurate than API
                if (
                  manualRecipe.prep_time_minutes &&
                  (!apiRecipe.prep_time_minutes ||
                    manualRecipe.prep_time_minutes >= 10)
                ) {
                  apiRecipe.prep_time_minutes = manualRecipe.prep_time_minutes;
                }

                if (
                  manualRecipe.cook_time_minutes &&
                  (!apiRecipe.cook_time_minutes ||
                    manualRecipe.cook_time_minutes >= 15)
                ) {
                  apiRecipe.cook_time_minutes = manualRecipe.cook_time_minutes;
                }

                if (
                  manualRecipe.total_time_minutes &&
                  (!apiRecipe.total_time_minutes ||
                    manualRecipe.total_time_minutes >= 15)
                ) {
                  apiRecipe.total_time_minutes =
                    manualRecipe.total_time_minutes;
                }

                return { recipe: apiRecipe };
              }

              // Production build: console.log removed
            }
          } catch (htmlError) {
            // Production build: console.log removed
          }

          // Return API recipe even without directions (user can add manually)
          // Production build: console.log removed
          return { recipe: apiRecipe };
        } else {
          // Production build: console.log removed
        }
      } catch (error: any) {
        // Production build: console.log removed
        // Continue to fallback strategies instead of surfacing raw API/network errors
      }

      // Strategy 2: Fallback to CORS proxy method
      // Production build: console.log removed
      try {
        const response = await Promise.race([
          CorsProxyService.fetchWithCorsProxy(url),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("CORS proxy timeout")), 30000),
          ),
        ]);

        if (!response.ok) {
          const msg = `HTTP error! status: ${response.status}`;
          return { error: msg };
        }
        const html = await response.text();
        // Production build: console.log removed

        // Try to extract JSON-LD structured data first (most reliable)
        // Production build: console.log removed
        let jsonLdRecipe = this.extractFromJsonLd(html);
        if (jsonLdRecipe) {
          // Production build: console.log removed
          // Production build: console.log removed
          // Production build: console.log removed
        } else {
          // Production build: console.log removed
        }
        if (
          jsonLdRecipe &&
          jsonLdRecipe.title &&
          jsonLdRecipe.ingredients &&
          jsonLdRecipe.ingredients.length > 0
        ) {
          let recipeWithImage = { ...jsonLdRecipe, web_address: url } as Recipe;
          // Ensure we have an image
          if (!recipeWithImage.image_url) {
            recipeWithImage.image_url = this.extractImageFromHtml(html, url);
          }
          // Debug: Log extracted nutritional_info from site
          // Production build: console.log removed
          // If no nutrition info, use nutritionService
          if (
            !recipeWithImage.nutritional_info &&
            recipeWithImage.ingredients &&
            recipeWithImage.ingredients.length > 0
          ) {
            try {
              const servings = recipeWithImage.servings || 1;
              const nutritionResult = await fetchNutrition(
                recipeWithImage.ingredients,
                servings,
              );
              // Production build: console.log removed
              if (
                nutritionResult.success &&
                nutritionResult.data &&
                Array.isArray(nutritionResult.data)
              ) {
                // Spoonacular returns an array of ingredient objects, each with nutrition info
                // We'll sum up the nutrients for all ingredients
                const totals = {
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  fiber: 0,
                  sugar: 0,
                  sodium: 0,
                };
                nutritionResult.data.forEach((ingredient: any) => {
                  if (ingredient.nutrition && ingredient.nutrition.nutrients) {
                    ingredient.nutrition.nutrients.forEach((nutrient: any) => {
                      const name = nutrient.name.toLowerCase();
                      const amount = parseFloat(nutrient.amount);
                      if (name === "calories") totals.calories += amount;
                      if (name === "protein") totals.protein += amount;
                      if (name === "carbohydrates") totals.carbs += amount;
                      if (name === "fat") totals.fat += amount;
                      if (name === "fiber") totals.fiber += amount;
                      if (name === "sugar") totals.sugar += amount;
                      if (name === "sodium") totals.sodium += amount;
                    });
                  }
                });
                // Format to match nutritional_info structure
                // Only include sodium if the type allows it, otherwise omit
                // Divide totals by servings to get per-serving values
                const perServing = {
                  calories: totals.calories / servings,
                  protein: totals.protein / servings,
                  carbs: totals.carbs / servings,
                  fat: totals.fat / servings,
                  fiber: totals.fiber / servings,
                  sugar: totals.sugar / servings,
                  sodium: totals.sodium / servings,
                };
                const hasAnyNutrition =
                  perServing.calories > 0 ||
                  perServing.protein > 0 ||
                  perServing.carbs > 0 ||
                  perServing.fat > 0;
                if (hasAnyNutrition) {
                  recipeWithImage.nutritional_info = {
                    calories: Math.round(perServing.calories),
                    protein: perServing.protein
                      ? perServing.protein.toFixed(1) + "g"
                      : undefined,
                    carbs: perServing.carbs
                      ? perServing.carbs.toFixed(1) + "g"
                      : undefined,
                    fat: perServing.fat ? perServing.fat.toFixed(1) + "g" : undefined,
                    fiber: perServing.fiber
                      ? perServing.fiber.toFixed(1) + "g"
                      : undefined,
                    sugar: perServing.sugar
                      ? perServing.sugar.toFixed(1) + "g"
                      : undefined,
                    sodium: perServing.sodium
                      ? perServing.sodium.toFixed(1) + "mg"
                      : undefined,
                  };
                } else {
                  recipeWithImage.nutritional_info = undefined;
                }
                // Production build: console.log removed
              }
            } catch (e) {
              console.error("[Extractor] fetchNutrition error:", e);
            }
          }
          return { recipe: recipeWithImage };
        }

        // Fallback to microdata extraction
        // Production build: console.log removed
        const microdataRecipe = this.extractFromMicrodata(html);
        if (microdataRecipe) {
          // Production build: console.log removed
          // Production build: console.log removed
          // Production build: console.log removed
        } else {
          // Production build: console.log removed
        }
        if (
          microdataRecipe &&
          microdataRecipe.title &&
          microdataRecipe.ingredients &&
          microdataRecipe.ingredients.length > 0
        ) {
          const recipeWithImage = {
            ...microdataRecipe,
            web_address: url,
          } as Recipe;
          // Ensure we have an image
          if (!recipeWithImage.image_url) {
            recipeWithImage.image_url = this.extractImageFromHtml(html, url);
          }
          return { recipe: recipeWithImage };
        }

        // Last resort: manual extraction from common HTML patterns
        // Production build: console.log removed
        const manualRecipe = this.extractManually(html, url);
        if (manualRecipe) {
          // Production build: console.log removed
          // Production build: console.log removed
          // Production build: console.log removed
        } else {
          // Production build: console.log removed
        }
        if (
          manualRecipe &&
          manualRecipe.title &&
          manualRecipe.ingredients &&
          manualRecipe.ingredients.length > 0
        ) {
          const recipeWithImage = {
            ...manualRecipe,
            web_address: url,
          } as Recipe;
          // Ensure we have an image
          if (!recipeWithImage.image_url) {
            recipeWithImage.image_url = this.extractImageFromHtml(html, url);
          }
          return { recipe: recipeWithImage };
        }
      } catch (error: any) {
        return { error: this.toUserFriendlyExtractionError(error) };
      }
      // If all strategies fail,
      return {
        error:
          "Could not extract recipe from this URL. The site may be unsupported or blocked.",
      };
    } catch (error: any) {
      const msg =
        "Critical error during recipe extraction: " + (error?.message || error);
      console.error("💥", msg);
      return { error: msg };
    }
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static extractFromJsonLd(html: string): Partial<Recipe> | null {
    try {
      // Find JSON-LD script tags using regex
      const scriptRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
      let match;

      while ((match = scriptRegex.exec(html)) !== null) {
        try {
          const content = match[1].trim();
          const data = JSON.parse(content);

          // Handle array of structured data
          const recipes = Array.isArray(data) ? data : [data];

          for (const item of recipes) {
            if (item["@type"] === "Recipe" || item.type === "Recipe") {
              // Production build: console.log removed
              // Patch: Extract nutrition directly if present in JSON-LD
              const parsed = this.parseJsonLdRecipe(item);
              // Production build: console.log removed
              if (item.nutrition) {
                const rawNutrition = item.nutrition;
                parsed.nutritional_info = {
                  calories: this.parseCalories(
                    rawNutrition.calories ||
                      rawNutrition.caloriesContent ||
                      rawNutrition["calories"],
                  ),
                  protein: this.parseNutritionValue(
                    rawNutrition.proteinContent || rawNutrition.protein,
                  ),
                  carbs: this.parseNutritionValue(
                    rawNutrition.carbohydrateContent ||
                      rawNutrition.carbs ||
                      rawNutrition.carbohydrates,
                  ),
                  fat: this.parseNutritionValue(
                    rawNutrition.fatContent ||
                      rawNutrition.fat ||
                      rawNutrition.totalFat,
                  ),
                  fiber: this.parseNutritionValue(
                    rawNutrition.fiberContent ||
                      rawNutrition.fiber ||
                      rawNutrition.dietaryFiber,
                  ),
                  sugar: this.parseNutritionValue(
                    rawNutrition.sugarContent ||
                      rawNutrition.sugar ||
                      rawNutrition.sugars,
                  ),
                  sodium: this.parseNutritionValue(
                    rawNutrition.sodiumContent ||
                      rawNutrition.sodium ||
                      rawNutrition.salt,
                  ),
                };
              }
              return parsed;
            }
          }
        } catch (parseError) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing JSON-LD:", error);
      return null;
    }
  }

  static extractImageFromHtml(
    html: string,
    baseUrl: string,
  ): string | undefined {
    try {
      // Priority 1: Look for recipe-specific image patterns
      const recipeImagePatterns = [
        // Recipe card images
        /<img[^>]*class="[^"]*recipe-card[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*recipe-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*recipe-photo[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*featured-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*hero-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*entry-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*post-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src=["']([^"']+)["']/i,

        // Microdata images
        /<img[^>]*itemprop=["']image["'][^>]*src=["']([^"']+)["']/i,

        // Open Graph images
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,

        // Twitter card images
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,

        // General article images
        /<img[^>]*class="[^"]*article-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*main-image[^"]*"[^>]*src=["']([^"']+)["']/i,

        // Data attributes (common in modern websites)
        /<img[^>]*data-src=["']([^"']+)["']/i,
        /<img[^>]*data-lazy=["']([^"']+)["']/i,
        /<img[^>]*data-original=["']([^"']+)["']/i,
      ];

      for (const pattern of recipeImagePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const imageUrl = this.normalizeImageUrl(match[1], baseUrl);
          if (this.isValidImageUrl(imageUrl)) {
            // Production build: console.log removed
            return imageUrl;
          }
        }
      }

      // Priority 2: Look for any large images in the content area
      const contentImagePattern =
        /<img[^>]*src=["']([^"']+)["'][^>]*(?:width=["'](\d+)["']|height=["'](\d+)["'])?[^>]*>/gi;
      const imageMatches = Array.from(html.matchAll(contentImagePattern));

      // Filter and score images
      const candidateImages = imageMatches
        .map((match) => ({
          url: this.normalizeImageUrl(match[1], baseUrl),
          width: parseInt(match[2] || "0"),
          height: parseInt(match[3] || "0"),
          score: this.scoreImageRelevance(match[0], match[1]),
        }))
        .filter((img) => this.isValidImageUrl(img.url))
        .sort((a, b) => b.score - a.score);

      if (candidateImages.length > 0) {
        // Production build: console.log removed
        return candidateImages[0].url;
      }

      // Production build: console.log removed
      return undefined;
    } catch (error) {
      console.error("Error extracting image:", error);
      return undefined;
    }
  }

  static normalizeImageUrl(imageUrl: string, baseUrl: string): string {
    try {
      // If it's already a full URL, return it
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
      }

      // If it starts with //, add protocol
      if (imageUrl.startsWith("//")) {
        const baseProtocol = new URL(baseUrl).protocol;
        return `${baseProtocol}${imageUrl}`;
      }

      // If it's a relative URL, resolve it against the base URL
      const base = new URL(baseUrl);
      return new URL(imageUrl, base).toString();
    } catch {
      return imageUrl;
    }
  }

  static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      // Check for valid image extensions
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".avif",
        ".svg",
      ];
      const hasImageExtension = imageExtensions.some((ext) =>
        pathname.endsWith(ext),
      );

      // Check for image-like query parameters (common in CDNs)
      const hasImageParams =
        urlObj.search.includes("format=") ||
        urlObj.search.includes("w=") ||
        urlObj.search.includes("width=") ||
        urlObj.search.includes("h=") ||
        urlObj.search.includes("height=");

      // Exclude common non-recipe images
      const excludePatterns = [
        "logo",
        "icon",
        "avatar",
        "profile",
        "social",
        "banner",
        "ad",
        "advertisement",
        "sponsor",
        "placeholder",
        "default",
        "1x1",
        "pixel",
      ];

      const hasExcludedPattern = excludePatterns.some(
        (pattern) =>
          pathname.includes(pattern) || urlObj.search.includes(pattern),
      );

      return (hasImageExtension || hasImageParams) && !hasExcludedPattern;
    } catch {
      return false;
    }
  }

  static scoreImageRelevance(imgTag: string, src: string): number {
    let score = 0;
    const tag = imgTag.toLowerCase();
    const url = src.toLowerCase();

    // Positive indicators
    if (tag.includes("recipe") || url.includes("recipe")) score += 100;
    if (tag.includes("food") || url.includes("food")) score += 80;
    if (tag.includes("dish") || url.includes("dish")) score += 70;
    if (tag.includes("featured") || url.includes("featured")) score += 60;
    if (tag.includes("hero") || url.includes("hero")) score += 50;
    if (tag.includes("main") || url.includes("main")) score += 40;
    if (tag.includes("large") || url.includes("large")) score += 30;

    // Size indicators (width/height attributes)
    const widthMatch = tag.match(/width=["'](\d+)["']/);
    const heightMatch = tag.match(/height=["'](\d+)["']/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1]);
      if (width >= 400) score += 20;
      if (width >= 600) score += 30;
    }
    if (heightMatch) {
      const height = parseInt(heightMatch[1]);
      if (height >= 300) score += 20;
      if (height >= 400) score += 30;
    }

    // Negative indicators
    if (tag.includes("logo") || url.includes("logo")) score -= 50;
    if (tag.includes("icon") || url.includes("icon")) score -= 40;
    if (tag.includes("avatar") || url.includes("avatar")) score -= 40;
    if (tag.includes("ad") || url.includes("ad")) score -= 60;
    if (tag.includes("banner") || url.includes("banner")) score -= 30;
    if (tag.includes("thumb") || url.includes("thumb")) score -= 20;

    return score;
  }

  private static extractNutritionFromHtml(html: string): any {
    // Patch: Allrecipes-specific nutrition extraction fallback
    // Look for Allrecipes nutrition facts section
    const allrecipesSection = html.match(
      /<section[^>]*class="nutrition-section"[\s\S]*?<\/section>/i,
    );
    if (allrecipesSection && allrecipesSection[0]) {
      const sectionHtml = allrecipesSection[0];
      // Extract nutrition facts (e.g., Calories, Carbs, Protein, Fat, etc.)
      const nutrition: any = {};
      const facts = [
        { key: "calories", label: /([\d,]+)\s*calories?/i },
        { key: "carbs", label: /([\d,.]+)g\s*carbohydrates?/i },
        { key: "protein", label: /([\d,.]+)g\s*protein/i },
        { key: "fat", label: /([\d,.]+)g\s*fat/i },
        { key: "fiber", label: /([\d,.]+)g\s*fiber/i },
        { key: "sugar", label: /([\d,.]+)g\s*sugar/i },
        { key: "sodium", label: /([\d,.]+)mg\s*sodium/i },
      ];
      for (const fact of facts) {
        const match = sectionHtml.match(fact.label);
        if (match && match[1]) {
          nutrition[fact.key] =
            match[1] +
            (fact.key === "sodium" ? "mg" : fact.key === "calories" ? "" : "g");
        }
      }
      if (Object.keys(nutrition).length > 0) return nutrition;
    }
    try {
      const nutrition: any = {};

      // Generic fallback (existing logic, but improved to allow decimals and commas)
      const facts = [
        { key: "calories", label: /(\d+[.,]?\d*)\s*calories?/gi, unit: "" },
        { key: "protein", label: /(\d+[.,]?\d*)g?\s*protein/gi, unit: "g" },
        {
          key: "carbs",
          label: /(\d+[.,]?\d*)g?\s*carb(?:ohydrate)?s?/gi,
          unit: "g",
        },
        { key: "fat", label: /(\d+[.,]?\d*)g?\s*fat/gi, unit: "g" },
        { key: "fiber", label: /(\d+[.,]?\d*)g?\s*fiber/gi, unit: "g" },
        { key: "sugar", label: /(\d+[.,]?\d*)g?\s*sugar/gi, unit: "g" },
        { key: "sodium", label: /(\d+[.,]?\d*)mg?\s*sodium/gi, unit: "mg" },
      ];
      for (const fact of facts) {
        const match = html.match(fact.label);
        if (match && match[0]) {
          const value =
            match[0].match(/\d+[.,]?\d*/)?.[0].replace(",", "") || "";
          if (value) nutrition[fact.key] = value + fact.unit;
        }
      }

      return Object.keys(nutrition).length > 0 ? nutrition : null;
    } catch (error) {
      console.error("Error extracting nutrition from HTML:", error);
      return null;
    }
  }

  private static extractCuisineFromHtml(html: string): string | null {
    try {
      // Priority 1: Look for specific cuisine/category meta tags
      const metaCuisinePatterns = [
        // Open Graph cuisine/category
        /<meta[^>]*property=["']og:cuisine["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*property=["']og:category["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*property=["']recipe:category["'][^>]*content=["']([^"']+)["']/i,

        // Twitter card cuisine
        /<meta[^>]*name=["']twitter:cuisine["'][^>]*content=["']([^"']+)["']/i,

        // Recipe-specific meta tags
        /<meta[^>]*name=["']recipe-category["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*name=["']cuisine["'][^>]*content=["']([^"']+)["']/i,
      ];

      for (const pattern of metaCuisinePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && this.isValidCuisine(match[1])) {
          return this.normalizeCuisine(match[1]);
        }
      }

      // Priority 2: Look for cuisine in structured data that might not be JSON-LD
      const structuredPatterns = [
        /<[^>]*class="[^"]*recipe-category[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*cuisine[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*recipe-cuisine[^"]*"[^>]*>([^<]+)/i,
      ];

      for (const pattern of structuredPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && this.isValidCuisine(match[1])) {
          return this.normalizeCuisine(match[1]);
        }
      }

      // Priority 3: Look for cuisine keywords in title, headings, and breadcrumbs
      const contextPatterns = [
        // Breadcrumb patterns
        /<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)<\/nav>/is,
        /<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)<\/ol>/is,

        // Title and heading patterns
        /<title>([^<]+)</i,
        /<h1[^>]*>([^<]+)</i,
        /<h2[^>]*>([^<]+)</i,
      ];

      for (const pattern of contextPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const extractedCuisine = this.extractCuisineFromText(match[1]);
          if (extractedCuisine) {
            return extractedCuisine;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error extracting cuisine:", error);
      return null;
    }
  }

  static extractCuisineFromText(text: string): string | undefined {
    if (!text || typeof text !== "string") return undefined;

    const normalized = text.toLowerCase();

    // Known cuisine keywords with priority order
    const cuisineKeywords = [
      { keyword: "italian", cuisine: "Italian" },
      { keyword: "chinese", cuisine: "Chinese" },
      { keyword: "mexican", cuisine: "Mexican" },
      { keyword: "indian", cuisine: "Indian" },
      { keyword: "thai", cuisine: "Thai" },
      { keyword: "japanese", cuisine: "Japanese" },
      { keyword: "french", cuisine: "French" },
      { keyword: "mediterranean", cuisine: "Mediterranean" },
      { keyword: "american", cuisine: "American" },
      { keyword: "greek", cuisine: "Greek" },
      { keyword: "korean", cuisine: "Korean" },
      { keyword: "vietnamese", cuisine: "Vietnamese" },
      { keyword: "spanish", cuisine: "Spanish" },
      { keyword: "moroccan", cuisine: "Moroccan" },
      { keyword: "lebanese", cuisine: "Lebanese" },
      { keyword: "turkish", cuisine: "Turkish" },
      { keyword: "german", cuisine: "German" },
      { keyword: "british", cuisine: "British" },
      { keyword: "caribbean", cuisine: "Caribbean" },
      { keyword: "brazilian", cuisine: "Brazilian" },
      { keyword: "peruvian", cuisine: "Peruvian" },
      { keyword: "ethiopian", cuisine: "Ethiopian" },
      { keyword: "russian", cuisine: "Russian" },
      { keyword: "scandinavian", cuisine: "Scandinavian" },
      { keyword: "middle eastern", cuisine: "Middle Eastern" },
      { keyword: "asian", cuisine: "Asian" },
      { keyword: "european", cuisine: "European" },
      { keyword: "african", cuisine: "African" },
      { keyword: "latin", cuisine: "Latin" },
    ];

    // Find the first matching cuisine keyword
    for (const { keyword, cuisine } of cuisineKeywords) {
      if (normalized.includes(keyword)) {
        return cuisine;
      }
    }

    return undefined;
  }

  static isValidCuisine(cuisine: string): boolean {
    if (!cuisine || typeof cuisine !== "string") return false;

    const trimmed = cuisine.trim();
    if (trimmed.length < 3 || trimmed.length > 50) return false;

    // Exclude common non-cuisine terms
    const excludeTerms = [
      "recipe",
      "recipes",
      "cooking",
      "food",
      "kitchen",
      "chef",
      "dish",
      "meal",
      "dinner",
      "lunch",
      "breakfast",
      "dessert",
      "appetizer",
      "main",
      "side",
      "snack",
      "drink",
      "beverage",
      "blog",
      "website",
      "home",
      "page",
      "category",
      "tag",
    ];

    const normalized = trimmed.toLowerCase();
    return !excludeTerms.some((term) => normalized.includes(term));
  }

  static normalizeCuisine(cuisine: string): string {
    if (!cuisine) return "";

    return cuisine
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  static parseJsonLdRecipe(data: any): Partial<Recipe> {
    const recipe: Partial<Recipe> = {
      title: data.name || "",
      ingredients: [],
      directions: [],
    };

    // Extract ingredients
    if (data.recipeIngredient) {
      recipe.ingredients = Array.isArray(data.recipeIngredient)
        ? data.recipeIngredient
        : [data.recipeIngredient];
    }

    // Extract directions - check both recipeInstructions and instructions fields
    const instructionsData = data.recipeInstructions || data.instructions;
    // Production build: console.log removed
    if (instructionsData) {
      recipe.directions = (
        Array.isArray(instructionsData) ? instructionsData : [instructionsData]
      )
        .map((instruction: any) => {
          if (typeof instruction === "string") return instruction;
          return instruction.text || instruction.name || "";
        })
        .filter((dir: string) => dir.length > 0);

      recipe.directions = this.deduplicateDirections(recipe.directions);
      // Production build: console.log removed
    } else {
      console.warn("[JSON-LD] No instructions data found in JSON-LD");
    }

    // Extract servings
    if (data.recipeYield) {
      const yield_ = Array.isArray(data.recipeYield)
        ? data.recipeYield[0]
        : data.recipeYield;
      // Always store the original string
      recipe.recipe_yield = yield_.toString();
      // Improved number parsing: extract first number in the string
      const match = yield_.toString().match(/\d+(?:\.\d+)?/);
      if (match) {
        recipe.servings = parseFloat(match[0]);
      } else {
        recipe.servings = undefined;
      }
    }

    // Extract times and convert to minutes
    if (data.prepTime)
      recipe.prep_time_minutes = this.iso8601ToMinutes(data.prepTime);
    if (data.cookTime)
      recipe.cook_time_minutes = this.iso8601ToMinutes(data.cookTime);
    if (data.totalTime)
      recipe.total_time_minutes = this.iso8601ToMinutes(data.totalTime);

    // Extract nutritional information using nutritionService
    recipe.nutritional_info = undefined;
    // We'll use a placeholder async function to fetch nutrition, since parseJsonLdRecipe is not async.
    // The actual call should be made in the main extraction flow, not here, but for now we mark for follow-up.
    // See note below for integration in async context.

    // Extract other metadata
    if (data.image) {
      // Handle various image formats in JSON-LD
      if (Array.isArray(data.image)) {
        // Take the first image if it's an array
        const firstImage = data.image[0];
        if (typeof firstImage === "string") {
          recipe.image_url = firstImage;
        } else if (firstImage && firstImage.url) {
          recipe.image_url = firstImage.url;
        } else if (firstImage && firstImage["@id"]) {
          recipe.image_url = firstImage["@id"];
        }
      } else if (typeof data.image === "string") {
        recipe.image_url = data.image;
      } else if (data.image.url) {
        recipe.image_url = data.image.url;
      } else if (data.image["@id"]) {
        recipe.image_url = data.image["@id"];
      }

      if (recipe.image_url) {
        // Production build: console.log removed
      }
    }

    if (data.description) recipe.description = data.description;
    if (data.recipeCategory) recipe.cuisine_type = data.recipeCategory;
    if (data.recipeCuisine) recipe.cuisine_type = data.recipeCuisine;

    // If no specific cuisine found but we have category data, try to extract cuisine from it
    if (!recipe.cuisine_type && data.keywords) {
      const keywords = Array.isArray(data.keywords)
        ? data.keywords.join(" ")
        : data.keywords;
      recipe.cuisine_type = this.extractCuisineFromText(keywords);
    }

    return recipe;
  }

  static extractFromMicrodata(html: string): Partial<Recipe> | null {
    try {
      // Look for schema.org/Recipe microdata using regex
      const recipeRegex =
        /itemtype=["'][^"']*schema\.org\/Recipe["'][^>]*>(.*?)<\/[^>]+>/gis;
      const match = recipeRegex.exec(html);

      if (!match) return null;

      const recipeSection = match[1];

      const recipe: Partial<Recipe> = {
        title: "",
        ingredients: [],
        directions: [],
      };

      // Extract title
      const titleMatch = recipeSection.match(
        /itemprop=["']name["'][^>]*>([^<]+)</i,
      );
      if (titleMatch) recipe.title = titleMatch[1].trim();

      // Extract ingredients
      const ingredientMatches = recipeSection.match(
        /itemprop=["']recipeIngredient["'][^>]*>([^<]+)/gi,
      );
      if (ingredientMatches) {
        recipe.ingredients = ingredientMatches
          .map((match) => {
            const content = match.match(/>([^<]+)/);
            return content ? content[1].trim() : "";
          })
          .filter((text) => text.length > 0);
      }

      // Extract directions - check both recipeInstructions and instructions
      let directionMatches = recipeSection.match(
        /itemprop=["'](recipeInstructions|instructions)["'][^>]*>([^<]+)/gi,
      );
      // Production build: console.log removed
      if (directionMatches) {
        recipe.directions = directionMatches
          .map((match) => {
            const content = match.match(/>([^<]+)/);
            return content ? content[1].trim() : "";
          })
          .filter((text) => text.length > 0);

        recipe.directions = this.deduplicateDirections(recipe.directions);
        // Production build: console.log removed
      }

      // Extract image from microdata
      const imageMatch = recipeSection.match(
        /itemprop=["']image["'][^>]*(?:src=["']([^"']+)["']|content=["']([^"']+)["'])/i,
      );
      if (imageMatch) {
        recipe.image_url = imageMatch[1] || imageMatch[2];
        // Production build: console.log removed
      }

      // Extract cuisine from microdata
      const cuisineMatch = recipeSection.match(
        /itemprop=["']recipeCategory["'][^>]*>([^<]+)/i,
      );
      if (cuisineMatch) {
        recipe.cuisine_type = cuisineMatch[1].trim();
      }

      // Extract nutritional information from microdata
      const nutritionMatch = recipeSection.match(
        /itemprop=["']nutrition["'][^>]*>(.*?)<\/[^>]+>/is,
      );
      if (nutritionMatch) {
        const nutritionSection = nutritionMatch[1];
        recipe.nutritional_info = {};

        // Extract calories
        const caloriesMatch = nutritionSection.match(
          /itemprop=["']calories["'][^>]*>([^<]+)/i,
        );
        if (caloriesMatch) {
          recipe.nutritional_info.calories = this.parseCalories(
            caloriesMatch[1],
          );
        }

        // Extract other nutrition facts
        const proteinMatch = nutritionSection.match(
          /itemprop=["']proteinContent["'][^>]*>([^<]+)/i,
        );
        if (proteinMatch)
          recipe.nutritional_info.protein = this.parseNutritionValue(
            proteinMatch[1],
          );

        const carbsMatch = nutritionSection.match(
          /itemprop=["']carbohydrateContent["'][^>]*>([^<]+)/i,
        );
        if (carbsMatch)
          recipe.nutritional_info.carbs = this.parseNutritionValue(
            carbsMatch[1],
          );

        const fatMatch = nutritionSection.match(
          /itemprop=["']fatContent["'][^>]*>([^<]+)/i,
        );
        if (fatMatch)
          recipe.nutritional_info.fat = this.parseNutritionValue(fatMatch[1]);

        const fiberMatch = nutritionSection.match(
          /itemprop=["']fiberContent["'][^>]*>([^<]+)/i,
        );
        if (fiberMatch)
          recipe.nutritional_info.fiber = this.parseNutritionValue(
            fiberMatch[1],
          );

        const sugarMatch = nutritionSection.match(
          /itemprop=["']sugarContent["'][^>]*>([^<]+)/i,
        );
        if (sugarMatch)
          recipe.nutritional_info.sugar = this.parseNutritionValue(
            sugarMatch[1],
          );

        const sodiumMatch = nutritionSection.match(
          /itemprop=["']sodiumContent["'][^>]*>([^<]+)/i,
        );
        if (sodiumMatch)
          recipe.nutritional_info.sodium = this.parseNutritionValue(
            sodiumMatch[1],
          );
      }

      return recipe.title && recipe.ingredients && recipe.ingredients.length > 0
        ? recipe
        : null;
    } catch (error) {
      console.error("Error extracting microdata:", error);
      return null;
    }
  }

  static extractManually(
    html: string,
    baseUrl: string = "",
  ): Partial<Recipe> | null {
    try {
      // Production build: console.log removed
      const recipe: Partial<Recipe> = {
        title: "",
        ingredients: [],
        directions: [],
      };

      // Extract title using common patterns
      const titlePatterns = [
        /<h1[^>]*class="[^"]*recipe-title[^"]*"[^>]*>([^<]+)</i,
        /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)</i,
        /<h1[^>]*>([^<]+)</i,
        /<title>([^<]+)</i,
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1].trim()) {
          recipe.title = match[1].trim().replace(/\s+/g, " ");
          break;
        }
      }

      // Extract ingredients using common patterns
      const ingredientPatterns = [
        /<[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)/gi,
        /<li[^>]*>(?:<[^>]*>)*([^<]*(?:cup|tablespoon|teaspoon|pound|ounce|gram|ml|liter)[^<]*)</gi,
        /<p[^>]*>([^<]*(?:cup|tablespoon|teaspoon|pound|ounce|gram|ml|liter)[^<]*)</gi,
      ];

      for (const pattern of ingredientPatterns) {
        const matches = Array.from(html.matchAll(pattern));
        if (matches.length > 0) {
          recipe.ingredients = matches
            .map((match) => match[1].trim())
            .filter((text) => text.length > 3);
          if (recipe.ingredients.length > 0) break;
        }
      }

      // Extract directions using common patterns - check for both "direction", "instruction", and "step"
      // Production build: console.log removed

      // Strategy 1: Look for structured steps (STEP 1, STEP 2, etc.)
      const stepHeadingPattern =
        /(?:STEP|Step)\s+\d+[^<]*(?:<[^>]*>)*\s*([^<]+(?:<[^>]+>[^<]+)*)/gi;
      let stepMatches = Array.from(html.matchAll(stepHeadingPattern));
      // Production build: console.log removed

      if (stepMatches.length > 0) {
        recipe.directions = stepMatches
          .map((match) => {
            // Extract text, removing HTML tags
            const text = match[1].replace(/<[^>]*>/g, " ").trim();
            return text;
          })
          .filter((text) => text.length > 20);

        recipe.directions = this.deduplicateDirections(recipe.directions);

        if (recipe.directions.length > 0) {
          // Production build: console.log removed
        }
      }

      // Strategy 2: Look for paragraphs after "Instructions" or "Directions" heading
      if (!recipe.directions || recipe.directions.length === 0) {
        const instructionsSectionPattern =
          /<h[1-6][^>]*>\s*(?:Instructions?|Directions?|Method|Steps?)\s*<\/h[1-6]>([\s\S]*?)(?:<h[1-6]|<div[^>]*class="[^"]*(?:notes|tips|nutrition|related)[^"]*"|$)/i;
        const sectionMatch = html.match(instructionsSectionPattern);

        if (sectionMatch) {
          // Production build: console.log removed
          const section = sectionMatch[1];
          // Extract all paragraphs from this section
          const paragraphs = section.match(
            /<p[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/p>/gi,
          );

          if (paragraphs && paragraphs.length > 0) {
            recipe.directions = paragraphs
              .map((p) => {
                const text = p
                  .replace(/<[^>]*>/g, " ")
                  .replace(/&[^;]+;/g, " ")
                  .trim();
                return text;
              })
              .filter((text) => text.length > 20);

            recipe.directions = this.deduplicateDirections(recipe.directions);
            // Production build: console.log removed
          }
        }
      }

      // Strategy 3: Traditional patterns for class-based extraction
      if (!recipe.directions || recipe.directions.length === 0) {
        const directionPatterns = [
          /<[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)/gi,
          /<[^>]*class="[^"]*direction[^"]*"[^>]*>([^<]+)/gi,
          /<[^>]*class="[^"]*step[^"]*"[^>]*>([^<]+)/gi,
          /<[^>]*id="[^"]*instruction[^"]*"[^>]*>([^<]+)/gi,
          /<[^>]*data-[^=]*="[^"]*instruction[^"]*"[^>]*>([^<]+)/gi,
          /<li[^>]*class="[^"]*mntl-sc-block-html[^"]*"[^>]*>([^<]+)/gi,
          /<p[^>]*class="[^"]*comp[^"]*instruction[^"]*"[^>]*>([^<]+)/gi,
          /<div[^>]*class="[^"]*recipe-instructions[^"]*"[^>]*>\s*<p>([^<]+)/gi,
          /<ol[^>]*>\s*<li>([^<]+)/gi, // Ordered list items
        ];

        for (const pattern of directionPatterns) {
          const matches = Array.from(html.matchAll(pattern));
          // Production build: console.log removed
          if (matches.length > 0) {
            recipe.directions = matches
              .map((match) => match[1].trim())
              .filter((text) => text.length > 10);

            recipe.directions = this.deduplicateDirections(recipe.directions);

            if (recipe.directions.length > 0) {
              // Production build: console.log removed
              break;
            }
          }
        }
      }

      if (!recipe.directions || recipe.directions.length === 0) {
        console.warn("[Manual] No directions found with any pattern");
      }

      // Extract cooking times
      // Production build: console.log removed

      // Strategy 1: Look for "TIME" section with hours/minutes (Saveur style)
      // Try multiple patterns to match different HTML structures
      let timeText = null;

      // Pattern 1: TIME label followed by content (most flexible)
      let timeSection = html.match(/TIME[^<]{0,20}<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (timeSection) {
        timeText = timeSection[1].trim();
        // Production build: console.log removed
      }

      // Pattern 2: Direct text search for time format
      if (!timeText) {
        const directPattern = html.match(
          /(\d+\s*hours?\s*\d+\s*minutes?(?:,\s*plus\s*[^<.]+)?)/i,
        );
        if (directPattern) {
          timeText = directPattern[1].trim();
          // Production build: console.log removed
        }
      }

      // Pattern 3: Look around SERVES for TIME
      if (!timeText) {
        const servePattern = html.match(
          /SERVES[^<]*<[^>]*>[\s\S]{0,200}TIME[^<]*<[^>]*>\s*([^<]+)/i,
        );
        if (servePattern) {
          timeText = servePattern[1].trim();
          // Production build: console.log removed
        }
      }

      if (timeText) {
        // Production build: console.log removed

        // Parse hours and minutes
        const hoursMatch = timeText.match(/(\d+)\s*hours?/i);
        const minutesMatch = timeText.match(/(\d+)\s*minutes?/i);

        let totalMinutes = 0;
        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
        if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);

        if (totalMinutes > 0) {
          recipe.total_time_minutes = totalMinutes;
          // Production build: console.log removed
        }
      } else {
        // Production build: console.log removed
      }

      // Strategy 2: Look for time metadata or structured data
      if (
        !recipe.prep_time_minutes ||
        !recipe.cook_time_minutes ||
        !recipe.total_time_minutes
      ) {
        const prepTimeMatch = html.match(
          /<meta[^>]*(?:itemprop|property)=["']prepTime["'][^>]*content=["']([^"']+)["']/i,
        );
        if (prepTimeMatch && !recipe.prep_time_minutes) {
          recipe.prep_time_minutes = this.iso8601ToMinutes(prepTimeMatch[1]);
          // Production build: console.log removed
        }

        const cookTimeMatch = html.match(
          /<meta[^>]*(?:itemprop|property)=["']cookTime["'][^>]*content=["']([^"']+)["']/i,
        );
        if (cookTimeMatch && !recipe.cook_time_minutes) {
          recipe.cook_time_minutes = this.iso8601ToMinutes(cookTimeMatch[1]);
          // Production build: console.log removed
        }

        const totalTimeMatch = html.match(
          /<meta[^>]*(?:itemprop|property)=["']totalTime["'][^>]*content=["']([^"']+)["']/i,
        );
        if (totalTimeMatch && !recipe.total_time_minutes) {
          recipe.total_time_minutes = this.iso8601ToMinutes(totalTimeMatch[1]);
          // Production build: console.log removed
        }
      }

      // Strategy 3: Fallback - Parse times from text
      if (
        !recipe.prep_time_minutes ||
        !recipe.cook_time_minutes ||
        !recipe.total_time_minutes
      ) {
        const timeText = html.match(
          /(?:prep|preparation)[^<]*?(\d+)\s*(?:hour|hr|minute|min)/i,
        );
        if (timeText && !recipe.prep_time_minutes) {
          recipe.prep_time_minutes = parseInt(timeText[1]);
        }

        const cookText = html.match(
          /(?:cook|baking)[^<]*?(\d+)\s*(?:hour|hr|minute|min)/i,
        );
        if (cookText && !recipe.cook_time_minutes) {
          recipe.cook_time_minutes = parseInt(cookText[1]);
        }

        const totalText = html.match(
          /(?:total|about)[^<]*?(\d+)\s*(?:hour|hr|minute|min)/i,
        );
        if (totalText && !recipe.total_time_minutes) {
          recipe.total_time_minutes = parseInt(totalText[1]);
        }
      }

      // Extract image using the dedicated image extraction method
      recipe.image_url = this.extractImageFromHtml(html, baseUrl);

      // Extract cuisine/category information
      recipe.cuisine_type = this.extractCuisineFromHtml(html) || undefined;

      // Extract basic nutritional information from common patterns
      recipe.nutritional_info = this.extractNutritionFromHtml(html);

      return recipe.title && recipe.ingredients && recipe.ingredients.length > 0
        ? recipe
        : null;
    } catch (error) {
      console.error("Error in manual extraction:", error);
      return null;
    }
  }

  static isRecipePage(url: string, html?: string): boolean {
    // Check URL patterns
    const recipeUrlPatterns = [
      /recipe/i,
      /cooking/i,
      /food/i,
      /kitchen/i,
      /allrecipes\.com/i,
      /foodnetwork\.com/i,
      /epicurious\.com/i,
      /delish\.com/i,
      /tasty\.co/i,
      /tasteofhome\.com/i,
    ];

    const hasRecipeUrl = recipeUrlPatterns.some((pattern) => pattern.test(url));

    if (html) {
      // Check for recipe-specific content
      const recipeIndicators = [
        /"@type":\s*"Recipe"/i,
        /itemtype=".*schema\.org\/Recipe"/i,
        /class=".*recipe.*"/i,
        /class=".*ingredient.*"/i,
        /class=".*instruction.*"/i,
        /recipe-ingredients/i,
        /recipe-instructions/i,
      ];

      const hasRecipeContent = recipeIndicators.some((pattern) =>
        pattern.test(html),
      );
      return hasRecipeUrl || hasRecipeContent;
    }

    return hasRecipeUrl;
  }
}
