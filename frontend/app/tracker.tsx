import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, Pressable, StyleSheet, ActivityIndicator, 
  ScrollView, Linking, Modal, Animated, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Activity, Check, HeartHandshake, X, Sparkles, MailOpen } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playSuccessSound, playClickSound, playAmbientSound, stopAmbientSound } from '@/utils/audio';

const DEFAULT_SUPPORT_MESSAGES = [
  "Ти все подолаєш! Навіть після найтемнішої ночі настає світанок ✨",
  "Пам'ятай: твій стан — це не ти. Це лише хвиля, яка обов'язково пройде 🌊",
  "Ти вже робиш велику справу, просто дбаючи про себе в цей момент 🫂",
  "Дай собі час. Відпочинок — це не слабкість, а крок до відновлення 🔋",
  "Сьогодні може бути складно, але ти сильніший/сильніша, ніж здається 💪"
];

const MOOD_OPTIONS = [
  { id: 'POSITIVE', label: 'Добре', emoji: '🙂', color: '#10B981', subtext: 'Поділитися радістю із собою крізь час' }, 
  { id: 'APATHY', label: 'Апатія', emoji: '😐', color: '#9CA3AF', subtext: 'Час переглянути щось тепле' },  
  { id: 'CRITICAL', label: 'Дуже погано', emoji: '😭', color: '#EF4444', subtext: 'Підтримка та допомога поруч' },
];

export default function TrackerScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const [activeModal, setActiveModal] = useState<'NONE' | 'POSITIVE' | 'CRITICAL'>('NONE');
  const [apathyModalVisible, setApathyModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const fadeAnimCards = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await SecureStore.getItemAsync('userSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setAnimationsEnabled(settings.animations !== false);
        }
      } catch (e) {}
    };
    loadSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      playAmbientSound(0, isDark);
      return () => {
        stopAmbientSound();
      };
    }, [isDark])
  );

  useEffect(() => {
    if (animationsEnabled) {
      Animated.stagger(150, [
        Animated.timing(fadeAnimTitle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnimCards, { toValue: 1, duration: 500, useNativeDriver: true })
      ]).start();
    } else {
      fadeAnimTitle.setValue(1);
      fadeAnimCards.setValue(1);
    }
  }, [animationsEnabled]);

  const callSupport = (number: string) => {
    playClickSound();
    Linking.openURL(`tel:${number}`);
  };

  const handleBack = () => {
    playClickSound();
    router.back();
  };

  const handleSelectState = (id: string) => {
    playClickSound();
    setSelectedState(id);
  };

  const autoSaveToCapsule = async () => {
    playClickSound();
    setIsAutoSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const autoMessage = "Цей момент радості зафіксовано в трекері! Нехай цей промінь світла стане підтримкою у майбутньому. Все буде добре! ✨";
      
      const response = await fetch(`${BASE_URL}/Time-capsule/message`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: autoMessage })
      });

      if (response.ok) {
        playSuccessSound();
        router.replace('/(main)/home');
      }
    } catch (e) {
    } finally {
      setIsAutoSaving(false); 
    }
  };

  const handleSaveState = async () => {
    if (!selectedState) return;
    playClickSound();
    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/Tracker/state`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: selectedState })
      });

      if (response.ok) {
        playSuccessSound();
        if (selectedState === 'APATHY') {
          const res = await fetch(`${BASE_URL}/Time-capsule/latest-unread`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          
          if (data && data.message) {
            setSupportMessage(data.message);
          } else {
            const randomIndex = Math.floor(Math.random() * DEFAULT_SUPPORT_MESSAGES.length);
            setSupportMessage(DEFAULT_SUPPORT_MESSAGES[randomIndex]);
          }
          
          setApathyModalVisible(true);
        } else {
          setActiveModal(selectedState as any);
        }
      }
    } catch (error) {
    } finally {
      setIsSaving(false);
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

  const CustomModal = ({ type }: { type: typeof activeModal }) => {
    if (type === 'NONE') return null;

    const config = {
      POSITIVE: {
        title: "Збережемо цей момент? ✨",
        desc: "Зараз гарний настрій — це цінно. Як краще зафіксувати цей стан у Капсулі Часу?",
        icon: <Sparkles color="#10B981" size={48} />,
        primaryBtn: "Записати автоматично",
        btnColor: "#10B981",
        onPrimary: autoSaveToCapsule,
        secondaryBtn: "Написати свій текст",
        onSecondary: () => { 
          playClickSound(); 
          setActiveModal('NONE'); 
          router.push('/time-capsule'); 
        }
      },
      CRITICAL: {
        title: "Підтримка поруч ❤️",
        desc: "Зараз складно, але важливо не залишатися наодинці. Фахівці цих служб готові вислухати прямо зараз:",
        icon: <HeartHandshake color="#EF4444" size={48} />,
        primaryBtn: "7333 (Лінія підтримки)",
        btnColor: "#EF4444",
        onPrimary: () => callSupport('7333'),
        secondaryBtn: "0 800 501 701",
        onSecondary: () => callSupport('0800501701')
      }
    }[type as 'POSITIVE' | 'CRITICAL'];

    return (
      <Modal transparent animationType="slide" visible={true}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: c.cardBg, borderColor: c.border }, Platform.OS === 'android' ? { elevation: 0 } : sh.soft]}>
            <Pressable style={s.closeIcon} onPress={() => { playClickSound(); setActiveModal('NONE'); }}>
              <X color={c.textMuted} size={24} />
            </Pressable>
            <View style={s.modalIconBox}>{config.icon}</View>
            <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center' }]}>{config.title}</Text>
            <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginVertical: 16, lineHeight: 22 }]}>{config.desc}</Text>
            <View style={s.modalFooter}>
              <Pressable style={[s.modalBtn, { backgroundColor: config.btnColor }]} onPress={config.onPrimary} disabled={isAutoSaving}>
                {isAutoSaving && type === 'POSITIVE' ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.modalBtnText}>{config.primaryBtn}</Text>
                )}
              </Pressable>
              <Pressable style={[s.modalBtn, { marginTop: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border }]} onPress={config.onSecondary}>
                <Text style={[s.modalBtnText, { color: c.textMain }]}>{config.secondaryBtn}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <CustomModal type={activeModal} />
      
      <Modal visible={apathyModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: c.cardBg, borderColor: c.border }, Platform.OS === 'android' ? { elevation: 0 } : sh.soft]}>
            <View style={s.modalIconBox}><MailOpen color="#9CA3AF" size={40} /></View>
            <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center' }]}>Послання для тебе 🫂</Text>
            <Text style={[Typography.body, { color: c.textMain, fontStyle: 'italic', marginVertical: 20, textAlign: 'center', lineHeight: 24 }]}>
              "{supportMessage}"
            </Text>
            <Pressable style={[s.modalBtn, { backgroundColor: '#9CA3AF' }]} onPress={() => { playClickSound(); setApathyModalVisible(false); router.replace('/(main)/home'); }}>
              <Text style={s.modalBtnText}>Дякую за підтримку</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.backBtn}><ArrowLeft color={c.textMain} size={IconSizes.sm} /></Pressable>
        <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>Трекер стану</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Animated.View style={[s.titleContainer, getAnimatedStyle(fadeAnimTitle)]}>
          <View style={[s.iconBox, { backgroundColor: c.iconBg }]}><Activity color={c.iconColor} size={28} /></View>
          <Text style={[Typography.titleXl, { color: c.textMain, textAlign: 'center', marginTop: 16 }]}>Як ти зараз?</Text>
          <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 8 }]}>Твій стан — понад усе. Обери варіант, що підходить.</Text>
        </Animated.View>

        <Animated.View style={[s.optionsContainer, getAnimatedStyle(fadeAnimCards)]}>
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedState === mood.id;
            return (
              <Pressable
                key={mood.id}
                onPress={() => handleSelectState(mood.id)}
                style={[
                  s.moodCard, 
                  { backgroundColor: isSelected ? mood.color + '15' : c.cardBg, borderColor: isSelected ? mood.color : c.border, borderWidth: isSelected ? 2 : 1 }, 
                  isSelected ? { elevation: 0, shadowOpacity: 0 } : sh.soft
                ]}
              >
                <View style={s.cardInner}>
                  <Text style={s.emoji}>{mood.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[Typography.titleMd, { color: isSelected ? mood.color : c.textMain }]}>{mood.label}</Text>
                    <Text style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}>{mood.subtext}</Text>
                  </View>
                  <View style={[s.radioCircle, { borderColor: isSelected ? mood.color : c.border }, isSelected && { backgroundColor: mood.color }]}>
                    {isSelected && <Check color="#FFF" size={14} strokeWidth={3} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>

      <View style={[s.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <Pressable 
          onPress={handleSaveState}
          disabled={!selectedState || isSaving}
          style={[
            s.saveBtn, 
            { backgroundColor: selectedState ? MOOD_OPTIONS.find(m => m.id === selectedState)?.color : c.accent }, 
            (!selectedState || isSaving) ? { opacity: 0.5, elevation: 0, shadowOpacity: 0 } : { elevation: 4 }
          ]}
        >
          {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Продовжити</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, paddingTop: 10, paddingBottom: 16 },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: Spacing.screenX, paddingBottom: 40 },
  titleContainer: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  iconBox: { padding: 16, borderRadius: Radii.full },
  optionsContainer: { gap: 14 },
  moodCard: { borderRadius: Radii.lg, padding: 18 },
  cardInner: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 32 },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 24, borderTopWidth: 1 },
  saveBtn: { height: 60, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', padding: 24 },
  modalContainer: { borderRadius: Radii.xl, padding: 28, borderWidth: 1, alignItems: 'center' },
  modalIconBox: { marginBottom: 20, padding: 12, borderRadius: Radii.full, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  modalFooter: { width: '100%', marginTop: 8 },
  modalBtn: { width: '100%', height: 56, borderRadius: Radii.full, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 16 },
  closeIcon: { position: 'absolute', right: 16, top: 16, padding: 4 }
});