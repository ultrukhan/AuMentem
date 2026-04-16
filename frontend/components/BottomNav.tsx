import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Image as ImageIcon, CalendarHeart } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Shadows, Radii } from '@/constants/theme';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname(); // Щоб знати, на якому ми екрані
  
  const isDark = false; // Тимчасово світла тема
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  const tabs = [
    { name: 'Головна', path: '/home', Icon: Home },
    { name: 'Альбом', path: '/album', Icon: ImageIcon },
    { name: 'Локальні', path: '/local', Icon: CalendarHeart },
  ];

  return (
    <View style={styles.container}>
      <BlurView 
        intensity={isDark ? 80 : 60} 
        tint={isDark ? 'dark' : 'light'} 
        style={[styles.navBar, { borderColor: c.border }, sh.nav]}
      >
        {tabs.map((tab) => {
          const active = pathname.includes(tab.path);
          const color = active ? c.navIconActive : c.navIconInactive;
          
          return (
            <Pressable 
              key={tab.name}
              onPress={() => router.replace(tab.path as any)}
              style={styles.navItem}
            >
              <tab.Icon color={color} size={24} strokeWidth={active ? 2.5 : 2} />
              <Text style={[Typography.nav, { color, marginTop: 4 }]}>{tab.name}</Text>
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
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 24,
    right: 24,
    zIndex: 100, // Щоб меню завжди було поверх котика
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: Radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
});