import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Radii, Shadows } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false); 
  
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  const handleLogin = () => {
    router.replace('/(main)/home'); 
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.content}>
          
          {/* HEADER */}
          <View style={s.header}>
            <View style={[s.iconGlow, { backgroundColor: c.iconBg }, sh.glow]}>
              <Sparkles color={c.iconColor} size={40} strokeWidth={2} />
            </View>
            <Text style={[Typography.titleXl, { color: c.textMain, marginBottom: 4 }]}>AuMentem</Text>
            <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center' }]}>
              Твій простір для відновлення 🌿
            </Text>
          </View>

          {/* FORM CARD */}
          <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
            <View style={s.inputGroup}>
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Mail color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Твій email"
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Lock color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <Pressable style={s.forgotBtn}>
              <Text style={[Typography.muted, { color: c.accent, fontWeight: '700' }]}>Забули пароль?</Text>
            </Pressable>
          </View>

          {/* ACTIONS */}
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
              <Text style={[Typography.body, { color: c.textMain, fontSize: 15 }]}>
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
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconGlow: { padding: 16, borderRadius: Radii.lg, marginBottom: 20 },
  card: { borderRadius: Radii.lg, padding: 20, borderWidth: 1, marginBottom: 32 },
  inputGroup: { gap: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: { flex: 1, ...Typography.body },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 16 },
  footer: { gap: 16 },
  primaryBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 18 },
  secondaryBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});