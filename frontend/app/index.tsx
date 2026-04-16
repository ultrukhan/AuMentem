import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
// Імпортуємо нашу дизайн-систему
import { Colors, Typography, Radii, Shadows } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false); // Потім підключимо глобально
  
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  const handleLogin = () => {
    // Переходимо на головний екран, стираючи екран логіна з історії
    router.replace('/(main)/home'); 
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.content}>
          
          {/* ── HEADER (Згідно ТЗ: pt-12) ── */}
          <View style={s.header}>
            <View style={[s.iconGlow, { backgroundColor: c.iconBg }, sh.glow]}>
              <Sparkles color={c.iconColor} size={40} strokeWidth={2} />
            </View>
            <Text style={[s.mainTitle, { color: c.text }]}>AuMentem</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>
              Твій простір для відновлення 🌿
            </Text>
          </View>

          {/* ── FORM CARD (p-5, rounded-3xl, shadow-soft) ── */}
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
            <View style={s.inputGroup}>
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Mail color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.text }]}
                  placeholder="Твій email"
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Lock color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.text }]}
                  placeholder="Пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <Pressable style={s.forgotBtn}>
              <Text style={[s.forgotText, { color: c.accent }]}>Забули пароль?</Text>
            </Pressable>
          </View>

          {/* ── ACTIONS (rounded-full, gap-4) ── */}
          <View style={s.footer}>
            <Pressable 
              style={({ pressed }) => [
                s.primaryBtn, 
                { backgroundColor: c.accent },
                pressed && s.btnPressed
              ]}
              onPress={handleLogin}
            >
              <Text style={s.primaryBtnText}>Увійти</Text>
              <ArrowRight color="#FFF" size={20} strokeWidth={3} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [s.secondaryBtn, pressed && s.btnPressed]}
              onPress={() => router.push('/register')}
            >
              <Text style={[s.secondaryBtnText, { color: c.text }]}>
                Ще немає акаунту? <Text style={{ color: c.accent }}>Створити</Text>
              </Text>
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24, // px-6
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40, // mb-8 (32px + запас)
  },
  iconGlow: {
    padding: 16,
    borderRadius: Radii.lg, // rounded-3xl
    marginBottom: 20,
  },
  mainTitle: {
    ...Typography.titleXl,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radii.lg, // 24px
    padding: 20, // p-5
    borderWidth: 1,
    marginBottom: 32,
  },
  inputGroup: { gap: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md, // 16px
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    ...Typography.body,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  forgotText: {
    ...Typography.muted,
    fontWeight: '700',
  },
  footer: { gap: 16 },
  primaryBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontSize: 18,
  },
  secondaryBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...Typography.body,
    fontSize: 15,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});