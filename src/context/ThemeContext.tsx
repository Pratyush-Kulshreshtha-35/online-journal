import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'paper';

interface ThemeContextType {
  theme: ThemeMode;
  isPaper: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('journal_theme');
      if (saved === 'paper' || saved === 'dark') {
        return saved;
      }
    }
    return 'dark';
  });

  const applyTheme = (newTheme: ThemeMode) => {
    const root = document.documentElement;
    if (newTheme === 'paper') {
      root.classList.add('theme-paper');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('theme-paper');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
    localStorage.setItem('journal_theme', newTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'paper' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const isPaper = theme === 'paper';

  return (
    <ThemeContext.Provider value={{ theme, isPaper, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
