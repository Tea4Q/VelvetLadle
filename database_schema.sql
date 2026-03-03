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

-- =============================================================================
-- ACCOUNT DELETION SYSTEM
-- Run these statements in order in the Supabase SQL editor.
-- =============================================================================

-- Required extension for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- pending_deletion
-- Written when an active subscriber requests deletion.
-- Auto-executed by the app on next open after subscription_end_date passes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_deletion (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE,
  subscription_end_date TIMESTAMPTZ NOT NULL,
  plan_type             TEXT,                    -- 'monthly' | 'annual'
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_deletion ENABLE ROW LEVEL SECURITY;

-- Users can read and delete their own pending deletion row (for cancellation).
-- Inserts/upserts are done via the app using the user's session.
CREATE POLICY "pending_deletion_own_read" ON pending_deletion
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "pending_deletion_own_insert" ON pending_deletion
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "pending_deletion_own_delete" ON pending_deletion
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ---------------------------------------------------------------------------
-- deletion_log
-- Hashed-only audit record. No plaintext PII stored here.
-- Service-role access only — users cannot read or write this directly.
-- Retained for: 30-day resubscribe block, fraud logs, legal compliance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deletion_log (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_hash               TEXT NOT NULL,       -- SHA-256 of auth.uid()
  email_hash                 TEXT NOT NULL,       -- SHA-256 of email
  plan_type                  TEXT,
  subscription_end_date      TIMESTAMPTZ,
  requested_at               TIMESTAMPTZ DEFAULT NOW(),
  executed_at                TIMESTAMPTZ,
  resubscribe_blocked_until  TIMESTAMPTZ          -- requested_at + 30 days
);

ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — service-role only via RPCs below.

-- ---------------------------------------------------------------------------
-- RPC: anonymize_user_data
-- Deletes user recipes/favourites, scrubs PII from auth.users,
-- and records a hashed audit entry in deletion_log.
-- Called from the app via supabase.rpc('anonymize_user_data', { target_user_id })
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  uid_hash   TEXT;
  email_hash TEXT;
BEGIN
  -- Fetch the user's current email for hashing
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = target_user_id;

  -- Compute hashes (no plaintext PII stored)
  uid_hash   := encode(digest(target_user_id::text, 'sha256'), 'hex');
  email_hash := encode(digest(COALESCE(user_email, ''), 'sha256'), 'hex');

  -- Delete user data
  DELETE FROM recipes   WHERE user_id = target_user_id::text;
  DELETE FROM favorites WHERE user_id = target_user_id::text;

  -- Scrub PII from auth record (keeps row for FK integrity)
  UPDATE auth.users
  SET
    email                = uid_hash || '@deleted.invalid',
    raw_user_meta_data   = '{}'::jsonb,
    raw_app_meta_data    = '{}'::jsonb,
    phone                = NULL
  WHERE id = target_user_id;

  -- Audit log (hashed only)
  INSERT INTO deletion_log (
    user_id_hash,
    email_hash,
    executed_at,
    resubscribe_blocked_until
  ) VALUES (
    uid_hash,
    email_hash,
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT DO NOTHING;

  -- Remove pending deletion intent if present
  DELETE FROM pending_deletion WHERE user_id = target_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: check_resubscribe_block
-- Returns TRUE if the given email is still within its 30-day block.
-- Called before allowing a new sign-up with the same email.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_resubscribe_block(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed TEXT;
  blocked BOOLEAN;
BEGIN
  hashed  := encode(digest(email_input, 'sha256'), 'hex');
  blocked := EXISTS (
    SELECT 1
    FROM deletion_log
    WHERE email_hash = hashed
      AND resubscribe_blocked_until > NOW()
  );
  RETURN blocked;
END;
$$;

-- ---------------------------------------------------------------------------
-- Supabase Storage: profile-images bucket
-- Run these in the Supabase Dashboard → Storage → New Bucket,
-- OR run via the management API. The SQL below sets the RLS policies
-- assuming the bucket already exists.
--
-- Bucket settings: name = 'profile-images', public = true
-- ---------------------------------------------------------------------------

-- Policy: users can upload/update only their own folder (userId/profile.jpg)
CREATE POLICY "profile_images_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "profile_images_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "profile_images_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Public read (avatar images are not private)
CREATE POLICY "profile_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

