// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useReducer } from 'react';

const ThemeContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE':
      return state === 'dark' ? 'light' : 'dark';
    case 'SET':
      return action.payload;
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const saved = localStorage.getItem('theme') || 'dark';
  const [theme, dispatch] = useReducer(reducer, saved);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);