# Recipe Search & Filter System

The VelvetLadle app now includes a comprehensive search and filter system that allows users to find recipes by text search, ingredients, and cuisine types.

## 🚀 **New Features**

### 📱 **Enhanced Recipe List**
- **Filter Toggle**: Show/hide search and filter controls
- **Live Results**: Real-time filtering as you search
- **Result Counter**: Shows filtered vs total recipes
- **Clear Filters**: Reset all filters with one tap

### 🔍 **Text Search**
- Search by recipe title or description
- Case-insensitive matching
- Instant results as you type

### 🥕 **Ingredient Filtering**
- **Multi-ingredient selection**: Select multiple ingredients to filter by
- **Smart ingredient extraction**: Automatically extracts ingredient names from recipes
- **Visual selection**: Colored tags show selected ingredients
- **Expandable UI**: Collapsible ingredient list to save space

### 🌍 **Cuisine Filtering**
- **Cuisine type detection**: Automatically detects cuisine types from recipes
- **Multi-cuisine selection**: Filter by multiple cuisine types
- **Smart parsing**: Recognizes common cuisine keywords (Italian, Chinese, Mexican, etc.)
- **Visual feedback**: Distinct styling for selected cuisines

## 📋 **How It Works**

### **Component Architecture**

#### **RecipeSearchFilter.tsx**
- Main search and filter interface
- Handles user input and selections
- Collapsible sections for ingredients and cuisines
- Active filter summary

#### **RecipeFilterService.ts**
- Core filtering logic and algorithms
- Ingredient name extraction and normalization
- Cuisine type detection
- Recipe matching algorithms

#### **Enhanced RecipeList.tsx**
- Integrates search functionality
- Manages filtered vs all recipes
- Toggle filter visibility
- Shows search results summary

### **Intelligent Filtering**

#### **Ingredient Extraction**
```typescript
// Example: "2 cups diced tomatoes (fresh)" → "Tomatoes"
const ingredients = RecipeFilterService.extractIngredients(recipes);
```

#### **Cuisine Detection**
```typescript
// Detects cuisine from multiple fields:
// - cuisine_type, difficulty_level, description
// - Recognizes keywords: italian, chinese, mexican, etc.
const cuisines = RecipeFilterService.extractCuisines(recipes);
```

#### **Smart Filtering**
```typescript
// Combines text search, ingredients, and cuisines
const filtered = RecipeFilterService.filterRecipes(
  allRecipes,
  searchTerm,
  selectedIngredients,
  selectedCuisines
);
```

## 🎯 **Usage Examples**

### **Find Italian Recipes with Tomatoes**
1. Tap "Show Filters"
2. Select "Tomatoes" from ingredients
3. Select "Italian" from cuisines
4. See filtered results instantly

### **Search for Quick Meals**
1. Type "quick" or "easy" in search box
2. Results show recipes with those terms
3. Combine with time-based filtering

### **Multi-Ingredient Cooking**
1. Select multiple ingredients: "Chicken", "Rice", "Onions"
2. Find recipes that use ALL selected ingredients
3. Perfect for using up specific ingredients

## 🛠 **Implementation Details**

### **Filter States**
- `allRecipes`: Complete recipe list from database
- `filteredRecipes`: Currently displayed recipes
- `showFilters`: Toggle filter UI visibility

### **Search Algorithm**
```typescript
// Text search in title, description, and directions
const matchesSearch = recipe.title.toLowerCase().includes(searchTerm) ||
                     recipe.description?.toLowerCase().includes(searchTerm);

// Ingredient matching (ALL selected ingredients must be present)
const matchesIngredients = selectedIngredients.every(ingredient => 
  recipe.ingredients.some(recipeIng => 
    recipeIng.toLowerCase().includes(ingredient.toLowerCase())
  )
);

// Cuisine matching (ANY selected cuisine matches)
const matchesCuisines = selectedCuisines.length === 0 || 
  selectedCuisines.some(cuisine => 
    recipe.cuisine_type?.toLowerCase().includes(cuisine.toLowerCase())
  );
```

### **Performance Optimizations**
- **Smart extraction**: Ingredients and cuisines extracted once when recipes load
- **Efficient filtering**: Uses JavaScript array methods for fast filtering
- **UI optimization**: Collapsible sections to reduce screen clutter
- **Debounced search**: Could be added for real-time search optimization

## 🎨 **UI/UX Features**

### **Visual Design**
- **Theme integration**: Uses app's color scheme throughout
- **Consistent spacing**: Follows design system spacing
- **Intuitive icons**: 🔍 Search, 🥕 Ingredients, 🌍 Cuisines
- **Interactive feedback**: Visual state changes for selections

### **User Experience**
- **Progressive disclosure**: Filters hidden by default
- **Clear feedback**: Shows active filters and result counts
- **Easy reset**: Clear all filters with one action
- **Responsive layout**: Works on different screen sizes

### **Accessibility**
- **Clear labels**: Descriptive text for all controls
- **Touch targets**: Adequate size for easy tapping
- **Visual hierarchy**: Clear information structure
- **Color contrast**: Accessible color combinations

## 🔮 **Future Enhancements**

### **Advanced Features**
- **Saved searches**: Store and recall common filter combinations
- **Recipe recommendations**: Suggest recipes based on available ingredients
- **Nutritional filtering**: Filter by calories, dietary restrictions
- **Preparation time**: Filter by cooking/prep time ranges
- **Difficulty level**: Filter by recipe complexity
- **Rating system**: Filter by user ratings

### **Smart Features**
- **Autocomplete**: Intelligent ingredient suggestions
- **Fuzzy search**: Find recipes even with typos
- **Seasonal suggestions**: Highlight seasonal ingredients
- **Shopping integration**: Connect with shopping lists
- **Voice search**: Voice-activated recipe finding

### **Data Enhancements**
- **Recipe tagging**: Manual tags for better categorization
- **Dietary labels**: Vegetarian, vegan, gluten-free, etc.
- **Allergen warnings**: Filter out recipes with allergens
- **Meal planning**: Integration with meal planning features

## 📊 **Analytics & Insights**

The filter service also provides useful statistics:

```typescript
const stats = RecipeFilterService.getFilterStats(recipes);
// Returns: {
//   totalRecipes: number,
//   totalIngredients: number,
//   totalCuisines: number,
//   averageIngredientsPerRecipe: number
// }
```

This comprehensive search and filter system transforms recipe discovery, making it easy to find exactly what you're looking for among your saved recipes! 🍽️✨
