import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter, Pressable, Appearance } from 'react-native';
import { AnimatePresence, View as MotiView } from 'moti';
import { Colors, Typography, Radii } from '@/constants/theme';
import { ToastConfig } from '@/utils/toast';
import { Info, CheckCircle2, AlertCircle, X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ToastContainer() {
  const [toast, setToast] = useState<ToastConfig & { id: number, animate: boolean } | null>(null);
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchTheme = async () => {
      const savedTheme = await SecureStore.getItemAsync('userTheme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
    };
    fetchTheme();

    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', async (config: ToastConfig) => {
      const id = Date.now();
      let animate = true;
      try {
        const saved = await SecureStore.getItemAsync('userSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.animations === false) animate = false;
        }
      } catch {}
      
      setToast({ ...config, id, animate });

      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, config.duration || 3000);
    });

    const themeSub = DeviceEventEmitter.addListener('THEME_CHANGED', (dark: boolean) => {
      setIsDark(dark);
    });

    return () => {
      subscription.remove();
      themeSub.remove();
    };
  }, []);

  const c = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none', zIndex: 9999 }]}>
      <AnimatePresence>
        {toast && (
          <MotiView
            key={toast.id}
            from={toast.animate ? { opacity: 0, translateY: -40 } : { opacity: 1, translateY: 0 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={toast.animate ? { opacity: 0, translateY: -40 } : { opacity: 0, translateY: 0 }}
            transition={{ type: 'timing', duration: toast.animate ? 350 : 0 }}
            style={[
              s.toast,
              { backgroundColor: c.cardBg, borderColor: c.border, top: Math.max(insets.top + 10, 50) }
            ]}
          >
            <View style={s.iconBox}>
              {toast.type === 'error' ? (
                <AlertCircle color="#FF3B30" size={24} />
              ) : toast.type === 'success' ? (
                <CheckCircle2 color="#34C759" size={24} />
              ) : (
                <Info color={c.accent} size={24} />
              )}
            </View>
            <View style={s.content}>
              <Text style={[s.title, { color: c.textMain }]} numberOfLines={2}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text style={[s.message, { color: c.textMuted }]} numberOfLines={3}>
                  {toast.message}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => setToast(null)} style={s.closeBtn}>
              <X color={c.textMuted} size={18} />
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  iconBox: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.titleMd,
    fontSize: 16,
  },
  message: {
    ...Typography.body,
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  }
});
