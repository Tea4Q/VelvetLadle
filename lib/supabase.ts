import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Use environment variables for security
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug: print EXPO_PUBLIC env visibility only when explicitly enabled
const isEnvDebugEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_ENV_DEBUG === "true";

if (isEnvDebugEnabled) {
  const envObj = process.env as Record<string, string | undefined>;
  const expoPublicKeys = Object.keys(envObj)
    .filter((k) => k.startsWith("EXPO_PUBLIC_"))
    .sort();

  console.warn(
    "[ENV DEBUG] EXPO_PUBLIC keys:",
    expoPublicKeys.length ? expoPublicKeys.join(", ") : "(none)",
  );
  console.warn("[ENV DEBUG] EXPO_PUBLIC_SUPABASE_URL present:", !!supabaseUrl);
  console.warn(
    "[ENV DEBUG] EXPO_PUBLIC_SUPABASE_ANON_KEY present:",
    !!supabaseKey,
  );
  console.warn(
    "[ENV DEBUG] EXPO_PUBLIC_SUPABASE_ANON_KEY length:",
    supabaseKey?.length ?? 0,
  );

  if (supabaseUrl) {
    try {
      console.warn("[ENV DEBUG] Supabase URL host:", new URL(supabaseUrl).host);
    } catch {
      console.warn("[ENV DEBUG] Supabase URL is not a valid URL");
    }
  }
}

const hasValidSupabaseUrl =
  typeof supabaseUrl === "string" &&
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co") &&
  !supabaseUrl.includes("your-project-id");

const hasValidSupabaseKey =
  typeof supabaseKey === "string" &&
  supabaseKey.trim().length > 20 &&
  !supabaseKey.includes("your-anon-key");

// Check if Supabase credentials are configured
const isSupabaseConfigured = hasValidSupabaseUrl && hasValidSupabaseKey;

// Create Supabase client with validation
let supabase: any = null;

if (isSupabaseConfigured) {
  try {
    // Validate URL format
    new URL(supabaseUrl);
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    console.error("Invalid Supabase URL format:", supabaseUrl);
    console.error(
      "Please check your Supabase configuration in lib/supabase.ts",
    );
  }
} else {
  console.warn(
    "⚠️  Supabase not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
  console.warn("📖 See SUPABASE_SETUP.md for setup instructions.");
}

export { isSupabaseConfigured, supabase };

// Database table structure for recipes with enhanced search fields
export type Recipe = {
  id?: number;
  user_id?: string; // User who created the recipe (Supabase auth user ID)
  title: string;
  ingredients: string[];
  directions: string[];
  servings?: number;
  nutritional_info?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    sugar?: string;
    sodium?: string;
  };
  web_address: string;
  recipe_source?: string; // Where the recipe came from (e.g., "Grandma's recipe", "Found in old cookbook")
  image_url?: string;
  description?: string;
  cuisine_type?: string;
  difficulty_level?: string;

  // Enhanced fields for search and filtering
  tags?: string[]; // Custom tags for categorization
  dietary_restrictions?: string[]; // vegetarian, vegan, gluten-free, etc.
  meal_type?: string; // breakfast, lunch, dinner, snack, dessert
  season?: string; // spring, summer, fall, winter
  rating?: number; // User rating 0-5
  difficulty_rating?: number; // 1=easy to 5=expert
  prep_time_minutes?: number; // Numeric prep time for filtering
  cook_time_minutes?: number; // Numeric cook time for filtering
  total_time_minutes?: number; // Numeric total time for filtering
  recipe_yield?: string; // "4 servings", "12 muffins", etc.

  // Favorites system
  is_favorite?: boolean; // Whether this recipe is marked as favorite
  favorited_at?: string; // When it was added to favorites

  created_at?: string;
  updated_at?: string;

  // Personal notes for this recipe
  personal_notes?: string;
};

// Favorites table structure for URLs and quick access
export type Favorite = {
  id?: number;
  user_id?: string; // For multi-user support in future
  type: "recipe" | "url"; // Type of favorite
  recipe_id?: number; // Reference to recipe if type is 'recipe'
  url?: string; // URL if type is 'url'
  title: string; // Display title
  description?: string; // Optional description
  image_url?: string; // Thumbnail/preview image
  tags?: string[]; // Custom tags for organization
  notes?: string; // Personal notes about the favorite
  created_at?: string;
  updated_at?: string;
};

// Add this function for testing
export const testSupabaseConnection = async () => {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("count")
      .limit(1);
    // Production build: console.log removed

    return { success: !error, error: error?.message };
  } catch (error) {
    console.error("Supabase connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// Add this debugging at the top
// Production build: console.log removed
