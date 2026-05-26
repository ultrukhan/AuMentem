import { Stack } from 'expo-router';
import { useFonts, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, AppState, View, StyleSheet, Appearance } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import ToastContainer from '@/components/ToastContainer';
import OfflineBanner from '@/components/OfflineBanner';
import { SyncManager } from '@/utils/SyncManager';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      const enforceImmersiveMode = async () => {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync("overlay-swipe");
        } catch (e) {}
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
    if (loaded || error) {
      SplashScreen.hideAsync();
      SyncManager.init();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  const bgColor = Appearance.getColorScheme() === 'dark' ? '#020617' : '#FFFDF7';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bgColor }, animation: 'fade' }} />
      <ToastContainer />
      <OfflineBanner />
    </View>
  );
}