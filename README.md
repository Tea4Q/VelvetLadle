# VelvetLadle 🍽️ - Personal Recipe Collection & Discovery Platform

VelvetLadle is a comprehensive React Native app built with Expo for managing your personal recipe collection. Save recipes from any website, create your own recipes manually, and build your favorite recipe collection with a modern, professional interface.

## ✨ **Recent Enhancements (August 2025)**

- **🚀 Performance Optimization**: Fixed critical render loops and "Maximum update depth exceeded" errors
- **🎯 Recipe Navigation**: Seamless "View Recipe" functionality after adding recipes
- **📱 Mobile Optimization**: Full cross-platform compatibility with native alerts
- **✏️ Enhanced Editing**: Complete recipe editing with spell check and validation
- **🚀 Streamlined UX**: One-step URL processing workflow
- **🎨 Professional UI**: Touch-responsive buttons and modern interactions

## 🚀 **Key Features**

### **Recipe Management**
- **🌐 Web Scraping**: Extract recipes from any website URL
- **✏️ Manual Entry**: Create recipes with ingredients, directions, and serving info
- **📝 Full Editing**: Edit existing recipes with pre-populated forms
- **⭐ Favorites**: Mark recipes as favorites for quick access
- **🔍 Search & Filter**: Find recipes by ingredients, cuisine, or keywords

### **Modern Interface**
- **🎨 Professional Design**: Card-based layout with consistent theme system
- **📱 Mobile-First**: Optimized touch targets and responsive design
- **🌈 Theme Support**: Integrated color scheme and typography
- **⚡ Fast Performance**: Smooth animations and efficient state management

### **Data Storage**
- **☁️ Supabase Integration**: Cloud storage for permanent recipe collection
- **💾 Demo Mode**: Local storage for testing and development
- **🔄 Dual Support**: Seamless switching between storage modes
- **🛡️ Data Safety**: Comprehensive validation and error handling

## 📖 **Documentation**

- **[Render Optimization Guide](RENDER_OPTIMIZATION_GUIDE.md)**: Performance improvements and render loop fixes
- **[Home Page Redesign](HOME_PAGE_REDESIGN.md)**: Complete authentication system and modern UI
- **[Recipe Management Enhancements](RECIPE_MANAGEMENT_ENHANCEMENTS.md)**: Latest feature improvements and technical details
- **[Favorites Guide](FAVORITES_GUIDE.md)**: Favorite recipes functionality
- **[Search & Filter Guide](SEARCH_AND_FILTER_GUIDE.md)**: Recipe discovery features
- **[Theme Guide](THEME_GUIDE.md)**: Design system and theming
- **[Testing Checklist](TESTING_CHECKLIST.md)**: Quality assurance guidelines
- **[Supabase Setup](SUPABASE_SETUP.md)**: Cloud database configuration

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

3. Optional: Set up Supabase for cloud storage (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))

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
├── ManualRecipeModal.tsx # Manual recipe creation/editing
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
5. **Manual entry**: Create recipes from scratch with ingredients and directions
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
