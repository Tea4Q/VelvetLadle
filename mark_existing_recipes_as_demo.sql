-- Mark existing recipes as demo recipes for guest browsing
-- Run this in Supabase SQL Editor to set existing recipes to demo mode (user_id = NULL)

-- Option 1: Mark ALL existing recipes as demo recipes
UPDATE recipes
SET user_id = NULL
WHERE user_id IS NOT NULL;

-- Option 2: Mark only specific recipes as demo (by ID)
-- Uncomment and replace the IDs with your recipe IDs
-- UPDATE recipes
-- SET user_id = NULL
-- WHERE id IN (1, 2, 3, 4, 5);

-- Option 3: Mark recipes from a specific user as demo
-- Uncomment and replace 'USER_UUID_HERE' with the user's UUID
-- UPDATE recipes
-- SET user_id = NULL
-- WHERE user_id = 'USER_UUID_HERE';

-- Verify the changes
SELECT id, title, user_id, created_at
FROM recipes
WHERE user_id IS NULL
ORDER BY created_at DESC;
