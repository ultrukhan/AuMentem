import { Stack } from 'expo-router';
import { useFonts, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, AppState, View, StyleSheet, useColorScheme } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import ToastContainer from '@/components/ToastContainer';
import OfflineBanner from '@/components/OfflineBanner';
import { SyncManager } from '@/utils/SyncManager';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const colorScheme = useColorScheme();
  const [savedTheme, setSavedTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('userTheme').then((val) => {
      if (val === 'dark' || val === 'light') {
        setSavedTheme(val);
      } else {
        setSavedTheme(colorScheme === 'dark' ? 'dark' : 'light');
      }
    }).catch(() => {
      setSavedTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
  }, [colorScheme]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const enforceImmersiveMode = async () => {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync("overlay-swipe");
        } catch (e) { console.warn('Immersive mode error:', e); }
      };

      enforceImmersiveMode();

      const visibilitySubscription = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === 'visible') {
          setTimeout(() => {
            enforceImmersiveMode();
          }, 2500);
        }
      });

      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          enforceImmersiveMode();
        }
      });

      return () => {
        visibilitySubscription.remove();
        appStateSubscription.remove();
      };
    }
  }, []);

  useEffect(() => {
    if ((loaded || error) && savedTheme !== null) {
      SplashScreen.hideAsync();
      SyncManager.init();
    }
  }, [loaded, error, savedTheme]);

  if ((!loaded && !error) || savedTheme === null) return null;

  const bgColor = savedTheme === 'dark' ? '#020617' : '#FFFDF7';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bgColor }, animation: 'fade' }} />
      <ToastContainer />
      <OfflineBanner />
    </View>
  );
}