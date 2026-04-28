import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Clock, Send, MailOpen, Sparkles } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

export default function TimeCapsuleScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [unreadMessage, setUnreadMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLatestMessage = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/time-capsule/latest-unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.message) {
          setUnreadMessage(data.message);
        } else {
          setUnreadMessage(null);
        }
      } else {
        setUnreadMessage(null);
      }
    } catch (error) {
      console.error("Помилка завантаження капсули:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLatestMessage();
    }, [])
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert("Порожній лист", "Напиши хоча б пару слів для себе в майбутнє!");
      return;
    }

    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/time-capsule/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      if (response.ok) {
        setNewMessage('');
        Alert.alert(
          "Лист відправлено! 🕰️", 
          "Твоє повідомлення надійно сховано в капсулі часу. Ти отримаєш його, коли настане слушний момент."
        );
      } else {
        Alert.alert("Помилка", "Не вдалося зберегти лист.");
      }
    } catch (error) {
      Alert.alert("Помилка мережі", "Перевір підключення до інтернету.");
    } finally {
      setIsSaving(false);
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
            <ArrowLeft color={c.text} size={24} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.text, flex: 1, textAlign: 'center', marginRight: 40 }]}>
            Капсула часу
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
          ) : (
            <>
              {unreadMessage && (
                <View style={[s.letterCard, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
                  <View style={s.letterHeader}>
                    <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
                      <MailOpen color={c.iconColor} size={20} />
                    </View>
                    <Text style={[Typography.titleMd, { color: c.text, marginLeft: 12 }]}>
                      Лист від тебе з минулого
                    </Text>
                  </View>
                  
                  <View style={[s.messageBubble, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                    <Text style={[Typography.body, { color: c.text, lineHeight: 24, fontStyle: 'italic' }]}>
                      "{unreadMessage}"
                    </Text>
                  </View>
                  <Text style={[Typography.muted, { color: c.textMuted, textAlign: 'right', marginTop: 12 }]}>
                    — З любов'ю, ти
                  </Text>
                </View>
              )}

              <View style={[s.writeCard, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
                  <Clock color={c.accent} size={24} />
                  <Text style={[Typography.titleMd, { color: c.text }]}>
                    Написати в майбутнє
                  </Text>
                </View>
                
                <Text style={[Typography.body, { color: c.textMuted, marginBottom: 16 }]}>
                  Залиш тут свої думки, переживання або слова підтримки. Ми збережемо їх і повернемо тобі згодом.
                </Text>

                <TextInput
                  style={[
                    s.inputArea, 
                    { 
                      backgroundColor: c.background, 
                      color: c.text,
                      borderColor: c.border 
                    }
                  ]}
                  placeholder="Привіт, майбутня я! Сьогодні я відчуваю..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top" // Важливо для Android, щоб текст починався зверху
                  value={newMessage}
                  onChangeText={setNewMessage}
                />

                <Pressable 
                  onPress={handleSendMessage}
                  disabled={isSaving || !newMessage.trim()}
                  style={({ pressed }) => [
                    s.sendBtn,
                    { backgroundColor: c.accent },
                    pressed && s.pressed,
                    (isSaving || !newMessage.trim()) && { opacity: 0.5 }
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Send color="#FFF" size={20} />
                      <Text style={s.sendBtnText}>Сховати в капсулу</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={s.footerHint}>
                <Sparkles color={c.textMuted} size={16} />
                <Text style={[Typography.muted, { color: c.textMuted, marginLeft: 8, flex: 1 }]}>
                  Ці листи повністю приватні. Їх бачиш тільки ти.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },
  
  letterCard: {
    padding: 20,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 24,
  },
  letterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    padding: 8,
    borderRadius: Radii.md,
  },
  messageBubble: {
    padding: 16,
    borderRadius: Radii.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },

  writeCard: {
    padding: 20,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  inputArea: {
    minHeight: 120,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 16,
    ...Typography.body,
    fontSize: 16,
    marginBottom: 24,
  },
  sendBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sendBtnText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontSize: 16,
  },
  
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});