import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useAppSettings } from '@/hooks/useAppSettings';

interface AnimatedBackgroundProps {
  isDark: boolean;
  themeKey: 'light' | 'dark';
  children: React.ReactNode;
}

export default function AnimatedBackground({ isDark, themeKey, children }: AnimatedBackgroundProps) {
  const { animationsEnabled } = useAppSettings();

  const c = Colors[themeKey];

  const lightOpacity = useSharedValue(isDark ? 0 : 1);
  const darkOpacity = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    lightOpacity.value = withTiming(isDark ? 0 : 1, { duration: animationsEnabled ? 500 : 0 });
    darkOpacity.value = withTiming(isDark ? 1 : 0, { duration: animationsEnabled ? 500 : 0 });
  }, [isDark, animationsEnabled]);

  const lightStyle = useAnimatedStyle(() => ({ opacity: lightOpacity.value }));
  const darkStyle = useAnimatedStyle(() => ({ opacity: darkOpacity.value }));
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(c.overlay, { duration: animationsEnabled ? 500 : 0 }),
  }), [c.overlay, animationsEnabled]);

  return (
    <View style={s.container}>
      <Animated.View style={[StyleSheet.absoluteFill, lightStyle]}>
        <Image 
          source={require('@/assets/images/background.png')} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover" 
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, darkStyle]}>
        <Image 
          source={require('@/assets/images/background_dark.png')} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover" 
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]} />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  }
});
