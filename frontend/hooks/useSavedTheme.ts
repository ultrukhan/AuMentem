import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { playClickSound } from '@/utils/audio';

export function useSavedTheme(): {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
} {
  const [isDark, setIsDark] = useState(false);

  const loadTheme = useCallback(async () => {
    const savedTheme = await SecureStore.getItemAsync('userTheme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTheme();
    }, [loadTheme])
  );

  const toggleTheme = async () => {
    playClickSound();
    const newTheme = !isDark;
    setIsDark(newTheme);
    await SecureStore.setItemAsync('userTheme', newTheme ? 'dark' : 'light');
  };

  const theme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  return { isDark, setIsDark, theme, toggleTheme };
}
