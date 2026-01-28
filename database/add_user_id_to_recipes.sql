-- Add missing user_id column to recipes table
-- This column is needed to associate recipes with users for multi-user support
-- Run this in your Supabase SQL editor

-- Add user_id column if it doesn't exist
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' AND column_name = 'user_id';
