import { useState, useCallback } from 'react';
import { Appearance, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { playClickSound } from '@/utils/audio';

export function useSavedTheme(): {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
} {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

  const loadTheme = useCallback(async () => {
    const savedTheme = await SecureStore.getItemAsync('userTheme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
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
    DeviceEventEmitter.emit('THEME_CHANGED', newTheme);
    await SecureStore.setItemAsync('userTheme', newTheme ? 'dark' : 'light');
    import('@/utils/audio').then(({ playAmbientSound }) => playAmbientSound(0, newTheme));
  };

  const theme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  return { isDark, setIsDark, theme, toggleTheme };
}
