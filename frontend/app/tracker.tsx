import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Activity, Check } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

const MOOD_OPTIONS = [
  { id: 'POSITIVE', label: 'Добре', emoji: '🙂', color: '#10B981' }, 
  { id: 'APATHY', label: 'Апатія', emoji: '😐', color: '#9CA3AF' },  
  { id: 'CRITICAL', label: 'Дуже погано', emoji: '😭', color: '#EF4444' },
];

export default function TrackerScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSaveState = async () => {
    if (!selectedState) return;

    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      const response = await fetch(`${BASE_URL}/tracker/state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: selectedState })
      });

      if (response.ok) {
        if (selectedState === 'CRITICAL' || selectedState === 'APATHY') {
          try {
            const capsuleRes = await fetch(`${BASE_URL}/time-capsule/latest-unread`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (capsuleRes.ok) {
              const capsuleData = await capsuleRes.json();
              if (capsuleData && capsuleData.message) {
                Alert.alert(
                  "Лист із минулого 💌", 
                  `Ти колись залишила це повідомлення для себе:\n\n"${capsuleData.message}"\n\nТримайся, ти сильніша, ніж здається!`,
                  [{ text: 'Дякую', onPress: () => router.back() }]
                );
                return; 
              }
            }
          } catch (e) {
            console.error("Не вдалося дістати капсулу", e);
          }

          Alert.alert(
            "Ми з тобою 🫂", 
            "Зараз може бути складно, але ти не сама. Пам'ятай, що після найтемнішої ночі завжди настає світанок. Відпочинь і бережи себе.",
            [{ text: 'Добре', onPress: () => router.back() }]
          );
          return; 
        }

        setIsSuccess(true);
        setTimeout(() => {
          router.back();
        }, 1500);

      } else {
        console.error("Не вдалося зберегти стан");
      }
    } catch (error) {
      console.error("Помилка мережі:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={s.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
        >
          <ArrowLeft color={c.text} size={24} />
        </Pressable>
        <Text style={[Typography.titleLg, { color: c.text, flex: 1, textAlign: 'center', marginRight: 40 }]}>
          Трекер стану
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.titleContainer}>
          <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
            <Activity color={c.iconColor} size={28} />
          </View>
          <Text style={[Typography.titleXl, { color: c.text, textAlign: 'center', marginTop: 16 }]}>
            Як ти зараз?
          </Text>
          <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 8 }]}>
            Обери стан, який найкраще описує твої емоції в цю хвилину.
          </Text>
        </View>

        <View style={s.optionsContainer}>
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedState === mood.id;
            
            return (
              <Pressable
                key={mood.id}
                onPress={() => {
                  setSelectedState(mood.id);
                  setIsSuccess(false); 
                }}
                disabled={isSaving || isSuccess}
                style={({ pressed }) => [
                  s.moodCard,
                  { backgroundColor: c.card, borderColor: isSelected ? mood.color : c.border },
                  sh.soft,
                  isSelected && { backgroundColor: mood.color + '15', borderWidth: 2 }, 
                  pressed && s.pressed
                ]}
              >
                <Text style={s.emoji}>{mood.emoji}</Text>
                <Text style={[
                  Typography.titleMd, 
                  { color: isSelected ? mood.color : c.text, flex: 1, marginLeft: 16 }
                ]}>
                  {mood.label}
                </Text>
                
                <View style={[
                  s.radioCircle, 
                  { borderColor: isSelected ? mood.color : c.border },
                  isSelected && { backgroundColor: mood.color }
                ]}>
                  {isSelected && <Check color="#FFF" size={14} strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[s.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <Pressable 
          onPress={handleSaveState}
          disabled={!selectedState || isSaving || isSuccess}
          style={({ pressed }) => [
            s.saveBtn,
            { backgroundColor: isSuccess ? '#34C759' : c.accent },
            pressed && s.pressed,
            (!selectedState || isSaving) && !isSuccess && { opacity: 0.5 }
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : isSuccess ? (
            <View style={s.successContent}>
              <Check color="#FFF" size={24} strokeWidth={3} />
              <Text style={s.saveBtnText}>Записано!</Text>
            </View>
          ) : (
            <Text style={s.saveBtnText}>Зберегти стан</Text>
          )}
        </Pressable>
      </View>
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
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  iconBox: {
    padding: 16,
    borderRadius: Radii.full,
  },
  optionsContainer: {
    gap: 12,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 28,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 56,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontSize: 16,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});