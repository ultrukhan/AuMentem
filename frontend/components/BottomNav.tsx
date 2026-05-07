import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Image as ImageIcon, CalendarHeart } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Shadows, Radii } from '@/constants/theme';

interface BottomNavProps {
  isDark?: boolean;
}

export default function BottomNav({ isDark = false }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname(); 
  const insets = useSafeAreaInsets(); // відступи телефону
  
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  const tabs = [
    { name: 'Головна', path: '/home', Icon: Home },
    { name: 'Альбом', path: '/album', Icon: ImageIcon },
    { name: 'Локальні', path: '/local', Icon: CalendarHeart },
  ];

  return (
    <View style={[
      styles.container, 
      sh.nav, 
      { bottom: Math.max(insets.bottom + 12, 24) } 
    ]}>
      <BlurView 
        intensity={isDark ? 40 : 60} 
        tint={isDark ? 'dark' : 'light'} 
        style={[
          styles.navBar, 
          { 
            backgroundColor: c.navBg, 
            borderColor: c.border,
          }
        ]}
      >
        {tabs.map((tab) => {
          const active = pathname.includes(tab.path);
          const color = active ? c.navIconActive : c.navIconInactive;
          
          return (
            <Pressable 
              key={tab.name}
              onPress={() => router.replace(tab.path as any)}
              style={({ pressed }) => [
                styles.navItem,
                pressed && styles.pressed
              ]}
            >
              <tab.Icon color={color} size={24} strokeWidth={active ? 2.5 : 2} />
              <Text style={[Typography.nav, { color, marginTop: 4 }]}>
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
    left: 24,
    right: 24,
    zIndex: 100, 
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: Radii.lg, 
    borderWidth: 1, 
    overflow: 'hidden',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64, 
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }] 
  }
});