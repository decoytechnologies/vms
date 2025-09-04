import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Themes, ThemeColors, ThemeType } from '../constants/Theme';

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  themeType: ThemeType;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Automatically detect system theme
  const systemColorScheme = useColorScheme();
  const themeType: ThemeType = systemColorScheme === 'dark' ? 'dark' : 'light';
  const isDark = themeType === 'dark';
  const theme = Themes[themeType];

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    themeType,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
