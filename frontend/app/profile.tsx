import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { User, ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false); 
  const [message, setMessage] = useState({ text: '', type: '' }); 

  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;

        const response = await fetch(`${BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setNickname(data.nickname); 
        }
      } catch (error) {
        console.error("Помилка завантаження:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentProfile();
  }, []);

  const handleUpdateNickname = async () => {
    if (!nickname.trim()) {
      setMessage({ text: 'Нікнейм не може бути порожнім', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      const response = await fetch(`${BASE_URL}/app_user/update_nick`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname }),
      });

      if (response.ok) {
        setMessage({ text: 'Нікнейм успішно оновлено! 🎉', type: 'success' });
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.detail || 'Помилка оновлення', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Помилка з\'єднання з сервером', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          >
            <ArrowLeft color={c.text} size={24} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.text, flex: 1, textAlign: 'center', marginRight: 40 }]}>
            Мій профіль
          </Text>
        </View>

        <View style={s.content}>
          {isLoading ? (
            <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
          ) : (
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
              <Text style={[Typography.body, { color: c.textMuted, marginBottom: 8, marginLeft: 4 }]}>
                Змінити нікнейм
              </Text>
              
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.text }]}
                  placeholder="Введіть новий нікнейм"
                  placeholderTextColor={c.textMuted}
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              {message.text ? (
                <View style={[s.messageBox, { backgroundColor: message.type === 'success' ? '#34C75920' : '#FF3B3020' }]}>
                  {message.type === 'success' ? (
                    <Check color="#34C759" size={18} />
                  ) : (
                    <AlertCircle color="#FF3B30" size={18} />
                  )}
                  <Text style={[s.messageText, { color: message.type === 'success' ? '#34C759' : '#FF3B30' }]}>
                    {message.text}
                  </Text>
                </View>
              ) : null}

              <Pressable 
                style={({ pressed }) => [
                  s.primaryBtn, 
                  { backgroundColor: c.accent, marginTop: 24 },
                  pressed && s.pressed,
                  isSaving && { opacity: 0.7 }
                ]}
                onPress={handleUpdateNickname}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.primaryBtnText}>Зберегти зміни</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24, 
    paddingTop: 20,
  },
  card: {
    borderRadius: Radii.lg, 
    padding: 20, 
    borderWidth: 1,
  },
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
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    marginTop: 16,
    gap: 8,
  },
  messageText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    height: 56,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});