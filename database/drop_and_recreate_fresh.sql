-- WARNING: This will DELETE ALL RECIPES and recreate the tables from scratch
-- Only use this if you don't have important data you want to keep
-- If you have data you want to keep, use migration_remove_text_time_fields.sql instead

-- Drop existing tables (this deletes all data!)
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;

-- Now run the main schema file: database_schema.sql
-- Copy and paste the contents of database_schema.sql here or run it separately
