import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export type AppSettings = {
  animations: boolean;
  sfx: boolean;
  music: boolean;
  ambientOrbsEnabled: boolean;
  petEnabled: boolean;
  notificationsEnabled: boolean;
};

const DEFAULTS: AppSettings = {
  animations: true,
  sfx: true,
  music: true,
  ambientOrbsEnabled: true,
  petEnabled: true,
  notificationsEnabled: true,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  const reload = useCallback(async () => {
    try {
      const saved = await SecureStore.getItemAsync('userSettings');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setSettings({
        animations: parsed.animations !== false,
        sfx: parsed.sfx !== false,
        music: parsed.music !== false,
        ambientOrbsEnabled: parsed.ambientOrbsEnabled !== false,
        petEnabled: parsed.petEnabled !== false,
        notificationsEnabled: parsed.notificationsEnabled !== false,
      });
    } catch {
      // keep defaults
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return {
    animationsEnabled: settings.animations,
    sfxEnabled: settings.sfx,
    musicEnabled: settings.music,
    ambientOrbsEnabled: settings.ambientOrbsEnabled,
    petEnabled: settings.petEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    reload,
  };
}
