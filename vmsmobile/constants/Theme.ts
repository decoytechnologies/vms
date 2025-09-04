/**
 * Comprehensive Theme System for VMS Mobile App
 * Provides consistent dark/light theming across all components
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  modal: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Interactive colors
  button: string;
  buttonText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  
  // Input colors
  input: string;
  inputBorder: string;
  inputFocused: string;
  
  // Tab bar colors
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  // Shadow colors
  shadow: string;
  shadowLight: string;
}

export const lightTheme: ThemeColors = {
  // Primary colors - Blue theme similar to web app
  primary: '#007bff',
  primaryDark: '#0056b3',
  primaryLight: '#66b2ff',
  
  // Background colors
  background: '#F0F2F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  modal: '#FFFFFF',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#888888',
  placeholder: '#AAAAAA',
  
  // Border and divider colors
  border: '#E0E0E0',
  divider: '#F0F0F0',
  
  // Status colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // Interactive colors
  button: '#007bff',
  buttonText: '#FFFFFF',
  buttonDisabled: '#A0CCEE',
  buttonDisabledText: '#FFFFFF',
  
  // Input colors
  input: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputFocused: '#007bff',
  
  // Tab bar colors
  tabBar: '#FFFFFF',
  tabBarActive: '#007bff',
  tabBarInactive: '#687076',
  
  // Shadow colors
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
};

export const darkTheme: ThemeColors = {
  // Primary colors - Blue theme adapted for dark mode
  primary: '#4dabf7',
  primaryDark: '#339af0',
  primaryLight: '#74c0fc',
  
  // Background colors
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',
  modal: '#2d2d2d',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#808080',
  placeholder: '#666666',
  
  // Border and divider colors
  border: '#404040',
  divider: '#333333',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Interactive colors
  button: '#4dabf7',
  buttonText: '#FFFFFF',
  buttonDisabled: '#555555',
  buttonDisabledText: '#888888',
  
  // Input colors
  input: '#2d2d2d',
  inputBorder: '#404040',
  inputFocused: '#4dabf7',
  
  // Tab bar colors
  tabBar: '#1e1e1e',
  tabBarActive: '#4dabf7',
  tabBarInactive: '#9BA1A6',
  
  // Shadow colors
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.3)',
};

export const Themes = {
  light: lightTheme,
  dark: darkTheme,
};

export type ThemeType = 'light' | 'dark';

// Common spacing and sizing constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadow presets
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};

export default Themes;
