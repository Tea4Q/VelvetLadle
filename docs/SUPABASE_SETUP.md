# Supabase Setup Guide for VelvetLadle Recipe App

> **📝 Note**: The app works in demo mode without Supabase! Recipes will be stored temporarily in memory for testing. Follow this guide to set up permanent storage.

## Demo Mode vs Database Mode

- **Demo Mode** (default): Recipes stored in memory, lost when app restarts
- **Database Mode**: Recipes permanently stored in Supabase cloud database

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Note your project URL and anon key from the project settings

## 2. Update Configuration

Update `lib/supabase.ts` with your actual credentials:

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key-here';
```

## 3. Create Database Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create recipes table with enhanced search and filter support
CREATE TABLE recipes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  directions TEXT[] NOT NULL DEFAULT '{}',
  servings INTEGER,
  prep_time TEXT,
  cook_time TEXT,
  total_time TEXT,
  nutritional_info JSONB,
  web_address TEXT NOT NULL,
  recipe_source TEXT, -- Where the recipe came from (e.g., "Grandma's recipe", "Found in old cookbook")
  image_url TEXT,
  description TEXT,
  cuisine_type TEXT,
  difficulty_level TEXT,
  
  -- Enhanced fields for better search and filtering
  tags TEXT[] DEFAULT '{}',                    -- Custom tags for categorization
  dietary_restrictions TEXT[] DEFAULT '{}',    -- vegetarian, vegan, gluten-free, etc.
  meal_type TEXT,                             -- breakfast, lunch, dinner, snack, dessert
  season TEXT,                                -- spring, summer, fall, winter
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5), -- User rating 0-5
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5), -- 1=easy to 5=expert
  prep_time_minutes INTEGER,                  -- Numeric prep time for filtering
  cook_time_minutes INTEGER,                  -- Numeric cook time for filtering
  total_time_minutes INTEGER,                 -- Numeric total time for filtering
  source_website TEXT,                        -- Domain name for source tracking
  recipe_yield TEXT,                          -- "4 servings", "12 muffins", etc.
  
  -- Full-text search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(title, '') || ' ' || 
      coalesce(description, '') || ' ' || 
      coalesce(array_to_string(ingredients, ' '), '') || ' ' ||
      coalesce(cuisine_type, '') || ' ' ||
      coalesce(meal_type, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes for fast searching and filtering
CREATE INDEX idx_recipes_web_address ON recipes(web_address);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX idx_recipes_prep_time ON recipes(prep_time_minutes);
CREATE INDEX idx_recipes_total_time ON recipes(total_time_minutes);
CREATE INDEX idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty_rating);

-- Full-text search index
CREATE INDEX idx_recipes_search_vector ON recipes USING GIN(search_vector);

-- Multi-column indexes for common filter combinations
CREATE INDEX idx_recipes_cuisine_time ON recipes(cuisine_type, total_time_minutes);
CREATE INDEX idx_recipes_meal_difficulty ON recipes(meal_type, difficulty_rating);

-- Array indexes for ingredient and tag searches
CREATE INDEX idx_recipes_ingredients ON recipes USING GIN(ingredients);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_dietary ON recipes USING GIN(dietary_restrictions);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on recipes" ON recipes
FOR ALL USING (true) WITH CHECK (true);

-- Create function to update search vector when recipes change
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- The search_vector is automatically updated by the GENERATED ALWAYS expression
  -- This trigger can be used for additional search indexing if needed
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_recipe_timestamp
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_vector();
```

## 4. Database Migration (For Existing Users)

If you already have a recipes table, run this migration to add the new search and filter fields:

```sql
-- Add new columns for enhanced search and filtering
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS recipe_source TEXT, -- Where the recipe came from (e.g., "Grandma's recipe", "Found in old cookbook")
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meal_type TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS source_website TEXT,
ADD COLUMN IF NOT EXISTS recipe_yield TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS favorited_at TIMESTAMP WITH TIME ZONE;

-- Add generated search vector column
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(array_to_string(ingredients, ' '), '') || ' ' ||
    coalesce(cuisine_type, '') || ' ' ||
    coalesce(meal_type, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
) STORED;

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('recipe', 'url')),
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_recipe_favorite UNIQUE (recipe_id) WHERE type = 'recipe',
  CONSTRAINT unique_url_favorite UNIQUE (url) WHERE type = 'url',
  CONSTRAINT check_recipe_or_url CHECK (
    (type = 'recipe' AND recipe_id IS NOT NULL AND url IS NULL) OR
    (type = 'url' AND url IS NOT NULL AND recipe_id IS NULL)
  )
);

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_prep_time ON recipes(prep_time_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes(total_time_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_recipes_favorited_at ON recipes(favorited_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_search_vector ON recipes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_time ON recipes(cuisine_type, total_time_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_difficulty ON recipes(meal_type, difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING GIN(ingredients);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary ON recipes USING GIN(dietary_restrictions);

-- Favorites table indexes
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_url ON favorites(url);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tags ON favorites USING GIN(tags);

-- Enable RLS for favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on favorites" ON favorites
FOR ALL USING (true) WITH CHECK (true);

-- Update existing recipes with extracted data
UPDATE recipes SET 
  source_website = split_part(web_address, '/', 3),
  prep_time_minutes = CASE 
    WHEN prep_time ~ '^\d+' THEN regexp_replace(prep_time, '\D.*', '')::INTEGER
    ELSE NULL 
  END,
  cook_time_minutes = CASE 
    WHEN cook_time ~ '^\d+' THEN regexp_replace(cook_time, '\D.*', '')::INTEGER
    ELSE NULL 
  END,
  total_time_minutes = CASE 
    WHEN total_time ~ '^\d+' THEN regexp_replace(total_time, '\D.*', '')::INTEGER
    ELSE NULL 
  END
WHERE source_website IS NULL OR prep_time_minutes IS NULL;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_recipe_timestamp ON recipes;
CREATE TRIGGER update_recipe_timestamp
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_vector();
```

## 5. Environment Variables (Optional)

For production, consider using environment variables:

1. Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Update `lib/supabase.ts`:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

## 6. Enhanced Search Features

The updated database schema includes powerful search and filtering capabilities:

### **🔍 Full-Text Search**
- Automatic search vector generation for fast text search
- Searches across title, description, ingredients, cuisine, and tags
- PostgreSQL's built-in text search with ranking

### **🏷️ Advanced Categorization**
- **Tags**: Custom recipe tags for flexible categorization
- **Meal Types**: breakfast, lunch, dinner, snack, dessert
- **Dietary Restrictions**: vegetarian, vegan, gluten-free, dairy-free, etc.
- **Seasonal**: spring, summer, fall, winter recipes

### **⏱️ Time-Based Filtering**
- Numeric time fields for precise filtering
- Filter by prep time, cook time, or total time
- Example: "Show me recipes under 30 minutes"

### **⭐ Rating & Difficulty**
- User ratings (0-5 stars) for recipe quality
- Difficulty ratings (1-5) for cooking complexity
- Filter by minimum rating or maximum difficulty

### **📊 Performance Optimizations**
- GIN indexes for array searches (ingredients, tags, dietary)
- Multi-column indexes for common filter combinations
- Automatic timestamp updates with triggers

### **Example Advanced Queries**

```sql
-- Find quick vegetarian dinner recipes
SELECT * FROM recipes 
WHERE 'vegetarian' = ANY(dietary_restrictions)
  AND meal_type = 'dinner'
  AND total_time_minutes <= 30
  AND rating >= 4.0
ORDER BY rating DESC, total_time_minutes ASC;

-- Full-text search for "pasta" recipes
SELECT *, ts_rank(search_vector, to_tsquery('pasta')) as rank
FROM recipes 
WHERE search_vector @@ to_tsquery('pasta')
ORDER BY rank DESC;

-- Find recipes with specific ingredients
SELECT * FROM recipes
WHERE ingredients @> ARRAY['chicken', 'tomatoes']
ORDER BY created_at DESC;
```

## 7. Test the Setup

1. Enter a recipe URL (e.g., from AllRecipes, Food Network, etc.)
2. Click "Process Recipe"
3. **Demo Mode**: Recipe saved to memory (check console logs)
4. **Database Mode**: Check your Supabase dashboard to see if the recipe was saved

## 8. Verify Storage Mode

The app will display storage mode in success messages:
- **Demo Mode**: "Successfully saved to demo storage (temporary)"
- **Database Mode**: "Successfully saved to Supabase database"

## Supported Recipe Websites

The recipe extractor works best with:
- AllRecipes.com
- Food Network
- Epicurious
- Delish
- Tasty.co
- Taste of Home
- Any site with JSON-LD structured data
- Sites using schema.org/Recipe microdata

## Troubleshooting

- **"No Recipe Found"**: The URL might not contain recipe data or use an unsupported format
- **"Extraction Failed"**: The recipe might be behind a paywall or use non-standard markup
- **Database errors**: Check your Supabase credentials and table setup
- **Network errors**: Ensure internet connection and check CORS settings if needed

### CORS (Cross-Origin) Issues

**Problem**: "Cross-Origin Request Blocked" or "CORS header missing" errors

**Cause**: Many recipe websites block direct access from web browsers for security reasons

**Solutions**:
1. **Use Mobile App**: Native mobile apps don't have CORS restrictions
2. **Manual Entry**: Click "Enter Manually" when CORS error occurs
3. **Copy/Paste**: Open recipe in browser, copy text, paste into manual entry
4. **Alternative Sites**: Try recipe sites with better CORS support

**CORS-Friendly Recipe Sites**:
- Some smaller food blogs
- GitHub-hosted recipe collections
- Sites specifically designed for API access

**Web vs Mobile Behavior**:
- **Web Browser**: Limited by CORS policies, may need manual entry
- **Mobile App**: Full access to most recipe websites
