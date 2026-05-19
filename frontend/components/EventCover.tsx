import React from 'react';
import { View, Image, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

type ThemeKey = 'light' | 'dark';

type EventCoverProps = {
  imageUrl?: string | null;
  theme: ThemeKey;
  style?: StyleProp<ViewStyle>;
  large?: boolean;
  category?: string;
};

export default function EventCover({ imageUrl, theme, style, large = false, category }: EventCoverProps) {
  const c = Colors[theme];
  const hasImage = !!imageUrl?.trim();

  if (hasImage) {
    return (
      <View style={[styles.wrap, style]}>
        <Image source={{ uri: imageUrl! }} style={styles.image} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)']} style={styles.overlay} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={theme === 'dark' ? ['#1e3a5f', '#0f172a'] : ['#FEF3C7', '#FDE68A', '#FBBF24']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, styles.placeholder, style]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${c.accent}25` }]}>
        <CalendarDays color={c.accent} size={large ? 48 : 32} strokeWidth={1.5} />
      </View>
      {category ? (
        <View style={[styles.categoryPill, { backgroundColor: c.cardBg, borderColor: c.border }]}>
          <Sparkles color={c.accent} size={14} />
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
});
