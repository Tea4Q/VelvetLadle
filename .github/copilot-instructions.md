# VelvetLadle AI Agent Instructions

## Project Overview
VelvetLadle is a React Native/Expo recipe management app with dual storage modes (Supabase cloud or local demo storage), web scraping capabilities, and a modern UI. The app supports URL-based recipe extraction, manual recipe entry, favorites, and advanced search/filtering.

## Architecture & Key Patterns

### Dual Storage System
**Critical**: All data operations must support both Supabase and local demo mode via the `isSupabaseConfigured` check:
```typescript
if (isSupabaseConfigured && supabase) {
  // Supabase operations
} else {
  // DemoStorage fallback
}
```
- Service pattern: `services/recipeDatabase.ts` wraps all CRUD operations
- Demo mode uses in-memory storage (`services/demoStorage.ts`)
- Favorites use hybrid approach: database + `AsyncStorage` (`services/FavoritesService.ts`)

### Component Structure & Navigation
- **Expo Router** file-based navigation: `app/_layout.tsx` → `app/(tabs)/` for main screens
- **Context Providers** wrap entire app: `ThemeProvider` → `AuthProvider` → `Stack`
- Splash screen shows first, then auth/main content after animation
- Tab screens: `index.tsx` (home), `add.tsx` (recipe entry), `recipes.tsx`, `favorites.tsx`

### Recipe Extraction Pipeline
Multi-strategy extraction in `services/recipeExtractor.ts`:
1. **Primary**: API-based extraction via `WebScrapingAPIService` (45s timeout)
2. **Fallback**: CORS proxy + HTML parsing for JSON-LD structured data
3. **Last resort**: Manual HTML parsing for recipe elements
4. **Nutrition**: Spoonacular API integration if not extracted (`services/nutritionService.ts`)

Always handle extraction failures gracefully and provide manual entry options.

### External Service Configuration

#### Supabase (Database)
- **Purpose**: Cloud storage for recipes, favorites, user data
- **Fallback**: `demoStorage.ts` for local-only mode
- **Setup**: Create project at [supabase.com](https://supabase.com), then add to `.env.local`:
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- **Schema**: Run `database_schema.sql` in Supabase SQL editor
- **Configuration**: `lib/supabase.ts` reads env vars with graceful fallback

#### Spoonacular API (Nutrition & Recipe Extraction)
- **Purpose**: AI-powered recipe parsing, nutrition analysis, ingredient recognition
- **Free Tier**: 150 requests/day
- **Setup**: Get API key from [spoonacular.com/food-api](https://spoonacular.com/food-api)
- **Configuration Options**:
  1. **Environment variable** (recommended): Add to `.env.local`:
     ```env
     EXPO_PUBLIC_SPOONACULAR_KEY=your-api-key
     ```
     Used in: `services/webScrapingAPIService.ts`
  2. **Hardcoded** (dev only): Directly in `services/nutritionService.ts` (line 6)
- **Usage**: Automatically used by `RecipeExtractor` and `fetchNutrition()`

#### ScrapingBee API (JavaScript Rendering)
- **Purpose**: Bypass CORS, handle JavaScript-heavy sites, anti-bot measures
- **Free Tier**: 1,000 requests/month
- **Setup**: Get API key from [scrapingbee.com](https://www.scrapingbee.com)
- **Configuration**: Add to `.env.local`:
  ```env
  EXPO_PUBLIC_SCRAPINGBEE_KEY=your-api-key
  ```
- **Usage**: Primary extraction method in `WebScrapingAPIService.extractWithScrapingBee()`
- **Fallback**: CORS proxy if not configured

#### RevenueCat (In-App Purchases)
- **Purpose**: Native iOS App Store and Google Play in-app subscription purchases
- **SDK**: `react-native-purchases` — do NOT add it as an Expo config plugin; it uses auto-linking
- **Service**: `services/purchaseService.ts` (singleton `PurchaseService`) wraps all RevenueCat calls
  - `configure(userId?)` — call once on app mount (done in `AuthContext`)
  - `loginUser(id)` / `logoutUser()` — call on every sign-in / sign-out
  - `isPremium()` — source-of-truth for premium entitlement; always check this before `subscription_tier`
  - `getOffering()` — fetch current pricing from RevenueCat dashboard
  - `purchasePackage(pkg)` / `restorePurchases()` — handle transactions
- **Entitlement ID**: must be exactly `premium` in the RevenueCat dashboard
- **Setup**: Create project at [app.revenuecat.com](https://app.revenuecat.com), add products in App Store Connect / Google Play Console, then add to `.env.local`:
  ```env
  EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx
  ```
- **Graceful degradation**: When keys are absent the service silently no-ops; upgrade screen shows "Coming Soon" box
- **AuthContext integration**: `PurchaseService.configure()` runs on mount; `loginUser`/`logoutUser` fire on every auth state change so customer records always match the Supabase user

#### API Priority & Graceful Degradation
The app works without ANY external services:
1. Recipe extraction tries: Spoonacular → ScrapingBee → CORS Proxy → Manual Entry
2. Storage tries: Supabase → Demo Mode (in-memory)
3. Premium entitlement tries: RevenueCat → `subscription_tier` metadata fallback
4. All services check for API key availability before attempting requests
5. Missing APIs log warnings but never crash the app

### State Management & Render Optimization
**Critical performance pattern** - always use stable callbacks to prevent render loops:
```typescript
const handleAction = useCallback((params) => {
  // implementation
}, [dependencies]); // Only include necessary deps
```

Common issues fixed in v1.2.1:
- Use `useRef` for values that shouldn't trigger re-renders (e.g., `isLoadingRef`, `initialCategoryFilter`)
- Inline critical logic to break circular dependencies
- Never create functions inside render without `useCallback`
- See `RENDER_OPTIMIZATION_GUIDE.md` for detailed patterns

### Theme System
Centralized theme in `constants/theme.ts` consumed via context hooks:
```typescript
import { useColors, useSpacing, useTypography } from '../contexts/ThemeContext';
```
- Primary: Deep Navy (`#00205B`)
- Secondary: Warm Cream (`#faf4eb`)
- Consistent `StyleSheet` objects at component bottom
- Use theme values, never hardcoded colors/spacing

## Development Workflows

### Environment Setup
Create `.env.local` in project root (gitignored) for local development:
```env
# Database (optional - app works without)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Recipe APIs (optional - graceful fallbacks exist)
EXPO_PUBLIC_SPOONACULAR_KEY=your-spoonacular-key
EXPO_PUBLIC_SCRAPINGBEE_KEY=your-scrapingbee-key

# In-app purchases (optional - upgrade screen shows "Coming Soon" without these)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx
```

All services work with demo/fallback modes if credentials missing.
After adding RevenueCat keys, run `npx expo prebuild --clean` to regenerate native code.

### Running the App
```bash
npx expo start              # Development server
npm run android/ios/web     # Platform-specific
npm run build:preview       # Internal testing APK
npm run build:production    # App store bundle
```

### Build Process
1. **Pre-build**: `npm run prebuild` removes console.logs automatically
2. **EAS Build**: Uses profiles from `eas.json` (preview/production)
3. **Version bumping**: `npm run version:patch|minor|major`
4. **Testing**: Manual QA via `TESTING_CHECKLIST.md` before builds

### Key Scripts
- `npm run check-deps`: Verify dependency compatibility
- `npm run docs:auto`: Auto-generate documentation
- `npm run setup-images`: Configure local image storage
- `npm run cleanup-logs`: Production-ready cleanup

## Component Patterns

### Recipe Forms
`components/RecipeForm.tsx` is the unified add/edit interface:
- Tabbed layout: Basics → Details → Nutrition → Notes
- Pre-populated when `initialRecipe` prop provided
- Validates required fields (title, ingredients, directions)
- Splits newline-separated strings to arrays on save

### Recipe Viewing
- `RecipeViewer.tsx`: Full recipe display with edit/delete actions
- `SmartImage.tsx`: Handles image loading with fallbacks and caching
- `ImageStorageService.ts`: Local image caching for offline support

### Lists & Search
- `RecipeList.tsx`: Main recipe display with search, filter, quick categories
- `RecipeSearchFilter.tsx`: Advanced filtering by ingredients, cuisine, time
- `FavoritesList.tsx`: Separate favorites view
- All lists use `FlatList` with `keyExtractor={(item) => item.id.toString()}`

## Service Layer Integration

### Recipe Operations
```typescript
import { RecipeDatabase } from '../services/recipeDatabase';
const result = await RecipeDatabase.saveRecipe(recipe);
// Always returns { success, data?, error? }
```

### Favorites
```typescript
import { FavoritesService } from '../services/FavoritesService';
await FavoritesService.addRecipeToFavorites(recipe);
await FavoritesService.removeRecipeFromFavorites(recipeId);
```

### Web Scraping
```typescript
import { RecipeExtractor } from '../services/recipeExtractor';
const { recipe, error } = await RecipeExtractor.extractRecipeFromUrl(url);
// Returns one of { recipe } or { error }, never both
```

## Common Tasks

### Adding New Fields to Recipe
1. Update `Recipe` type in `lib/supabase.ts`
2. Update database schema in `database_schema.sql`
3. Update `RecipeForm.tsx` inputs and state
4. Update `RecipeViewer.tsx` display
5. Update `RecipeDatabase.saveRecipe()` and `updateRecipe()`

### Creating New Screens
1. Add file to `app/(tabs)/` for tab screen or `app/` for modal
2. Register in `app/(tabs)/_layout.tsx` if tab
3. Use `useRouter()` from `expo-router` for navigation
4. Wrap with `ThemeProvider`-aware styling

### Handling Errors
- Use native `Alert.alert()` for user-facing errors
- Log errors with descriptive context: `console.error('Context:', error)`
- Return structured error objects: `{ success: false, error: 'message' }`
- Never throw in service layer; always return error objects

## Testing & Quality

### Pre-Release Checklist
1. Test both Supabase and demo storage modes
2. Verify recipe extraction from 3+ different websites
3. Test add/edit/delete/favorite workflows
4. Check search/filter with various inputs
5. Validate nutrition display and per-serving calculations
6. Run `npm run prebuild` to remove logs

### Known Issues
- "Total Time" display shows as "Total window with min." in `RecipeViewer.tsx` (cosmetic)
- Some recipe sites block CORS/API extraction; always provide manual fallback

## Key Documentation
- `docs/FEATURES.md`: Complete feature documentation for marketing/investors
- `docs/RENDER_OPTIMIZATION_GUIDE.md`: Performance patterns and solved issues
- `docs/RECIPE_MANAGEMENT_ENHANCEMENTS.md`: Latest feature details
- `docs/BUILD_PROCESS.md`: EAS build workflows
- `docs/SUPABASE_SETUP.md`: Database configuration
- `docs/TESTING_CHECKLIST.md`: QA procedures
