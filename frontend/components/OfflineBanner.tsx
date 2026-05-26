import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        setDismissed(false); // Reset dismissed state when connection is restored
      }
    });
    return () => unsubscribe();
  }, []);

  if (isConnected !== false || dismissed) return null;

  return (
    <Animated.View 
      entering={FadeInUp} 
      exiting={FadeOutUp} 
      style={[styles.container, { top: insets.top + 10 }]}
    >
      <WifiOff color="#FFF" size={20} style={{ marginRight: 8 }} />
      <Text style={[styles.text, { flex: 1 }]}>Відсутнє з'єднання з інтернетом</Text>
      <Pressable onPress={() => setDismissed(true)} style={{ padding: 4, marginLeft: 8 }}>
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  }
});
