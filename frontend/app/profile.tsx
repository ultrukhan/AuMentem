import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ArrowLeft, Check, AlertCircle, Sparkles, Share2 ,LogOut} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

import HobbiesModal from '@/components/HobbiesModal';

export default function ProfileScreen() {
  const router = useRouter();
  
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  
  const [nickname, setNickname] = useState('');
  const [completedQuests, setCompletedQuests] = useState(0); 

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [showHobbiesModal, setShowHobbiesModal] = useState(false);

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

  const handleLogout = async () => {
  try {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('has_hobbies');
    
    router.replace('/'); 
  } catch (error) {
    console.error("Помилка при виході:", error);
  }
};
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

 
  const handleShareApp = async () => {
    try {
      const shareMessage = `Привіт! Я використовую додаток AuMentem. Мій нік: ${nickname}, і я вже виконав(ла) ${completedQuests} квестів для свого ментального здоров'я! Приєднуйся: https://aumentem.app 🚀`;
      
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error("Помилка при шерингу", error);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          >
            <ArrowLeft color={c.textMain} size={IconSizes.sm} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>
            Мій профіль
          </Text>
        </View>

        <View style={s.content}>
          {isLoading ? (
            <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
          ) : (
            <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              
              <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 12 }]}>
                Особисті дані
              </Text>
              
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Введіть новий нікнейм"
                  placeholderTextColor={c.textMuted}
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    if (message.text) setMessage({ text: '', type: '' });
                  }}
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
                  { backgroundColor: c.accent, marginTop: 16 },
                  pressed && s.pressed,
                  isSaving && { opacity: 0.7 }
                ]}
                onPress={handleUpdateNickname}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.primaryBtnText}>Оновити нікнейм</Text>
                )}
              </Pressable>

              <View style={[s.divider, { backgroundColor: c.border }]} />

              <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 12 }]}>
                Вподобання
              </Text>

              <Pressable
                onPress={() => setShowHobbiesModal(true)}
                style={({ pressed }) => [
                  s.inputWrapper,
                  { backgroundColor: c.background, justifyContent: 'space-between' },
                  pressed && s.pressed
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Sparkles color={c.textMuted} size={20} />
                  <Text style={[Typography.body, { color: c.textMain }]}>
                    Твої інтереси
                  </Text>
                </View>
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>Змінити</Text>
              </Pressable>

              <View style={[s.divider, { backgroundColor: c.border }]} />

              {/* Кнопка "Поділитися додатком" */}
              <Pressable 
                onPress={handleShareApp}
                style={({ pressed }) => [
                  s.shareBtn,
                  { backgroundColor: c.background, borderColor: c.border },
                  pressed && s.pressed
                ]}
              >
                <Share2 color={c.textMain} size={20} />
                <Text style={[Typography.titleMd, { color: c.textMain, marginLeft: 12 }]}>
                  Поділитися додатком
                </Text>
              </Pressable>
<View style={[s.miniDivider, { backgroundColor: c.border }]} />

              <Pressable 
                onPress={handleLogout}
                style={({ pressed }) => [
                  s.logoutBtn, 
                  { backgroundColor: isDark ? '#FF3B3015' : '#FF3B3005' }, 
                  pressed && s.pressed
                ]}
              >
                <LogOut color="#FF3B30" size={20} />
                <Text style={[Typography.titleMd, { color: '#FF3B30', marginLeft: 12 }]}>
                  Вийти з акаунта
                </Text>
              </Pressable>

            </View>
            
          )}
        </View>

        <HobbiesModal
          visible={showHobbiesModal}
          isDark={isDark}
          onSuccess={() => setShowHobbiesModal(false)}
          onClose={() => setShowHobbiesModal(false)}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 20,
  },
  card: {
    borderRadius: Radii.lg,
    padding: Spacing.cardP,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 24,
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
    marginTop: 12,
    gap: 8,
  },
  messageText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    height: 50,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontSize: 15,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  miniDivider: {
    height: 1,
    width: '100%',
    marginVertical: 12, 
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FF3B3020', 
  },
});

