# Future Features List

## ✅ Completed Features (moved from future)

### In-App Purchases / Premium Subscriptions _(March 2026)_

- `react-native-purchases` (RevenueCat SDK) installed
- `services/purchaseService.ts` created — wraps configure, login/logout, entitlement check, purchase, and restore
- `AuthContext` wired to call `PurchaseService.loginUser` / `logoutUser` on every auth state change
- Upgrade screen rebuilt with live pricing cards, purchase flow, and Restore Purchases button
- Free-tier recipe limit check in `add.tsx` now uses RevenueCat as source-of-truth
- Required legal disclosures (auto-renewal text) added to upgrade screen
- Upgrade screen loop bug fixed; redundant "Create Free Account" button removed
- **Remaining work**: Configure RevenueCat dashboard, create products in App Store Connect / Google Play Console, add API keys to `.env.local`, run `expo prebuild`

---

## Ingredient Substitutions Feature

### Overview

A comprehensive ingredient substitution system that helps users find alternatives for recipe ingredients they don't have or can't use due to dietary restrictions.

### Saved Implementation Details

#### Function Implementation

```typescript
const getIngredientSubstitutions = () => ({
  butter: ["margarine", "coconut oil", "vegetable oil"],
  eggs: ["flax eggs", "applesauce", "banana"],
  milk: ["almond milk", "oat milk", "coconut milk"],
  flour: ["almond flour", "coconut flour", "oat flour"],
  sugar: ["honey", "maple syrup", "stevia"],
  salt: ["herbs", "spices", "lemon juice"],
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

## Near-Term Features (3–12 months)

### 📷 Scan Recipe — OCR Activation _(Next priority)_

- Enable OCR image scanning to extract recipe text from photos (cookbooks, handwritten cards, screenshots)
- Use device camera or photo library as input source
- Parse extracted text through the existing recipe extraction pipeline to auto-populate fields
- Provide a correction UI for low-confidence OCR fields before saving
- Android: `react-native-text-recognition` or Google ML Kit; iOS: Vision framework
- The card is already present in the Add screen and marked "Upcoming Feature" — re-enable once backend is complete

### 🃏 Recipe Card Carousel with Flip Animation

- Replace or supplement the flat recipe list with a swipeable card deck / carousel view
- Cards display recipe photo, title, cuisine, and cook time on the **front face**
- **Flip interaction**: tap or swipe up on a card to flip it over — the back face shows a quick-glance summary (servings, key ingredients list, difficulty)
- Smooth 3D card-flip animation using `react-native-reanimated` with perspective transform (`rotateY`)
- Swipe left/right to skip to the next/previous card; swipe up to open full recipe
- Carousel mode accessible as a toggle in the Recipes tab (list ↔ cards)
- Cards respect all active search/filter criteria

### 🗓️ Meal Planning Calendar

- Interactive weekly/monthly calendar where users drag recipes onto specific days and meals (breakfast, lunch, dinner, snacks)
- Visual overview of the week's planned meals with recipe thumbnails
- Tap any day cell to add, swap, or remove a planned meal
- Nutritional summary per day and per week pulled from existing recipe nutrition data
- Repeat week templates for households with consistent eating patterns
- Reminders/notifications for meal prep the day before
- Deep link from calendar to the full recipe view

### 🛒 Shopping List Generation

- Auto-generate a shopping list from any planned meals on the calendar or manually selected recipes
- Smart ingredient aggregation: combine identical ingredients across recipes (e.g., 3 recipes with garlic → "6 cloves garlic")
- Organised by grocery store category (produce, dairy, pantry, meat, etc.)
- Check-off items as you shop with a clean, touch-friendly list UI
- Carry-over: items already in your pantry can be marked as "have it" to exclude from the list
- Share or export the list as plain text (copy, WhatsApp, Notes, etc.)

### 🥗 Diet & Lifestyle Tagging

- Tagging system for popular diet plans and lifestyle eating patterns:
  - Weight Watchers (WW) — display WW SmartPoints per serving
  - Keto / Low-Carb
  - Paleo
  - Vegan / Vegetarian / Plant-Based
  - Gluten-Free / Dairy-Free
  - Mediterranean
  - Whole30 / Clean Eating
  - Low-FODMAP
  - Diabetic-Friendly
- Tags set manually or auto-suggested based on ingredients and nutrition data
- Filter recipes by one or more diet tags in the search/filter panel
- Profile-level dietary preferences: set your default tags once and have the app surface matching recipes throughout
- Substitution suggestions tied to active diet (e.g., suggest cauliflower rice for keto users)

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
- Calendar view for meal planning
- Automatic grocery list generation from selected recipes
- Meal prep scheduling and reminders
- Nutritional balance tracking across planned meals

### Web Newsletter Integration

- Subscribe to curated recipe newsletters and cooking publications
- Filter newsletter content by ingredients and dietary preferences
- Smart recipe discovery from newsletter sources
- Meal inspiration based on seasonal ingredients
- Weekly/monthly recipe collections delivered via email
- Integration with popular food blogs and cooking websites
- Personalized newsletter recommendations based on user preferences
- Extract and save recipes directly from newsletter content

### Advanced Meal Planning Features

- **Smart Meal Scheduling**: AI-powered meal suggestions based on prep time, ingredients, and dietary goals
- **Batch Cooking Optimizer**: Identify recipes that can share ingredients or preparation steps
- **Leftover Integration**: Suggest recipes that use ingredients from previous meals
- **Budget-Conscious Planning**: Meal planning with cost optimization and ingredient reuse
- **Family Meal Coordination**: Plan meals considering different family member preferences and restrictions
- **Seasonal Meal Planning**: Adjust meal suggestions based on seasonal ingredient availability
- **Prep Time Optimization**: Schedule meals based on available cooking time throughout the week

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

---

## Long-Term Vision (1–2 Years)

### ❤️ Health App & Wearable Device Integration

**Goal**: Close the loop between cooking and caloric/nutritional goal tracking.

#### Platform Integrations

- **Apple Health (HealthKit)**: Log meals and macro/micronutrients directly from a recipe serving directly to the iOS Health app
- **Google Fit / Health Connect**: Android equivalent — push calorie and nutrient data per meal
- **Fitbit, Garmin, Whoop, Apple Watch**: Sync caloric intake data so devices can accurately compute net calorie balance against activity rings/goals

#### Caloric Intake Flow

1. User taps "Log This Meal" on any recipe — selects serving size
2. App calculates calories, protein, carbs, fat (from existing nutrition fields or Spoonacular data)
3. Data is pushed to connected health platform via their native API/SDK
4. Health platform reconciles calories consumed with calories burned from activity tracking

#### Privacy & Permissions

- All health data sharing is opt-in with explicit permission prompts at first use
- No health data is stored on VelvetLadle servers — data flows device-to-device only
- Users can disconnect integrations and revoke permissions at any time from the Account screen

#### Additional Features

- Daily calorie budget display inside the app pulled back from HealthKit/Google Fit goals
- Streak and achievement badges for logging meals consistently
- "Nutrition Coach" mode: suggest low-calorie swaps when daily budget is close to the limit
- Integration with CGM (Continuous Glucose Monitor) platforms (e.g., Levels, Dexcom) to surface recipes that fit glucose-stable eating patterns

---

_Last updated: March 2026. See [CHANGELOG.md](CHANGELOG.md) for completed items._
