-- Migration: Add user_id to recipes table and update RLS policies
-- Run this in your Supabase SQL editor

-- 1. Add user_id column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index for user_id
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);

-- 3. Update existing recipes to have a user_id (optional - only if you have existing recipes)
-- This sets existing recipes to NULL user_id, or you can set them to a specific user
-- UPDATE recipes SET user_id = 'your-user-uuid-here' WHERE user_id IS NULL;

-- 4. Drop ALL existing policies (MUST be done before altering column types)
DROP POLICY IF EXISTS "Allow all operations on recipes" ON recipes;
DROP POLICY IF EXISTS "Allow all operations on favorites" ON favorites;

-- Drop any other existing policies on favorites table
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Drop any other existing policies on recipes table
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

-- 5. Update favorites table user_id type to UUID for consistency (before creating new policies)
ALTER TABLE favorites 
ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- 6. Create new RLS policies for recipes - users can only see their own recipes
CREATE POLICY "Users can view their own recipes" ON recipes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" ON recipes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
FOR DELETE USING (auth.uid() = user_id);

-- 7. Create new RLS policies for favorites - users can only see their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites" ON favorites
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own favorites" ON favorites
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites" ON favorites
FOR DELETE USING (user_id = auth.uid());

-- Add NOT NULL constraint after migration (optional - only add after you've populated user_id)
-- ALTER TABLE recipes ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE favorites ALTER COLUMN user_id SET NOT NULL;

COMMENT ON COLUMN recipes.user_id IS 'User who created the recipe - references auth.users';
COMMENT ON COLUMN favorites.user_id IS 'User who favorited the item - references auth.users';
