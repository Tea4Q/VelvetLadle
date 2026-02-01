# VelvetLadle Changelog 📋

## [1.0.1] - January 2026 - Authentication & Database Fixes

### 🔐 **Authentication System Overhaul**

#### **Supabase Auth Integration**
- **Fixed signIn method**: Now properly integrates with Supabase authentication instead of using mock local storage
- **Email confirmation**: Added user-friendly error messages for unconfirmed email addresses
- **Guest mode improvements**: Removed unnecessary "Continue as Guest" button - users have guest access by default
- **Session persistence**: Fixed authentication session not persisting between app restarts

### 🗄️ **Database & Schema Improvements**

#### **Row Level Security (RLS)**
- **Guest access fixed**: Updated RLS policies to allow anonymous users to read demo recipes
- **User isolation**: Authenticated users now see only their own recipes
- **Demo recipes**: Recipes with `user_id = NULL` are visible to all guests

#### **Schema Cleanup**
- **Removed duplicate columns**: Eliminated redundant `source_website` column (web_address already stores full URL)
- **Time format standardization**: Completed migration from ISO 8601 text fields to numeric minute fields
- **User ID support**: All recipes now support proper user ownership tracking

### 🎨 **UI/UX Enhancements**

#### **Account Management**
- **Simplified mode toggle**: Cleaned up Supabase/Demo storage mode switcher design
- **Accurate feature descriptions**: Fixed misleading "unlimited recipes" messaging for free accounts
- **Consistent branding**: Free accounts now accurately show 10-recipe limit with cloud sync benefits

### 🐛 **Bug Fixes**
- **Recipe saving**: Fixed "0 rows returned" error when adding recipes
- **Authentication state**: Resolved issue where users appeared logged in but couldn't save recipes
- **Demo recipe visibility**: Fixed guests not seeing demo recipes in database

### 🔧 **Developer Tools**
- **Test account creation**: Added script to create guest/free/paid test accounts
- **Database inspection**: New scripts for checking recipe ownership and database contents
- **Recipe ownership management**: Tools for moving recipes between users or setting as demo

## [1.2.1] - August 2025 - Performance & Stability Update

### 🚀 **Critical Bug Fixes**

#### **Infinite Render Loop Resolution**
- **Fixed "Maximum update depth exceeded" errors**: Resolved critical React render loops affecting Quick Categories and Recipe List components
- **Stabilized Component Architecture**: Implemented proper `useCallback` and `useMemo` patterns for all handlers and expensive calculations
- **Demo Data Optimization**: Demo data now initializes only once on app startup instead of on every render
- **Search Filter Stability**: Fixed RecipeSearchFilter useEffect dependencies that were causing infinite re-renders

#### **Performance Optimizations**
- **Loading Guards**: Added useRef-based guards to prevent simultaneous data loading operations
- **Dependency Chain Optimization**: Eliminated circular dependencies in useCallback/useEffect chains
- **Memory Efficiency**: Reduced unnecessary re-renders by stabilizing function references
- **State Management**: Improved state update patterns to prevent cascading re-renders

### 🛠 **Technical Improvements**

#### **Component Stability**
- **RecipeList Component**: Fixed infinite loops in loadRecipes, handleSearch, handleRefresh, and handleDelete functions
- **RecipeSearchFilter Component**: Removed unstable dependencies from useEffect that were triggering continuous re-renders
- **Home Dashboard**: Separated demo data initialization from display data loading to prevent render conflicts
- **Navigation Integration**: Stabilized Quick Categories navigation parameters using useMemo

#### **Code Quality Enhancements**
- **useCallback Implementation**: All event handlers now use proper useCallback with stable dependencies
- **useMemo Optimization**: Expensive calculations like ingredient/cuisine extraction are now memoized
- **Ref-based Guards**: Implemented loading state guards using useRef to prevent race conditions
- **Inline Logic**: Eliminated problematic function dependencies by inlining critical logic

### 📱 **User Experience**
- **Smooth Navigation**: Quick Categories buttons now work without render errors
- **Responsive UI**: Recipe list scrolling and filtering now perform smoothly
- **Stable Search**: Search and filter operations no longer cause app freezes
- **Reliable Interactions**: All touch interactions are now stable and predictable

---

## [1.2.0] - August 2025

### ✨ **Major Features Added**

#### **Recipe Navigation & Viewing**
- **"View Recipe" Buttons**: Added to all recipe creation/processing success alerts
- **Seamless Navigation**: Direct navigation from creation to recipe viewing
- **Context-Aware**: Different navigation behavior in Add vs Recipes screens

#### **Cross-Platform Compatibility**
- **Mobile Alert System**: Replaced all `window.confirm/alert` with React Native `Alert.alert`
- **Universal Experience**: Consistent alert behavior across web and mobile
- **Error Resolution**: Fixed "window.confirm is not a function" runtime errors

### 🎨 **UX/UI Enhancements**

#### **Enhanced Recipe Editing**
- **Form Pre-population**: Edit forms automatically fill with existing recipe data
- **Spell Check Integration**: Enabled for title, ingredients, and directions
- **Dual-Mode Component**: Single modal handles both creation and editing
- **Improved Validation**: Better error messages and user feedback

#### **Mobile Optimizations**
- **Touch-Responsive Buttons**: Enhanced hit targets with hitSlop and press states
- **Visual Feedback**: Proper ripple effects and press animations
- **Modal Improvements**: Better sizing and keyboard handling
- **Accessibility**: Improved touch targets for mobile devices

#### **Streamlined Workflows**
- **One-Step URL Processing**: Reduced from 3-step to 1-step workflow
- **Direct Action Buttons**: Immediate access to processing options
- **Reduced Friction**: Faster recipe addition process

### 🛠 **Technical Improvements**

#### **Component Architecture**
- **Enhanced Props**: Added optional `onRecipeSelect` callbacks to modals
- **Backward Compatibility**: All changes maintain existing functionality
- **Type Safety**: Full TypeScript integration with proper type checking

#### **Navigation Integration**
- **Expo Router**: Integrated with expo-router for tab navigation
- **State Management**: Proper state cleanup and navigation handling
- **Memory Efficiency**: Optimized modal rendering and state updates

#### **Error Handling**
- **Comprehensive Validation**: Better URL and form validation
- **User-Friendly Messages**: Clear, actionable error messages
- **Graceful Degradation**: Proper fallbacks for all error scenarios

### 📱 **Platform Support**
- **Mobile-First**: Optimized for mobile touch interactions
- **Cross-Platform**: Consistent experience on iOS, Android, and web
- **Native Alerts**: Platform-appropriate alert styling and behavior

### 🔧 **Code Quality**
- **Clean Implementation**: Modular, reusable component architecture
- **Documentation**: Comprehensive inline and external documentation
- **Testing Ready**: Enhanced testing guidelines and checklists

---

## [1.1.0] - Previous Release

### **Core Features**
- Recipe management system
- Web scraping functionality
- Favorites system
- Search and filtering
- Theme system integration
- Authentication framework

---

## [1.0.0] - Initial Release

### **Foundation**
- Basic recipe collection
- Manual recipe entry
- Supabase integration
- Expo/React Native framework
- File-based routing

---

## 📋 **Development Notes**

### **Breaking Changes**: None - All updates maintain backward compatibility

### **Migration**: No migration needed - Updates are seamless

### **Dependencies**: No new major dependencies added

### **Performance**: Improved modal rendering and navigation efficiency

---

## 🎯 **Next Release Priorities**

Based on the current foundation, the next release will focus on:

1. **Recipe Linking**: Connect related recipes (main dish to sauce/sides)
2. **Image Upload**: Manual recipe image attachment
3. **Nutritional Information**: Enhanced nutritional data entry and display
4. **Shopping List Integration**: Ingredient-to-shopping-list functionality
5. **Meal Planning**: Weekly/monthly meal planning interface

---

*For detailed technical documentation, see [RECIPE_MANAGEMENT_ENHANCEMENTS.md](RECIPE_MANAGEMENT_ENHANCEMENTS.md)*
