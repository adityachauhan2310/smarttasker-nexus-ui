import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create a default context value
const defaultThemeContext: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("Rendering ThemeProvider");
  
  // Initialize theme with a function to avoid unneeded re-renders
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get theme from localStorage during initialization
    const savedTheme = localStorage.getItem('theme') as Theme;
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
  });

  // Apply theme to document when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Memoize the toggle function
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  // Memoize the context value
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
