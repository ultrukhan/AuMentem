import { BASE_URL } from '@/constants/api';
import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import { User, Lock, Sparkles, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; 

import { Colors, Typography, Radii, Shadows } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false); 
  
 const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

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
      console.log("Успішний вхід! Токен збережено.");

      router.replace('/(main)/home'); 

    } catch (error) {
      console.error("Помилка мережі:", error);
      setErrorMessage('Не вдалося з\'єднатися з сервером. Перевірте підключення.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.content}>
          
          <View style={s.header}>
            <View style={[s.iconGlow, { backgroundColor: c.iconBg }, sh.glow]}>
              <Sparkles color={c.iconColor} size={40} strokeWidth={2} />
            </View>
            <Text style={[s.mainTitle, { color: c.text }]}>AuMentem</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>
              Твій простір для відновлення 🌿
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
            <View style={s.inputGroup}>
              
         <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} /> 
                <TextInput
                  style={[s.input, { color: c.text }]}
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
                  style={[s.input, { color: c.text }]}
                  placeholder="Пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
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
              onPress={handleLogin}
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
    paddingHorizontal: 24, 
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40, 
  },
  iconGlow: {
    padding: 16,
    borderRadius: Radii.lg, 
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
    borderRadius: Radii.lg, 
    padding: 20, 
    borderWidth: 1,
    marginBottom: 32,
  },
  inputGroup: { gap: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md, 
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    ...Typography.body,
  },
  errorText: {
    color: '#FF3B30', 
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
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