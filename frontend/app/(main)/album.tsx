import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Pressable, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Sparkles, 
  Clock 
} from 'lucide-react-native';

import { Colors, Typography, Radii, Spacing, Shadows } from '@/constants/theme';
import { playClickSound } from '@/utils/audio';
import BottomNav from '@/components/BottomNav';

export default function GalleryScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const handleGoBack = () => {
    playClickSound();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <ImageBackground 
      source={isDark ? require('@/assets/images/background_dark.jpg') : require('@/assets/images/background.jpg')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        
        <View style={s.header}>
          <Pressable 
            onPress={handleGoBack}
            style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: c.cardBg, borderColor: c.border },
              Platform.OS === 'ios' ? sh.soft : { elevation: 0 },
              pressed && { opacity: 0.7 }
            ]}
          >
            <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={s.content}>
          <View style={[
            s.card, 
            { backgroundColor: c.cardBg, borderColor: c.border },
            Platform.OS === 'ios' ? sh.soft : { elevation: 0 }
          ]}>
            
            <View style={[s.iconWrapper, { backgroundColor: c.iconBg }]}>
              <ImageIcon color={c.iconColor} size={48} strokeWidth={1.5} />
              <View style={s.sparkleBadge}>
                <Sparkles color={c.accent} size={20} />
              </View>
            </View>

            <Text style={[Typography.titleXl, s.title, { color: c.textMain }]}>
              Особисті фотоальбоми
            </Text>
            
            <Text style={[Typography.body, s.description, { color: c.textMuted }]}>
              Тут ти зможеш зберігати свої щасливі моменти та досягнення у вигляді персональних альбомів, щоб завжди мати доступ до світлих спогадів. 
            </Text>

            <View style={[s.badge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#FEF3C7' }]}>
              <Clock color={c.accent} size={16} style={{ marginRight: 8 }} />
              <Text style={[Typography.nav, { color: c.accent }]}>
                З'ЯВИТЬСЯ В НАСТУПНОМУ ОНОВЛЕННІ
              </Text>
            </View>

            <Pressable 
              onPress={handleGoBack}
              style={({ pressed }) => [
                s.primaryBtn, 
                { backgroundColor: c.accent },
                pressed && { opacity: 0.8 }
              ]}
            >
              <Text style={[Typography.button, { color: '#FFF' }]}>
                Зрозуміло, чекаю!
              </Text>
            </Pressable>

          </View>
        </View>
        
        <BottomNav isDark={isDark} />
        
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    paddingHorizontal: Spacing.screenX, 
    paddingTop: 12, 
    paddingBottom: 24 
  },
  iconBtn: { 
    padding: 12, 
    borderRadius: Radii.md, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 120,
  },
  card: {
    padding: 32,
    borderRadius: Radii.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: Radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  sparkleBadge: { position: 'absolute', top: -5, right: -5 },
  title: { textAlign: 'center', marginBottom: 16 },
  description: { textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  badge: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radii.full, marginBottom: 32,
  },
  primaryBtn: { width: '100%', paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' }
});