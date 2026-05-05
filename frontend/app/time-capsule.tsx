import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, 
  ScrollView, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, MailOpen, Heart } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
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

  const DEFAULT_SUPPORT_MESSAGE = "Ти робиш велику справу, дбаючи про свій ментальний стан. Навіть якщо зараз тут порожньо, пам'ятай: все вдасться! ✨";

  const fetchLatestMessage = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/time-capsule/latest-unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMessage(data && data.message ? data.message : null);
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
    if (!newMessage.trim()) return;

    setIsSaving(true);
    let isSuccess = false;

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
        isSuccess = true;
      } else {
        Alert.alert("Помилка", "Не вдалося зберегти лист.");
      }
    } catch (error) {
      Alert.alert("Помилка", "Перевір підключення до інтернету.");
    } finally {
      if (!isSuccess) setIsSaving(false);
    }

    if (isSuccess) {
      Alert.alert(
        "Момент збережено! ✨", 
        "Твоє послання надійно сховане у Капсулу Часу. Коли тобі буде складно або знадобиться промінь тепла, воно обов'язково тобі покажеться. 🫂",
        [
          { 
            text: "Дякую", 
            onPress: () => router.replace('/(main)/home') 
          }
        ]
      ); 
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft color={c.textMain} size={IconSizes.sm} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>Капсула часу</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {isLoading ? <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} /> : (
            <>
              <View style={[s.letterCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
                <View style={s.letterHeader}>
                  <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
                    {unreadMessage ? <MailOpen color={c.iconColor} size={20} /> : <Heart color={c.accent} size={20} />}
                  </View>
                  <Text style={[Typography.titleMd, { color: c.textMain, marginLeft: 12 }]}>
                    {unreadMessage ? "Твій лист із минулого" : "Послання підтримки ✨"}
                  </Text>
                </View>
                
                <View style={[s.messageBubble, { backgroundColor: c.overlay, borderLeftColor: unreadMessage ? '#F97316' : c.accent }]}>
                  <Text style={[Typography.body, { color: c.textMain, fontStyle: 'italic', lineHeight: 24 }]}>
                    "{unreadMessage || DEFAULT_SUPPORT_MESSAGE}"
                  </Text>
                </View>

                {unreadMessage && (
                  <Text style={[Typography.muted, { color: c.textMuted, textAlign: 'right', marginTop: 12 }]}>
                    — З любов'ю, ти
                  </Text>
                )}
              </View>

              <View style={[s.writeCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
                <TextInput
                  style={[s.inputArea, { backgroundColor: c.background, color: c.textMain, borderColor: c.border }]}
                  placeholder="Надішли слова підтримки собі крізь час..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
                <Pressable 
                  onPress={handleSendMessage} 
                  disabled={isSaving || !newMessage.trim()} 
                  style={[s.sendBtn, { backgroundColor: c.accent }, (isSaving || !newMessage.trim()) && { opacity: 0.5 }]}
                >
                  {isSaving ? <ActivityIndicator color="#FFF" /> : <><Send color="#FFF" size={20} /><Text style={s.sendBtnText}>Сховати в капсулу</Text></>}
                </Pressable>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, paddingVertical: 16 },
  backBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 40 },
  letterCard: { padding: 20, borderRadius: Radii.lg, borderWidth: 1, marginBottom: 24 },
  letterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { padding: 8, borderRadius: Radii.md },
  messageBubble: { padding: 16, borderRadius: Radii.md, borderLeftWidth: 4 },
  writeCard: { padding: 20, borderRadius: Radii.lg, borderWidth: 1 },
  inputArea: { minHeight: 150, borderRadius: Radii.md, borderWidth: 1, padding: 16, marginBottom: 20, textAlignVertical: 'top', fontSize: 16 },
  sendBtn: { flexDirection: 'row', height: 56, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', gap: 12 },
  sendBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});