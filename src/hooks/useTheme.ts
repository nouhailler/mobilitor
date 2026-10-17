import { useEffect, useState } from 'react';
import { db } from '../db/database';
export type Theme = 'light' | 'dark' | 'system';
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system'),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    void db.preferences
      .get('theme')
      .then((row) => {
        if (active) {
          if (['light', 'dark', 'system'].includes(String(row?.value)))
            setTheme(row!.value as Theme);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  return {
    theme,
    setTheme: (value: Theme) => {
      setTheme(value);
      if (loaded) void db.preferences.put({ key: 'theme', value });
    },
  };
}
