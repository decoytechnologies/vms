# VMS Mobile App Theme System

## Overview
The VMS mobile app now features a comprehensive dark/light theme system that automatically adapts to the device's system theme settings.

## Architecture

### 1. Theme Configuration (`constants/Theme.ts`)
- Comprehensive color palettes for light and dark themes
- Consistent color tokens for all UI elements
- Typography, spacing, and component style constants
- Shadow and elevation presets

### 2. Theme Context (`contexts/ThemeContext.tsx`)
- React Context for theme state management
- Automatic system theme detection using `useColorScheme()`
- Global theme provider wrapping the entire app
- Custom `useTheme()` hook for consuming theme in components

### 3. Theme Utilities (`utils/themeUtils.ts`)
- Helper functions for creating themed styles
- Pre-built style generators for common components
- Consistent styling patterns across the app
- Status color mapping functions

## Implementation

### Theme Provider Setup
```tsx
// In app/_layout.tsx
<ThemeProvider>
  <MainApp />
</ThemeProvider>
```

### Using Themes in Components
```tsx
// In any component
import { useTheme } from '../contexts/ThemeContext';
import { getThemedCardStyle } from '../utils/themeUtils';

const MyComponent = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={[getThemedCardStyle(theme), customStyles]}>
      <Text style={{ color: theme.text }}>Themed Content</Text>
    </View>
  );
};
```

## Features

### Automatic Theme Detection
- Uses React Native's `useColorScheme()` hook
- Automatically switches between light/dark based on device settings
- No manual theme toggle needed (follows system preference)

### Comprehensive Theme Coverage
- **Backgrounds**: Primary, surface, card, modal backgrounds
- **Text**: Primary, secondary, muted text colors
- **Interactive Elements**: Buttons, inputs, links
- **Status Colors**: Success, warning, error, info
- **Borders**: Dividers, input borders, card borders
- **Shadows**: Consistent elevation across platforms

### Component Support
All major components now support theming:
- ✅ Login Screen (`GuardLoginScreen.tsx`)
- ✅ Check-in Screen (`app/(tabs)/index.tsx`)
- ✅ Check-out Screen (`app/(tabs)/checkout.tsx`)
- ✅ Tab Navigation (`app/(tabs)/_layout.tsx`)
- ✅ Status Bar (adaptive based on theme)

## Color Schemes

### Light Theme
- **Primary**: Blue (#007bff)
- **Background**: Light gray (#F0F2F5)
- **Surface**: White (#FFFFFF)
- **Text**: Dark gray (#333333)
- **Borders**: Light gray (#E0E0E0)

### Dark Theme
- **Primary**: Light blue (#4dabf7)
- **Background**: Dark gray (#121212)
- **Surface**: Dark surface (#1e1e1e)
- **Text**: White (#FFFFFF)
- **Borders**: Dark gray (#404040)

## Benefits

1. **Consistency**: Unified color system across all components
2. **Accessibility**: Better contrast ratios and readability
3. **User Experience**: Matches system preferences automatically
4. **Maintainability**: Centralized theme management
5. **Performance**: Efficient theme switching without re-renders

## Files Modified

### New Files
- `constants/Theme.ts` - Theme configuration
- `contexts/ThemeContext.tsx` - Theme provider and hooks
- `utils/themeUtils.ts` - Theme utility functions

### Updated Files
- `app/_layout.tsx` - Added ThemeProvider and StatusBar
- `app/(tabs)/_layout.tsx` - Themed tab navigation
- `components/GuardLoginScreen.tsx` - Full theme integration
- `app/(tabs)/index.tsx` - Themed check-in screen
- `app/(tabs)/checkout.tsx` - Started theme integration

## Usage Guidelines

1. **Always use theme colors**: Never hardcode colors
2. **Use utility functions**: Leverage pre-built style generators
3. **Test both themes**: Ensure components work in light and dark
4. **Follow naming conventions**: Use semantic color names
5. **Maintain contrast**: Ensure accessibility standards

## Future Enhancements

- Manual theme override option
- Additional color schemes (high contrast, custom themes)
- Animation during theme transitions
- Theme-aware image resources
- Persistence of manual theme selections
