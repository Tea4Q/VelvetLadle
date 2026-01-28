-- Migration: Remove text time fields and keep only numeric minute fields
-- This migration removes the ISO 8601 text fields (prep_time, cook_time, total_time)
-- and keeps only the numeric minute fields for better query performance
-- Run this in your Supabase SQL editor

-- Step 1: Convert any existing text times to numeric minutes (if they exist)
-- This is a safety step in case you have existing data
UPDATE recipes 
SET 
  prep_time_minutes = CASE 
    WHEN prep_time IS NOT NULL THEN 
      COALESCE(
        (regexp_match(prep_time, 'PT(\d+)H'))[1]::integer * 60 +
        COALESCE((regexp_match(prep_time, '(\d+)M'))[1]::integer, 0),
        (regexp_match(prep_time, 'PT(\d+)M'))[1]::integer
      )
    ELSE prep_time_minutes
  END,
  cook_time_minutes = CASE 
    WHEN cook_time IS NOT NULL THEN 
      COALESCE(
        (regexp_match(cook_time, 'PT(\d+)H'))[1]::integer * 60 +
        COALESCE((regexp_match(cook_time, '(\d+)M'))[1]::integer, 0),
        (regexp_match(cook_time, 'PT(\d+)M'))[1]::integer
      )
    ELSE cook_time_minutes
  END,
  total_time_minutes = CASE 
    WHEN total_time IS NOT NULL THEN 
      COALESCE(
        (regexp_match(total_time, 'PT(\d+)H'))[1]::integer * 60 +
        COALESCE((regexp_match(total_time, '(\d+)M'))[1]::integer, 0),
        (regexp_match(total_time, 'PT(\d+)M'))[1]::integer
      )
    ELSE total_time_minutes
  END
WHERE prep_time IS NOT NULL OR cook_time IS NOT NULL OR total_time IS NOT NULL;

-- Step 2: Drop the old text columns
ALTER TABLE recipes DROP COLUMN IF EXISTS prep_time;
ALTER TABLE recipes DROP COLUMN IF EXISTS cook_time;
ALTER TABLE recipes DROP COLUMN IF EXISTS total_time;

-- Verify the migration
SELECT COUNT(*) as total_recipes, 
       COUNT(prep_time_minutes) as with_prep_time,
       COUNT(cook_time_minutes) as with_cook_time,
       COUNT(total_time_minutes) as with_total_time
FROM recipes;
