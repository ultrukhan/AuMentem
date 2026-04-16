import React, { useState } from 'react';
import { 
  View, Text, Pressable, StyleSheet, ImageBackground, 
  SafeAreaView, Platform 
} from 'react-native';
import { 
  User, Settings, Moon, Sun, 
  Sparkles, Map, MessageCircleHeart 
} from 'lucide-react-native';
import BottomNav from '@/components/BottomNav'; // Наше літаюче меню
import { Colors, Typography, Radii, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  // Витягуємо кольори та тіні з нашої дизайн-системи
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  return (
    <ImageBackground 
      source={require('@/assets/images/background.jpg')} 
      style={s.container}
      resizeMode="cover"
    >
      {/* Напівпрозорий оверлей поверх картинки */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          
          {/* ── HEADER ── */}
          <View style={s.header}>
            <Pressable style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: c.card, borderColor: c.border }, 
              sh.soft,
              pressed && s.pressed
            ]}>
              <User color={c.text} size={24} strokeWidth={2} />
            </Pressable>

            <View style={s.headerRight}>
              <Pressable 
                onPress={() => setIsDark(!isDark)} 
                style={({ pressed }) => [
                  s.iconBtn, 
                  { backgroundColor: c.card, borderColor: c.border }, 
                  sh.soft,
                  pressed && s.pressed
                ]}
              >
                {isDark ? (
                  <Sun color={c.text} size={24} strokeWidth={2} />
                ) : (
                  <Moon color={c.text} size={24} strokeWidth={2} />
                )}
              </Pressable>

              <Pressable style={({ pressed }) => [
                s.iconBtn, 
                { backgroundColor: c.card, borderColor: c.border }, 
                sh.soft,
                pressed && s.pressed
              ]}>
                <Settings color={c.text} size={24} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* ── КАРТКИ (Головне меню) ── */}
          <View style={s.grid}>
            
            {/* Ряд 1: Квести та Геоквести */}
            {/* <View style={s.row}>
              <Pressable style={({ pressed }) => [
                s.halfCard, 
                { backgroundColor: c.card, borderColor: c.border }, 
                sh.soft,
                pressed && s.pressed
              ]}>
                <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <Sparkles color={c.iconColor} size={32} strokeWidth={2} />
                </View>
                <Text style={[Typography.titleMd, { color: c.text }]}>Квести</Text>
              </Pressable> */}
          <View style={s.row}>
              <Pressable 
onPress={() => router.push({ pathname: '/quests', params: { theme: isDark ? 'dark' : 'light' } })}                style={({ pressed }) => [
                  s.halfCard, 
                  { backgroundColor: c.card, borderColor: c.border }, 
                  sh.soft,
                  pressed && s.pressed
              ]}>
                <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <Sparkles color={c.iconColor} size={32} strokeWidth={2} />
                </View>
                <Text style={[Typography.titleMd, { color: c.text }]}>Квести</Text>
              </Pressable>
{/* 
              <Pressable style={({ pressed }) => [
                s.halfCard, 
                { backgroundColor: c.card, borderColor: c.border }, 
                sh.soft,
                pressed && s.pressed
              ]}>
                <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <Map color={c.iconColor} size={32} strokeWidth={2} />
                </View>
                <Text style={[Typography.titleMd, { color: c.text }]}>Геоквести</Text>
              </Pressable> */}
              <Pressable 
                onPress={() => router.push({ pathname: '/geoquests', params: { theme: isDark ? 'dark' : 'light' } })}
                style={({ pressed }) => [
                s.halfCard, 
                { backgroundColor: c.card, borderColor: c.border }, 
                sh.soft,
                pressed && s.pressed
              ]}>
                <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <Map color={c.iconColor} size={32} strokeWidth={2} />
                </View>
                <Text style={[Typography.titleMd, { color: c.text }]}>Геоквести</Text>
              </Pressable>
            
            </View>

            {/* Ряд 2: Анонімна стрічка */}
            <Pressable style={({ pressed }) => [
              s.fullCard, 
              { backgroundColor: c.card, borderColor: c.border }, 
              sh.soft,
              pressed && s.pressed
            ]}>
              <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, sh.glow]}>
                <MessageCircleHeart color={c.iconColor} size={28} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleLg, { color: c.text, marginBottom: 4 }]}>
                  Анонімна стрічка
                </Text>
                <Text style={[Typography.muted, { color: c.textMuted }]}>
                  Ділись почуттями безпечно
                </Text>
              </View>
            </Pressable>

          </View>

        </View>
      </SafeAreaView>

      {/* Підключаємо наше готове нижнє меню */}
      <BottomNav />

    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { 
    flex: 1, 
    // На Android SafeAreaView іноді не дає відступ зверху, тому додаємо його вручну
    paddingTop: Platform.OS === 'android' ? 40 : 0 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: 12 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 32 
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 12 
  },
  iconBtn: { 
    padding: 12, 
    borderRadius: Radii.md, 
    borderWidth: 1 
  },
  grid: { 
    gap: 16 
  },
  row: { 
    flexDirection: 'row', 
    gap: 16 
  },
  halfCard: { 
    flex: 1, 
    borderRadius: Radii.lg, 
    padding: 20, 
    alignItems: 'center', 
    borderWidth: 1 
  },
  fullCard: { 
    borderRadius: Radii.lg, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  iconBox: { 
    padding: 12, 
    borderRadius: Radii.md, 
    marginBottom: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  iconBoxRow: { 
    padding: 16, 
    borderRadius: Radii.md, 
    marginRight: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pressed: { 
    opacity: 0.85, 
    transform: [{ scale: 0.97 }] 
  }
});