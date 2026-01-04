# VelvetLadle Theme System Guide

## 🎨 **Theme System Overview**

Your VelvetLadle app now has a comprehensive theme system with:
- **Centralized colors** - All colors in one place for consistency
- **Typography scales** - Font sizes, weights, and families
- **Spacing system** - Consistent padding/margin values
- **Elevation/shadows** - Predefined shadow styles
- **Border radius** - Consistent corner rounding

## 📁 **Files Created**

1. **`constants/theme.ts`** - Main theme configuration
2. **`contexts/ThemeContext.tsx`** - React context for theme access
3. **Updated components** - Button, RecipeList now use theme

## 🎯 **Color Palette**

### Primary Colors
- **Primary**: `#00205B` (Deep Navy Blue) - Main brand color
- **Secondary**: `#faf4eb` (Warm Cream) - Background color
- **Accent**: `#C8A882` (Warm Gold/Bronze) - Highlight color

### Status Colors
- **Success**: `#4CAF50` (Green)
- **Warning**: `#FF9800` (Orange)
- **Error**: `#F44336` (Red)
- **Info**: `#2196F3` (Blue)

## 🛠️ **How to Use Theme in Components**

### Basic Usage
```typescript
import { useColors, useSpacing, useTypography } from '../contexts/ThemeContext';

export default function MyComponent() {
  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();

  return (
    <View style={{
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: radius.md,
    }}>
      <Text style={{
        color: colors.textPrimary,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
      }}>
        Hello Theme!
      </Text>
    </View>
  );
}
```

### Button Variants
```typescript
// Primary button (default)
<Button label="Save Recipe" theme="primary" />

// Secondary button
<Button label="Cancel" theme="secondary" />

// Outline button
<Button label="Edit" theme="outline" />

// Danger button
<Button label="Delete" theme="danger" />

// Different sizes
<Button label="Small" size="sm" />
<Button label="Medium" size="md" />
<Button label="Large" size="lg" />

// With icon
<Button label="Save" icon="check" theme="primary" />
```

### Using Elevation (Shadows)
```typescript
import { useElevation } from '../contexts/ThemeContext';

const elevation = useElevation();

// Apply shadow
<View style={[styles.card, elevation.md]}>
  {/* Content */}
</View>
```

## 🎨 **Theme Customization**

To customize colors, edit `constants/theme.ts`:

```typescript
export const theme = {
  colors: {
    primary: '#YOUR_NEW_COLOR',    // Change primary color
    accent: '#YOUR_ACCENT_COLOR',  // Change accent color
    // ... other colors
  },
  // ... rest of theme
};
```

## 📱 **Updated Components**

### Button Component
- ✅ **Theme variants**: primary, secondary, outline, danger
- ✅ **Size variants**: sm, md, lg
- ✅ **Icon support**: Any FontAwesome icon
- ✅ **Disabled state**: Automatic opacity reduction
- ✅ **Elevation**: Automatic shadow on enabled buttons

### RecipeList Component
- ✅ **Dynamic colors**: Uses theme colors throughout
- ✅ **Consistent spacing**: Uses theme spacing values
- ✅ **Typography**: Uses theme font sizes and weights
- ✅ **Enhanced buttons**: Uses new button variants

## 🔧 **Advanced Features**

### Color with Opacity
```typescript
import { getColorWithOpacity } from '../constants/theme';

const semiTransparentBlue = getColorWithOpacity(colors.primary, 0.5);
```

### Custom Hook Usage
```typescript
import { useTheme } from '../contexts/ThemeContext';

const theme = useTheme(); // Access entire theme object
```

## 🌟 **Benefits**

1. **Consistency** - All components use the same design tokens
2. **Maintainability** - Change colors in one place, updates everywhere
3. **Accessibility** - Consistent contrast ratios and spacing
4. **Developer Experience** - TypeScript support with autocomplete
5. **Flexibility** - Easy to create theme variants or dark mode

## 🎯 **Next Steps**

1. **Apply to more components** - Update UrlActionModal, RecipeViewer, etc.
2. **Add dark mode** - Create alternate color schemes
3. **Component variants** - Add more button styles, card types
4. **Animation** - Add consistent transition timings
5. **Responsive design** - Add breakpoint-based spacing/typography

Your theme system is now ready to use throughout your VelvetLadle app! 🚀
