import { BASE_URL } from '@/constants/api';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, ScrollView,
  Image
} from 'react-native';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; 

import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { playClickSound } from '@/utils/audio';

export default function AuthScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false); 
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];

  const appIcon = require('@/assets/images/icon.png');

  useEffect(() => {
    const checkTokenAndAutoLogin = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        
        if (token) {
          const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');
            if (isFirstLogin === 'true') {
              router.replace('/into');
            } else {
              router.replace('/(main)/home');
            }
            return; 
          } else {
            await SecureStore.deleteItemAsync('userToken');
          }
        }
      } catch (error) {
        console.error("Помилка при перевірці токена:", error);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkTokenAndAutoLogin();
  }, []);

  const handleLogin = async () => {
    if (!nickname || !password) {
      setErrorMessage('Введіть нікнейм та пароль');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', nickname); 
      formBody.append('password', password);

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.detail || 'Неправильний нікнейм або пароль';
        setErrorMessage(typeof detail === 'string' ? detail : 'Помилка авторизації');
        return;
      }

      const data = await response.json();
      await SecureStore.setItemAsync('userToken', data.access_token);

      const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');

      if (isFirstLogin === 'true') {
        router.replace('/into'); 
      } else {
        router.replace('/(main)/home'); 
      }

    } catch (error) {
      console.error("Помилка мережі:", error);
      setErrorMessage('Не вдалося з\'єднатися з сервером. Перевірте підключення.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Image source={appIcon} style={s.loaderIcon} resizeMode="cover" />
        <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          
          <View style={s.header}>
            <Image source={appIcon} style={s.headerIcon} resizeMode="cover" />
            <Text style={[s.mainTitle, { color: c.textMain }]}>AuMentem</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>
              Твій простір для відновлення 🌿
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <View style={s.inputGroup}>
              
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} /> 
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Твій нікнейм"
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                  value={nickname} 
                  onChangeText={setNickname}
                />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Lock color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff color={c.textMuted} size={20} /> : <Eye color={c.textMuted} size={20} />}
                </Pressable>
              </View>
            </View>

            {errorMessage ? (
              <Text style={s.errorText}>{errorMessage}</Text>
            ) : null}

            <Pressable style={s.forgotBtn}>
              <Text style={[s.forgotText, { color: c.accent }]}>Забули пароль?</Text>
            </Pressable>
          </View>

          <View style={s.footer}>
            <Pressable 
              style={({ pressed }) => [
                s.primaryBtn, 
                { backgroundColor: c.accent },
                pressed && s.btnPressed,
                isLoading && { opacity: 0.7 }
              ]}
              onPress={() => {
                playClickSound();
                handleLogin();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={s.primaryBtnText}>Увійти</Text>
                  <ArrowRight color="#FFF" size={20} strokeWidth={3} />
                </>
              )}
            </Pressable>

            <Pressable 
              style={({ pressed }) => [s.secondaryBtn, pressed && s.btnPressed]}
              onPress={() => {
                playClickSound();
                router.push('/register');
              }}
            >
              <Text style={[s.secondaryBtnText, { color: c.textMain }]}>
                Ще немає акаунту? <Text style={{ color: c.accent }}>Створити</Text>
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: Spacing.screenX, 
    justifyContent: 'center',
    paddingVertical: 40 
  },
  loaderIcon: { width: 80, height: 80, borderRadius: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  headerIcon: { width: 100, height: 100, borderRadius: 20, marginBottom: 20 },
  mainTitle: { ...Typography.titleXl, marginBottom: 4 },
  subtitle: { ...Typography.body, textAlign: 'center' },
  card: { borderRadius: Radii.lg, padding: Spacing.cardP, borderWidth: 1, marginBottom: 32 },
  inputGroup: { gap: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radii.md, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, ...Typography.body },
  errorText: { color: '#FF3B30', marginTop: 12, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 16, paddingHorizontal: 4 },
  forgotText: { ...Typography.muted, fontWeight: '700' },
  footer: { gap: 16 },
  primaryBtn: { flexDirection: 'row', height: 60, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 18 },
  secondaryBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { ...Typography.body, fontSize: 15 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});