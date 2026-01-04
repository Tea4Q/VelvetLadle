# Future Features List

## Ingredient Substitutions Feature

### Overview
A comprehensive ingredient substitution system that helps users find alternatives for recipe ingredients they don't have or can't use due to dietary restrictions.

### Saved Implementation Details

#### Function Implementation
```typescript
const getIngredientSubstitutions = () => ({
	"butter": ["margarine", "coconut oil", "vegetable oil"],
	"eggs": ["flax eggs", "applesauce", "banana"],
	"milk": ["almond milk", "oat milk", "coconut milk"],
	"flour": ["almond flour", "coconut flour", "oat flour"],
	"sugar": ["honey", "maple syrup", "stevia"],
	"salt": ["herbs", "spices", "lemon juice"],
});
```

#### UI Components
- Tab in RecipeViewer: "🔄 Substitutions"
- Container showing ingredient substitution mappings
- Clean listing format with ingredient name and alternatives

#### Styling (to be restored)
```typescript
substitutionContainer: {
	backgroundColor: '#fff',
	borderRadius: 10,
	padding: 15,
	marginBottom: 20,
	borderWidth: 1,
	borderColor: '#00205B',
},
substitutionItem: {
	marginBottom: 15,
	padding: 12,
	backgroundColor: '#f8f9fa',
	borderRadius: 8,
},
substitutionTitle: {
	fontSize: 16,
	fontWeight: '600',
	color: '#00205B',
	marginBottom: 8,
},
substitutionOptions: {
	fontSize: 14,
	color: '#666',
	lineHeight: 20,
},
```

### Enhancement Ideas for Future Implementation

1. **Smart Ingredient Matching**: Analyze actual recipe ingredients and suggest relevant substitutions
2. **Dietary Filter Integration**: Show substitutions based on user's dietary restrictions (vegan, gluten-free, etc.)
3. **Measurement Conversion**: Include proper ratios for substitutions (e.g., "1 egg = 1/4 cup applesauce")
4. **User-Generated Substitutions**: Allow users to add their own successful substitutions
5. **Nutritional Impact**: Show how substitutions affect nutritional content
6. **Allergy Warnings**: Highlight potential allergens in suggested substitutions
7. **Success Ratings**: Community ratings for substitution effectiveness
8. **Recipe-Specific Context**: Tailored substitutions based on cooking method (baking vs. sautéing)

### Implementation Priority
- **Medium Priority**: Useful feature but not essential for core functionality
- **Dependencies**: Should implement after core recipe management features are stable
- **Estimated Effort**: 2-3 days for basic implementation, 1-2 weeks for enhanced features

### Notes
- Removed from RecipeViewer on August 3, 2025 to simplify interface
- Code preserved here for future restoration and enhancement
- Consider integrating with external ingredient databases for comprehensive coverage

---

## Other Future Features

### Recipe Import Enhancements
- Bulk recipe import from recipe management apps
- PDF recipe extraction
- Handwritten recipe OCR scanning

### Social Features
- Recipe sharing with friends/family
- Community recipe collections
- Recipe rating and review system

### Advanced Search
- Search by cooking time
- Search by available ingredients
- Seasonal recipe suggestions


### Meal Planning
- Weekly meal planning integration
- Shopping list generation
- Leftover tracking and suggestions

### Nutrition Tracking
- Detailed macro/micro nutrient analysis
- Daily nutrition summaries
- Dietary goal tracking

### Ingredient-Based Filtering
- Filter/search recipes by number of ingredients (e.g., "5-ingredient recipes")
- Quick filter for "minimal ingredient" meals

### Audio Recipe Entry
- Add recipes using voice dictation/audio input
- Integrate with device speech-to-text APIs
- Option to read recipes aloud for hands-free cooking

### Accessibility Improvements
- Enhanced screen reader support (labels, hints, focus order)
- High-contrast and large text modes
- Keyboard navigation and full tab support

### Multi-Language Support
- Localize app UI to multiple languages
- Community-driven recipe translations
- Auto-detect device language and switch

### Step-by-Step Images
- Allow users to add images for each stage of recipe preparation
- Display step images alongside directions in RecipeViewer
- Option to capture photos during manual entry or upload from gallery
- Improve clarity for complex recipes and visual learners

### Recipe-Specific Cooking Tips
- Provide customized cooking tips tailored to each specific recipe
- Tips dynamically adjusted based on recipe ingredients, methods, and cuisine
- Include technique explanations for complex steps (e.g., proper folding, searing)
- Suggest equipment alternatives if specialized tools mentioned
- Highlight critical success factors unique to the recipe
- Offer timing and doneness indicators for perfect results
- Flag common pitfalls and mistakes specific to the dish
- Provide altitude adjustments and regional variations where applicable

### Supabase Storage Integration
- Store recipe images and files in Supabase Storage buckets for secure, scalable cloud access
- Reference image URLs in the database for efficient retrieval
- Enable multi-device and cross-platform image access
- Support for image uploads, deletions, and access control
- Optional fallback to local storage for offline use
