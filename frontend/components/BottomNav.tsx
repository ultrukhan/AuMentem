import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Image as ImageIcon, CalendarHeart } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { cardShadow } from '@/utils/shadowStyle';
import { playClickSound } from '@/utils/audio';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSinglePress } from '@/hooks/useSinglePress';

interface BottomNavProps {
  isDark?: boolean;
  theme?: 'light' | 'dark';
}

export default function BottomNav({ isDark = false, theme: themeProp }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { animationsEnabled } = useAppSettings();
  const runOnce = useSinglePress();

  const themeKey = themeProp ?? (isDark ? 'dark' : 'light');
  const c = Colors[themeKey];

  const tabs = [
    { name: 'Головна', path: '/(main)/home' as const, match: 'home', Icon: Home },
    { name: 'Альбом', path: '/(main)/album' as const, match: 'album', Icon: ImageIcon },
    { name: 'Локальні', path: '/localEventsScreen' as const, match: 'localEvents', Icon: CalendarHeart },
  ];

  return (
    <View style={[styles.container, cardShadow(themeKey, 'nav'), { bottom: Math.max(insets.bottom + 12, Spacing.screenBot) }]}>
      <BlurView
        intensity={isDark ? 32 : 48}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.navBar,
          {
            backgroundColor: c.navBg,
            borderColor: c.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const active = pathname.includes(tab.match);
          const color = active ? c.navIconActive : c.navIconInactive;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (active) return;
                runOnce(() => {
                  playClickSound();
                  router.replace({ pathname: tab.path, params: { theme: themeKey } });
                });
              }}
              style={({ pressed }) => [
                styles.navItem,
                pressed && !active && styles.pressed,
                pressed && animationsEnabled && !active && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <tab.Icon color={color} size={24} strokeWidth={active ? 2.5 : 2} />
              <Text style={[Typography.nav, { color, marginTop: 4 }]} numberOfLines={1}>
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.screenX,
    right: Spacing.screenX,
    zIndex: 100,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.navPx,
    paddingVertical: Spacing.navPy,
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
