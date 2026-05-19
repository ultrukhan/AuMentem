import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, 
  ScrollView, Alert, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, MailOpen, Heart } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Spacing, IconSizes } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playSuccessSound, playClickSound, playAmbientSound, stopAmbientSound } from '@/utils/audio';
import { useAppSettings } from '@/hooks/useAppSettings';
import { cardShadow } from '@/utils/shadowStyle';
import { parseApiError } from '@/utils/apiErrors';
import AnimatedCard from '@/components/AnimatedCard'; 

export default function TimeCapsuleScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  
  const themeKey = isDark ? 'dark' : 'light';
  const c = Colors[themeKey];
  const { animationsEnabled } = useAppSettings();

  const [unreadMessage, setUnreadMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;

  const DEFAULT_SUPPORT_MESSAGE = "Ти робиш велику справу, дбаючи про свій ментальний стан. Навіть якщо зараз тут порожньо, пам'ятай: все вдасться! ✨";

  useFocusEffect(
    useCallback(() => {
      playAmbientSound(0, isDark);
      return () => {
        stopAmbientSound();
      };
    }, [isDark])
  );

  const fetchLatestMessage = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/Time-capsule/latest-unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMessage(data && data.message ? data.message : null);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLatestMessage();
    }, [])
  );

  useEffect(() => {
    if (!isLoading) {
      if (animationsEnabled) {
        Animated.stagger(150, [
          Animated.timing(fadeAnim1, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(fadeAnim2, { toValue: 1, duration: 500, useNativeDriver: true })
        ]).start();
      } else {
        fadeAnim1.setValue(1);
        fadeAnim2.setValue(1);
      }
    }
  }, [isLoading, animationsEnabled]);

  const handleBack = () => {
    playClickSound();
    router.back();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    playClickSound();
    setIsSaving(true);
    let isSuccess = false;

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/Time-capsule/message`, {
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
        Alert.alert("Помилка", await parseApiError(response, "Не вдалося зберегти лист."));
      }
    } catch (error) {
      Alert.alert("Помилка", "Перевір підключення до інтернету.");
    } finally {
      if (!isSuccess) setIsSaving(false);
    }

    if (isSuccess) {
      playSuccessSound();
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

  const getAnimatedStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [{
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0]
      })
    }]
  });

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <Pressable onPress={handleBack} style={s.backBtn}>
            <ArrowLeft color={c.textMain} size={IconSizes.sm} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>Капсула часу</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {isLoading ? <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} /> : (
            <>
              <Animated.View style={[s.letterCard, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(themeKey, 'soft'), getAnimatedStyle(fadeAnim1)]}>
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
              </Animated.View>

              <Animated.View style={[s.writeCard, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(themeKey, 'soft'), getAnimatedStyle(fadeAnim2)]}>
                <TextInput
                  style={[s.inputArea, { backgroundColor: c.background, color: c.textMain, borderColor: c.border }]}
                  placeholder="Надішли слова підтримки собі крізь час..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
                <AnimatedCard
                  animationsEnabled={animationsEnabled}
                  onPress={handleSendMessage}
                  disabled={isSaving || !newMessage.trim()}
                  style={[s.sendBtn, { backgroundColor: c.accent }, (isSaving || !newMessage.trim()) && { opacity: 0.5 }]}
                >
                  {isSaving ? <ActivityIndicator color="#FFF" /> : <><Send color="#FFF" size={20} /><Text style={s.sendBtnText}>Сховати в капсулу</Text></>}
                </AnimatedCard>
              </Animated.View>
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