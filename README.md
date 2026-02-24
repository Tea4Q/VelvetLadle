# VelvetLadle 🍽️ - Personal Recipe Collection & Discovery Platform

VelvetLadle is a comprehensive React Native app built with Expo for managing your personal recipe collection. Save recipes from any website, create your own recipes manually, and build your favorite recipe collection with a modern, professional interface.


## 🥗 Nutritional Information & Servings Handling

### How Nutritional Info is Added

- When you add a recipe from a website, VelvetLadle attempts to extract nutritional information (calories, protein, carbs, fat, fiber, sugar, sodium) from the site or via the Spoonacular API.
- The extracted nutrition is mapped to the `nutritional_info` field in the database and displayed per serving in the app.
- If no nutrition is found, default values are shown in the UI.

**Manual Entry:**
- You can add or edit nutritional info when creating or editing a recipe manually.

**Troubleshooting:**
- If nutrition is missing, check that the source site or API provides it. Some sites or proxies may block nutrition extraction due to CORS or API limits.
- For best results, use well-known recipe sites or add nutrition manually.

### Servings Bug Fix

- Previous versions sometimes failed to divide nutrition by servings, or did not save the correct servings count.
- This is now fixed: nutrition is always shown per serving, and the servings field is saved and editable for all recipes.

**If you notice incorrect nutrition or servings:**
- Edit the recipe and update the servings or nutrition fields as needed.
- For imported recipes, verify the nutrition matches the source and adjust if necessary.

---
## ✨ **Latest Updates (February 2026 - Google Play Store Ready)**

- **🔐 Authentication Fixes**: Resolved navigation issues and added proper authentication state management
- **📱 Improved Navigation**: Fixed "Back to Dashboard" and "Recents" card navigation issues  
- **⏰ Recent Recipes**: Properly displays recipes from the last 7 days with correct timing logic
- **📜 Scrollable Filters**: Enhanced mobile UX with fully scrollable recipe filter interface
- **👤 User Data Privacy**: Fixed data isolation - users now see only their own recipes in all views
- **🍽️ Clean Cuisine Filters**: Removed non-cuisine contamination from filter options
- **🚀 Performance**: Eliminated render loops, optimized callbacks, improved list scrolling
- **🎯 Production Ready**: Comprehensive testing and optimization for Google Play Store release

## 🚀 **Previous Enhancements (August 2025)**

- **🚀 Performance Optimization**: Fixed critical render loops and "Maximum update depth exceeded" errors
- **🎯 Recipe Navigation**: Seamless "View Recipe" functionality after adding recipes
- **📱 Mobile Optimization**: Full cross-platform compatibility with native alerts
- **✏️ Enhanced Editing**: Complete recipe editing with spell check and validation
- **🚀 Streamlined UX**: One-step URL processing workflow
- **🎨 Professional UI**: Touch-responsive buttons and modern interactions

## 🚀 **Key Features**


### **Recipe Management**
- **🌐 Web Scraping**: Extract recipes from any website URL
- **✏️ Unified Add/Edit Form**: Manual entry and editing are now handled by a single, unified RecipeForm with a tabbed interface (Basics, Details, Nutrition, Notes).
- **📝 Personal Notes**: Add and edit personal notes for each recipe, accessible in both the form and the viewer.
- **Full Editing**: Edit existing recipes with all fields pre-populated from the database.
- **⭐ Favorites**: Mark recipes as favorites for quick access
- **🔍 Search & Filter**: Find recipes by ingredients, cuisine, or keywords

### **Modern Interface**
- **🎨 Professional Design**: Card-based layout with consistent theme system
- **📱 Mobile-First**: Optimized touch targets and responsive design
- **🌈 Theme Support**: Integrated color scheme and typography
- **⚡ Fast Performance**: Smooth animations and efficient state management

### **Data Storage**
- **☁️ Supabase Integration**: Cloud storage for unlimited recipes
- **💾 Guest Mode**: Try the app with up to 10 recipes (no signup required)
- **🔄 Dual Support**: Seamless switching between storage modes
- **🛡️ Data Safety**: Comprehensive validation and error handling

## 📖 **Documentation**

**Complete Feature Overview:**
- **[📋 Complete Features Guide](docs/FEATURES.md)**: Comprehensive feature documentation for users, testers, and investors

**User Guides:**
- **[Recipe Management](docs/RECIPE_MANAGEMENT_ENHANCEMENTS.md)**: Add, edit, and organize recipes
- **[Favorites System](docs/FAVORITES_GUIDE.md)**: Quick access to your best recipes
- **[Search & Filter](docs/SEARCH_AND_FILTER_GUIDE.md)**: Find recipes fast
- **[Quick Categories](docs/QUICK_CATEGORIES_GUIDE.md)**: Meal type filtering

**Setup & Configuration:**
- **[Supabase Setup](docs/SUPABASE_SETUP.md)**: Cloud database configuration
- **[Web Scraping APIs](docs/WEB_SCRAPING_APIS.md)**: External service setup
- **[Local Image Storage](docs/LOCAL_IMAGE_STORAGE.md)**: Image caching

**Development:**
- **[Build Process](docs/BUILD_PROCESS.md)**: Build and release workflow
- **[Testing Checklist](docs/TESTING_CHECKLIST.md)**: QA procedures
- **[Render Optimization](docs/RENDER_OPTIMIZATION_GUIDE.md)**: Performance patterns
- **[Theme Guide](docs/THEME_GUIDE.md)**: Design system

**Technical:**
- **[EAS Build Guide](docs/EAS_BUILD_GUIDE.md)**: Expo Application Services builds
- **[Changelog](docs/CHANGELOG.md)**: Version history

## 🛠 **Technology Stack**

- **React Native** with Expo for cross-platform mobile development
- **TypeScript** for type safety and better development experience
- **Expo Router** for file-based navigation
- **Supabase** for cloud database and storage
- **AsyncStorage** for local data persistence
- **Context API** for state management and theming

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Optional: Set up Supabase for cloud storage (see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md))

## 📋 **Features**

For a complete overview of all features, see **[docs/FEATURES.md](docs/FEATURES.md)**

**Highlights:**
- 🌐 Smart recipe import from any website
- ✏️ Manual recipe entry with full editing
- ⭐ Favorites system for quick access
- 🔍 Advanced search and filtering
- 📊 Automatic nutrition tracking
- 💾 Dual storage (cloud + local demo)
- 🎨 Modern, touch-optimized UI
- ⚡ Performance optimized

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)  
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## 🏗️ **Project Structure**

```
app/                    # Main application screens
├── (auth)/            # Authentication screens
├── (tabs)/            # Tab-based navigation screens
│   ├── index.tsx      # Home dashboard
│   ├── add.tsx        # Add recipes
│   ├── recipes.tsx    # Recipe list and viewing
│   └── favorites.tsx  # Favorite recipes
components/            # Reusable UI components
├── RecipeList.tsx     # Recipe browsing and management
├── RecipeViewer.tsx   # Recipe detail viewing
├── RecipeForm.tsx     # Unified add/edit form with tabs and notes
├── UrlActionModal.tsx # URL processing interface
└── button.tsx         # Enhanced button component
services/              # Business logic and API services
├── recipeDatabase.ts  # Database operations
├── recipeExtractor.ts # Web scraping logic
├── FavoritesService.ts # Favorites management
└── AuthService.ts     # Authentication logic
contexts/              # React contexts for global state
├── AuthContext.tsx    # Authentication state
└── ThemeContext.tsx   # Design system and theming
```

## 🎯 **Getting Started Guide**

1. **Launch the app** - Opens to welcome screen for new users
2. **Sign in or continue as guest** - Choose your authentication method
3. **Add your first recipe** - Use the "Add Recipe" button on the home screen
4. **From website**: Enter any recipe URL and let the app extract the content
5. **Manual or Edit entry**: Use the unified RecipeForm to create or edit recipes, including all fields and personal notes
## 📝 **Personal Notes Feature**

- Every recipe supports a personal notes section for your own modifications, reviews, or tips.
- Notes are available in both the RecipeForm (add/edit) and RecipeViewer (view mode) under a dedicated Notes tab.
- Notes are saved to the database and can be updated at any time.
6. **Browse and organize** - View your recipe collection, mark favorites, and search

## 🚀 **Development**

### **Running Tests**
```bash
npx expo doctor  # Check for project issues
npx tsc --noEmit # TypeScript compilation check
```

### **Building for Production**
See [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) for deployment instructions.

## 🤝 **Contributing**

VelvetLadle is a personal project, but suggestions and feedback are welcome! Please check the documentation files for technical details and implementation guidelines.

## 📄 **License**

This project is for personal and educational use.

---

**VelvetLadle** - Making recipe collection simple, beautiful, and powerful! 🍽️✨
