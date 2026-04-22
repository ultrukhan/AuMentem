import { BASE_URL } from '@/constants/api';
import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { Mail, Lock, Sparkles, ArrowRight, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
// Імпортуємо вашу дизайн-систему
import { Colors, Typography, Radii, Shadows } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false); 
  
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  const handleRegister = async () => {
    
    if (!nickname || !email || !password) {
      setErrorMessage('Будь ласка, заповніть всі поля');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Введіть коректний email (наприклад: user@mail.com)');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Пароль має містити щонайменше 6 символів');
      return;
    }

    setIsLoading(true);
    setErrorMessage(''); 

    try {
      /* ВАЖЛИВО: 
         Для емулятора Android: змініть 127.0.0.1 на 10.0.2.2
         Для Expo Go (реальний телефон): впишіть IP-адресу комп'ютера в Wi-Fi (напр. 192.168.0.100)
      */
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname,
          email: email,
          password: password,
          hobby_ids: [] 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.detail?.[0]?.msg || errorData.detail || 'Сталася помилка при реєстрації';
        setErrorMessage(detail);
        return;
      }

      console.log("Акаунт успішно створено!");
      router.back(); 

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
            <Text style={[s.mainTitle, { color: c.text }]}>Реєстрація</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>
              Почни свій шлях в AuMentem 🌱
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
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Mail color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.text }]}
                  placeholder="Твій email"
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
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
          </View>

          <View style={s.footer}>
            <Pressable 
              style={({ pressed }) => [
                s.primaryBtn, 
                { backgroundColor: c.accent },
                pressed && s.btnPressed,
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleRegister}
              disabled={isLoading} 
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={s.primaryBtnText}>Створити акаунт</Text>
                  <ArrowRight color="#FFF" size={20} strokeWidth={3} />
                </>
              )}
            </Pressable>

            <Pressable 
              style={({ pressed }) => [s.secondaryBtn, pressed && s.btnPressed]}
              onPress={() => router.back()}
            >
              <Text style={[s.secondaryBtnText, { color: c.text }]}>
                Вже маєш акаунт? <Text style={{ color: c.accent }}>Увійти</Text>
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
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
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