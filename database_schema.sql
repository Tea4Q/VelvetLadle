-- VelvetLadle Recipe Database Schema
-- Enhanced version with search, filter, and favorites capabilities
-- Run this in your Supabase SQL editor

-- Create recipes table with enhanced search and filter support
CREATE TABLE IF NOT EXISTS recipes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,                               -- User who created the recipe (Supabase auth user ID)
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  directions TEXT[] NOT NULL DEFAULT '{}',
  servings INTEGER,
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
  
  -- Favorites system
  is_favorite BOOLEAN DEFAULT FALSE,          -- Whether this recipe is marked as favorite
  favorited_at TIMESTAMP WITH TIME ZONE,     -- When it was added to favorites
  
  -- Full-text search optimization (populated by trigger)
  search_vector tsvector,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table for URLs and advanced favorites management
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,                               -- For multi-user support in future
  type TEXT NOT NULL CHECK (type IN ('recipe', 'url')), -- Type of favorite
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE, -- Reference to recipe if type is 'recipe'
  url TEXT,                                   -- URL if type is 'url'
  title TEXT NOT NULL,                        -- Display title
  description TEXT,                           -- Optional description
  image_url TEXT,                             -- Thumbnail/preview image
  tags TEXT[] DEFAULT '{}',                   -- Custom tags for organization
  notes TEXT,                                 -- Personal notes about the favorite
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 -- Add partial unique constraints separately
CREATE UNIQUE INDEX unique_recipe_favorite ON favorites (recipe_id) 
WHERE type = 'recipe';

CREATE UNIQUE INDEX unique_url_favorite ON favorites (url) 
WHERE type = 'url';

-- Add check constraint to ensure either recipe_id or url is set based on type
ALTER TABLE favorites ADD CONSTRAINT check_recipe_or_url 
CHECK (
  (type = 'recipe' AND recipe_id IS NOT NULL AND url IS NULL) OR
  (type = 'url' AND url IS NOT NULL AND recipe_id IS NULL)
);

-- Performance indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_recipes_web_address ON recipes(web_address);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_prep_time ON recipes(prep_time_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes(total_time_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_recipes_favorited_at ON recipes(favorited_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_recipes_search_vector ON recipes USING GIN(search_vector);

-- Multi-column indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_time ON recipes(cuisine_type, total_time_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_difficulty ON recipes(meal_type, difficulty_rating);

-- Array indexes for ingredient and tag searches
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

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on recipes" ON recipes;
DROP POLICY IF EXISTS "Allow all operations on favorites" ON favorites;

-- Create policies to allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on recipes" ON recipes
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on favorites" ON favorites
FOR ALL USING (true) WITH CHECK (true);

-- Create function to update search vector when recipes change
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the search vector with full-text search data
  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.title, '') || ' ' || 
    coalesce(NEW.description, '') || ' ' || 
    coalesce(array_to_string(NEW.ingredients, ' '), '') || ' ' ||
    coalesce(NEW.cuisine_type, '') || ' ' ||
    coalesce(NEW.meal_type, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  
  -- Update timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps and search vector
DROP TRIGGER IF EXISTS update_recipe_timestamp ON recipes;
CREATE TRIGGER update_recipe_timestamp
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_vector();

-- Function to update search vectors for existing records
CREATE OR REPLACE FUNCTION populate_existing_search_vectors()
RETURNS void AS $$
BEGIN
  UPDATE recipes 
  SET search_vector = to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(array_to_string(ingredients, ' '), '') || ' ' ||
    coalesce(cuisine_type, '') || ' ' ||
    coalesce(meal_type, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
  WHERE search_vector IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Call the function to populate search vectors for any existing records
SELECT populate_existing_search_vectors();

-- Insert some sample data to test the schema (optional)
-- Uncomment the lines below if you want sample recipes


/*INSERT INTO recipes (
  title, ingredients, directions, cuisine_type, meal_type, 
  prep_time_minutes, total_time_minutes, rating, difficulty_rating,
  tags, dietary_restrictions, web_address, description
) VALUES 
(
  'Quick Vegetarian Pasta',
  ARRAY['pasta', 'tomatoes', 'basil', 'olive oil', 'garlic'],
  ARRAY['Boil pasta', 'Sauté garlic', 'Add tomatoes', 'Combine with pasta', 'Garnish with basil'],
  'Italian',
  'dinner',
  10,
  20,
  4.5,
  2,
  ARRAY['quick', 'easy', 'weeknight'],
  ARRAY['vegetarian'],
  'https://example.com/vegetarian-pasta',
  'A quick and delicious vegetarian pasta perfect for busy weeknights'
),
(
  'Chocolate Chip Cookies',
  ARRAY['flour', 'butter', 'sugar', 'eggs', 'chocolate chips', 'vanilla'],
  ARRAY['Cream butter and sugar', 'Add eggs and vanilla', 'Mix in flour', 'Fold in chocolate chips', 'Bake at 375°F'],
  'American',
  'dessert',
  15,
  45,
  4.8,
  3,
  ARRAY['baking', 'sweet', 'classic'],
  ARRAY['vegetarian'],
  'https://example.com/chocolate-chip-cookies',
  'Classic homemade chocolate chip cookies that everyone loves'
);
*/

-- Verify the setup
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'recipes'
ORDER BY indexname;

-- Show table structure
\d recipes;

-- Test full-text search capability
-- SELECT title, ts_rank(search_vector, to_tsquery('pasta')) as rank
-- FROM recipes 
-- WHERE search_vector @@ to_tsquery('pasta')
-- ORDER BY rank DESC;

COMMENT ON TABLE recipes IS 'VelvetLadle recipe storage with enhanced search and filtering capabilities';
COMMENT ON COLUMN recipes.search_vector IS 'Automatically generated full-text search vector';
COMMENT ON COLUMN recipes.tags IS 'Custom tags for flexible recipe categorization';
COMMENT ON COLUMN recipes.dietary_restrictions IS 'Dietary restriction labels (vegetarian, vegan, etc.)';
COMMENT ON COLUMN recipes.meal_type IS 'Type of meal (breakfast, lunch, dinner, snack, dessert)';
COMMENT ON COLUMN recipes.prep_time_minutes IS 'Preparation time in minutes for numeric filtering';
COMMENT ON COLUMN recipes.total_time_minutes IS 'Total cooking time in minutes for numeric filtering';
