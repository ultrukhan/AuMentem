import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Image as ImageIcon, CalendarHeart } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Shadows, Radii } from '@/constants/theme';

export default function BottomNav({ isDark }: { isDark: boolean }) {
  const router = useRouter();
  const pathname = usePathname(); 
  
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

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
        style={[styles.navBar, { backgroundColor: c.navBg, borderTopColor: c.borderTopLeft, borderBottomColor: c.borderBotRight }, sh.nav]}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.path || pathname.includes(tab.path.split('/')[1]);
          const color = active ? c.navIconActive : c.navIconInactive;
          
          return (
            <Pressable 
              key={tab.name}
              onPress={() => router.replace(tab.path as any)}
              style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
            >
              <View style={active && isDark && { shadowColor: color, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 8, elevation: 5 }}>
                <tab.Icon color={color} size={24} strokeWidth={active ? 2.5 : 2} />
              </View>
              <Text style={[Typography.nav, { color, marginTop: 4 }]}>{tab.name}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: Platform.OS === 'ios' ? 28 : 20, left: 24, right: 24, zIndex: 100 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 64 },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.8 }
});