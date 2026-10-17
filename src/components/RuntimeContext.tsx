import { createContext, useContext } from 'react';
import type { Theme } from '../hooks/useTheme';
export const ThemeContext = createContext<{ theme: Theme; setTheme: (value: Theme) => void }>({
  theme: 'system',
  setTheme: () => {},
});
export const useAppTheme = () => useContext(ThemeContext);
