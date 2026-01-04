# Recipe Source Feature

## Overview
The Manual Recipe Modal now includes a "Recipe Source" field that allows users to track where they got their recipes from, replacing the previous URL-only input.

## Features

### Recipe Source Input
- **Smart Suggestions**: As you type, the app shows previously used sources
- **Auto-completion**: Tap any suggestion to quickly fill in the field
- **Usage Tracking**: Sources are ranked by how often they've been used
- **Flexible Input**: Accept any text describing where the recipe came from

### Example Sources
- "Grandma's recipe"
- "Found in old cookbook"
- "From neighbor next door"
- "Family recipe passed down"
- "Recipe card from recipe box"
- "Mom's handwritten notes"

## How It Works

### For Users
1. When adding or editing a manual recipe, you'll see a "Recipe Source" field
2. Start typing where you got the recipe from
3. Previous entries will appear as suggestions
4. Select a suggestion or continue typing your own description
5. The source will be saved and available for future use

### For Developers
- **RecipeSourceService**: Manages storing and retrieving recipe sources using AsyncStorage
- **RecipeSourceInput**: Custom component with autocomplete functionality using ScrollView (not FlatList to avoid VirtualizedList nesting issues)
- **Recipe Type**: Updated to include `recipe_source` field
- **Database**: Both Supabase and demo storage support the new field

## Technical Notes
- Uses `ScrollView` instead of `FlatList` for suggestions to avoid "VirtualizedLists should never be nested inside plain ScrollViews" error
- `nestedScrollEnabled={true}` allows smooth scrolling within the parent ScrollView
- Shows all available suggestions with vertical scrolling
- Scroll indicator visible to show when more entries are available
- Larger touch targets (60px min height) for better usability

## Storage
- Sources are stored locally using AsyncStorage
- Each source tracks usage count and last used date
- Sources are automatically ranked by frequency of use

## Display
- In the Recipe Viewer, manually entered recipes now show both:
  - "✏️ Manually entered recipe"
  - "📖 [Source description]" (if provided)

## Migration
- Existing recipes continue to work normally
- The `web_address` field is preserved for backward compatibility
- New `recipe_source` field is optional and additive
