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
