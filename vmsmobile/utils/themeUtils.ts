import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/Theme';

// Helper function to create themed styles
export const createThemedStyles = <T extends Record<string, ViewStyle | TextStyle>>(
  styleCreator: (theme: ThemeColors) => T
) => styleCreator;

// Common themed component styles
export const getThemedCardStyle = (theme: ThemeColors): ViewStyle => ({
  backgroundColor: theme.card,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: theme.border,
  ...shadows.small,
});

export const getThemedInputStyle = (theme: ThemeColors, focused: boolean = false): ViewStyle => ({
  backgroundColor: theme.input,
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderColor: focused ? theme.inputFocused : theme.inputBorder,
  paddingHorizontal: spacing.md,
  height: 55,
  fontSize: fontSize.md,
  color: theme.text,
});

export const getThemedButtonStyle = (theme: ThemeColors, disabled: boolean = false): ViewStyle => ({
  backgroundColor: disabled ? theme.buttonDisabled : theme.button,
  paddingVertical: spacing.lg,
  borderRadius: borderRadius.md,
  alignItems: 'center',
  justifyContent: 'center',
  ...shadows.small,
});

export const getThemedButtonTextStyle = (theme: ThemeColors, disabled: boolean = false): TextStyle => ({
  color: disabled ? theme.buttonDisabledText : theme.buttonText,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.bold,
});

export const getThemedModalStyle = (theme: ThemeColors): ViewStyle => ({
  backgroundColor: theme.modal,
  borderRadius: borderRadius.xl,
  padding: spacing.lg,
  ...shadows.large,
});

export const getThemedTextStyle = (
  theme: ThemeColors, 
  variant: 'primary' | 'secondary' | 'muted' = 'primary'
): TextStyle => {
  const colorMap = {
    primary: theme.text,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
  };
  
  return {
    color: colorMap[variant],
    fontSize: fontSize.md,
  };
};

export const getThemedHeaderStyle = (theme: ThemeColors): TextStyle => ({
  color: theme.text,
  fontSize: fontSize.xxl,
  fontWeight: fontWeight.bold,
  marginBottom: spacing.lg,
});

export const getThemedSubheaderStyle = (theme: ThemeColors): TextStyle => ({
  color: theme.textSecondary,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  marginBottom: spacing.md,
});

// Status color helpers
export const getStatusColor = (theme: ThemeColors, status: 'success' | 'warning' | 'error' | 'info'): string => {
  const statusMap = {
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    info: theme.info,
  };
  return statusMap[status];
};

// Create responsive padding based on screen size
export const getResponsivePadding = (isSmallScreen: boolean = false) => ({
  paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
  paddingVertical: isSmallScreen ? spacing.sm : spacing.md,
});

export default {
  createThemedStyles,
  getThemedCardStyle,
  getThemedInputStyle,
  getThemedButtonStyle,
  getThemedButtonTextStyle,
  getThemedModalStyle,
  getThemedTextStyle,
  getThemedHeaderStyle,
  getThemedSubheaderStyle,
  getStatusColor,
  getResponsivePadding,
};
