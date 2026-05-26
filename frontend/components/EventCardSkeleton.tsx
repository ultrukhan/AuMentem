import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { Spacing } from '@/constants/theme';

export default function EventCardSkeleton({ isDark, count = 3 }: { isDark: boolean; count?: number }) {
  return (
    <View style={s.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} colorMode={isDark ? 'dark' : 'light'} width="100%" height={200} radius={24} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 12, paddingTop: 4 },
});
