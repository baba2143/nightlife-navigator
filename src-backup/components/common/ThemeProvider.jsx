import React, { createContext, useContext, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const lightTheme = {
  colors: {
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#45B7D1',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    overlay: 'rgba(0, 0, 0, 0.4)',
    
    // Nightlife specific colors
    nightlife: {
      primary: '#FF6B35',
      secondary: '#9B59B6',
      dark: '#2C3E50',
      gold: '#F1C40F',
      silver: '#BDC3C7',
      bronze: '#CD7F32',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 30,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 26,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 22,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#45B7D1',
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const isDarkMode = colorScheme === 'dark';
      setIsDark(isDarkMode);
      setTheme(isDarkMode ? darkTheme : lightTheme);
    });

    // Set initial theme
    const initialColorScheme = Appearance.getColorScheme();
    const initialIsDark = initialColorScheme === 'dark';
    setIsDark(initialIsDark);
    setTheme(initialIsDark ? darkTheme : lightTheme);

    return () => subscription?.remove();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    setTheme(newIsDark ? darkTheme : lightTheme);
  };

  const value = {
    theme,
    isDark,
    toggleTheme,
    colors: theme.colors,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    typography: theme.typography,
    shadows: theme.shadows,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};