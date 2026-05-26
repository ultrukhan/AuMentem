import { Platform, ViewStyle } from 'react-native';
import { Shadows } from '@/constants/theme';

export type ThemeKey = 'light' | 'dark';
export type ShadowKey = keyof typeof Shadows.light;

/** iOS: native shadow. Android: flat (no elevation — better perf). */
export function cardShadow(theme: ThemeKey, key: ShadowKey = 'soft'): ViewStyle {
  if (Platform.OS === 'ios') {
    return Shadows[theme][key] as ViewStyle;
  }
  return {};
}
