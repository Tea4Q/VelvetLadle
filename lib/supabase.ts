import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://dtquebzsiqhwylyfsszk.supabase.co'; // e.g., 'https://your-project.supabase.co'
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cXVlYnpzaXFod3lseWZzc3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MzU4NjYsImV4cCI6MjA2OTQxMTg2Nn0.2RI3NyRc3Lo_tXSMwNj2vlxXlBBkCm3mm5p-I8rqVZ0'; // Your public anon key

// Check if Supabase credentials are configured
const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;

// Create Supabase client with validation
let supabase: any = null;

if (isSupabaseConfigured) {
  try {
    // Validate URL format
    new URL(supabaseUrl);
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch {
    console.error('Invalid Supabase URL format:', supabaseUrl);
    console.error('Please check your Supabase configuration in lib/supabase.ts');
  }
} else {
  console.warn('⚠️  Supabase not configured. Please update lib/supabase.ts with your credentials.');
  console.warn('📖 See SUPABASE_SETUP.md for setup instructions.');
}

export { supabase, isSupabaseConfigured };

// Database table structure for recipes with enhanced search fields
export type Recipe = {
  id?: number;
  title: string;
  ingredients: string[];
  directions: string[];
  servings?: number;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
  nutritional_info?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    sugar?: string;
  };
  web_address: string;
  image_url?: string;
  description?: string;
  cuisine_type?: string;
  difficulty_level?: string;
  
  // Enhanced fields for search and filtering
  tags?: string[];                    // Custom tags for categorization
  dietary_restrictions?: string[];    // vegetarian, vegan, gluten-free, etc.
  meal_type?: string;                // breakfast, lunch, dinner, snack, dessert
  season?: string;                   // spring, summer, fall, winter
  rating?: number;                   // User rating 0-5
  difficulty_rating?: number;        // 1=easy to 5=expert
  prep_time_minutes?: number;        // Numeric prep time for filtering
  cook_time_minutes?: number;        // Numeric cook time for filtering
  total_time_minutes?: number;       // Numeric total time for filtering
  source_website?: string;           // Domain name for source tracking
  recipe_yield?: string;             // "4 servings", "12 muffins", etc.
  
  // Favorites system
  is_favorite?: boolean;             // Whether this recipe is marked as favorite
  favorited_at?: string;             // When it was added to favorites
  
  created_at?: string;
  updated_at?: string;
};

// Favorites table structure for URLs and quick access
export type Favorite = {
  id?: number;
  user_id?: string;                  // For multi-user support in future
  type: 'recipe' | 'url';           // Type of favorite
  recipe_id?: number;               // Reference to recipe if type is 'recipe'
  url?: string;                     // URL if type is 'url'
  title: string;                    // Display title
  description?: string;             // Optional description
  image_url?: string;               // Thumbnail/preview image
  tags?: string[];                  // Custom tags for organization
  notes?: string;                   // Personal notes about the favorite
  created_at?: string;
  updated_at?: string;
};
