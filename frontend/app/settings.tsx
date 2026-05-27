import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Platform, Alert, Pressable, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Music, Volume2, Sparkles, Ghost, MessageCircleQuestion, ShieldCheck, X, Send, Bell } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';

import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { cardShadow } from '@/utils/shadowStyle';
import { parseApiError } from '@/utils/apiErrors';
import { playClickSound, stopAmbientSound, setAmbientVolume, playAmbientSound } from '@/utils/audio';
import { BASE_URL } from '@/constants/api';
import { Toast } from '@/utils/toast';
import HomeBackground from '@/components/HomeBackground';
import AnimatedCard from '@/components/AnimatedCard';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SettingsLink = ({ icon: Icon, title, onPress, isDark, animationsEnabled }: any) => {
  const c = Colors[isDark ? 'dark' : 'light'];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPressIn={() => {
        if (animationsEnabled) scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        if (animationsEnabled) scale.value = withSpring(1);
      }}
      onPress={() => { playClickSound(); onPress(); }}
      style={[s.settingRow, { backgroundColor: c.cardBg, borderColor: c.border, flexDirection: 'row', alignItems: 'center' }, animationsEnabled ? animatedStyle : null]}
    >
      <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
        <Icon color={c.iconColor} size={20} strokeWidth={2} />
      </View>
      <Text style={[Typography.body, { color: c.textMain, flex: 1, marginLeft: 12 }]}>{title}</Text>
    </AnimatedPressable>
  );
};

const SettingsToggle = ({ icon: Icon, title, value, onValueChange, isDark, hasSlider, sliderValue, onSliderChange, onRealtimeChange }: any) => {
  const c = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[s.settingRow, { backgroundColor: c.cardBg, borderColor: c.border, flexDirection: 'column', alignItems: 'stretch' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
          <Icon color={c.iconColor} size={20} strokeWidth={2} />
        </View>
        <Text style={[Typography.body, { color: c.textMain, flex: 1, marginLeft: 12 }]}>{title}</Text>
        <Switch
          trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: c.accent }}
          thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
          ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
          onValueChange={onValueChange} 
          value={value}
        />
      </View>
      
      {hasSlider && value && (
        <View style={{ marginTop: 12, paddingHorizontal: 8 }}>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={sliderValue}
            minimumTrackTintColor={c.accent}
            maximumTrackTintColor={c.border}
            thumbTintColor={c.accent}
            onValueChange={onRealtimeChange}
            onSlidingComplete={onSliderChange}
          />
        </View>
      )}
    </View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const themeKey = isDark ? 'dark' : 'light';

  const [settings, setSettings] = useState({
    music: true,
    musicVolume: 0.5,
    sfx: true,
    sfxVolume: 0.5,
    animations: true,
    anonymousMode: false,
    ambientOrbsEnabled: true,
    petEnabled: true,
    notificationsEnabled: true
  });

  const [isSupportModalVisible, setSupportModalVisible] = useState(false);
  const [isPreviewModalVisible, setPreviewModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await SecureStore.getItemAsync('userSettings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));
      } catch (error) {}
    };
    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: any, isSlider: boolean = false) => {
    const newSettings = { ...settings, [key]: value };
    
    if (key === 'music' && value === true && newSettings.musicVolume === 0) {
      newSettings.musicVolume = 0.5;
      setAmbientVolume(0.5);
    }
    if (key === 'sfx' && value === true && newSettings.sfxVolume === 0) {
      newSettings.sfxVolume = 0.5;
    }
    
    setSettings(newSettings as any);
    
    try {
      await SecureStore.setItemAsync('userSettings', JSON.stringify(newSettings));
      
      const { refreshAudioSettings } = await import('@/utils/audio');
      await refreshAudioSettings();
      
      if (!isSlider && !(key === 'sfx' && value === false)) {
        playClickSound(); 
      }

      if (key === 'music') {
        if (value === false) {
          stopAmbientSound();
        } else {
          playAmbientSound(0, isDark);
        }
      }
      
      if (key === 'musicVolume') setAmbientVolume(value);
    } catch (error) {}
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) return Toast.show({ title: "Увага", message: "Напишіть повідомлення." });
    playClickSound();
    
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${BASE_URL}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: supportMessage 
        })
      });
      
      if (res.ok) {
        Toast.show({ title: "Дякуємо!", message: "Твоє повідомлення надіслано в підтримку. Ми відповімо тобі на пошту!" });
        setSupportModalVisible(false);
        setSupportMessage('');
      } else {
        Toast.show({ title: "Помилка", message: await parseApiError(res, "Не вдалося надіслати повідомлення.") });
      }
    } catch (e) {
      Toast.show({ title: "Помилка мережі", message: "Перевірте підключення до інтернету." });
    }
  };

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable 
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Повернутися назад"
            onPress={() => { playClickSound(); router.back(); }}
            style={({ pressed }) => [s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }, pressed && { opacity: 0.7 }]}
          >
            <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={[Typography.titleXl, s.mainTitle, { color: c.textMain }]}>Налаштування</Text>

        <ScrollView style={s.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          
          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>ФОН ДОМАШНЬОГО ЕКРАНУ</Text>
          <View style={s.section}>
            <AnimatedCard 
              animationsEnabled={settings.animations}
              onPress={() => { playClickSound(); setPreviewModalVisible(true); }}
              style={[
                { height: 200, borderRadius: Radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.border, marginBottom: 12 },
              ]}
            >
               <HomeBackground isDark={isDark} previewAmbientOrbsEnabled={settings.ambientOrbsEnabled ?? true} previewPetEnabled={settings.petEnabled ?? true} />
               <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                 <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>На весь екран ↗</Text>
               </View>
            </AnimatedCard>
            <SettingsToggle 
              icon={Sparkles} title="Анімовані частки (Кульки)" isDark={isDark}
              value={settings.ambientOrbsEnabled ?? true} 
              onValueChange={(val: boolean) => updateSetting('ambientOrbsEnabled', val)}
            />
            <SettingsToggle 
              icon={Ghost} title="Улюбленець" isDark={isDark}
              value={settings.petEnabled ?? true} 
              onValueChange={(val: boolean) => updateSetting('petEnabled', val)}
            />
          </View>

          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>ВРАЖЕННЯ ВІД ДОДАТКУ</Text>
          <View style={s.section}>
            <SettingsToggle 
              icon={Music} title="Фонова музика" isDark={isDark}
              value={settings.music} 
              onValueChange={(val: boolean) => updateSetting('music', val)}
              hasSlider={true} 
              sliderValue={settings.musicVolume} 
              onRealtimeChange={(val: number) => setAmbientVolume(val)}
              onSliderChange={(val: number) => updateSetting('musicVolume', val, true)}
            />
            <SettingsToggle 
              icon={Volume2} title="Звукові ефекти" isDark={isDark}
              value={settings.sfx} 
              onValueChange={(val: boolean) => updateSetting('sfx', val)}
              hasSlider={true} 
              sliderValue={settings.sfxVolume} 
              onSliderChange={(val: number) => updateSetting('sfxVolume', val, true)}
            />
            <SettingsToggle 
              icon={Sparkles} title="Анімації та візуал" isDark={isDark}
              value={settings.animations} 
              onValueChange={(val: boolean) => updateSetting('animations', val)}
            />
          </View>

          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>ПРИВАТНІСТЬ</Text>
          <View style={s.section}>
            <SettingsToggle 
              icon={Ghost} title="Глобальний режим анонімності" isDark={isDark}
              value={settings.anonymousMode} 
              onValueChange={(val: boolean) => updateSetting('anonymousMode', val)}
            />
            <Text style={[Typography.nav, { color: c.textMuted, marginTop: 4, paddingHorizontal: 4 }]}>
              Всі нові пости у стрічці будуть за замовчуванням публікуватися без імені.
            </Text>
          </View>

          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>ІНФОРМАЦІЯ</Text>
          <View style={s.section}>
            <SettingsLink icon={MessageCircleQuestion} title="Написати в підтримку" isDark={isDark} animationsEnabled={settings.animations} onPress={() => setSupportModalVisible(true)} />
            <SettingsLink icon={ShieldCheck} title="Умови та Політика" isDark={isDark} animationsEnabled={settings.animations} onPress={() => {
    // router.push автоматично знайде файл app/legal.tsx
    router.push({
      pathname: '/legal', 
      params: { theme: theme } // передаємо поточну тему
    });
  }} />
          </View>
          <View style={s.footerContainer}>
            <Image source={require('@/assets/images/team_icon.png')} style={s.footerIcon} />
            <Text style={[Typography.muted, { color: c.textMuted, opacity: 0.6, marginTop: 8 }]}>
              Розроблено командою AuMentem
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={isSupportModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(themeKey, 'soft')]}>
            
            <View style={s.modalHeader}>
              <Text style={[Typography.titleLg, { color: c.textMain }]}>Служба підтримки</Text>
              <Pressable onPress={() => { playClickSound(); setSupportModalVisible(false); }} style={s.closeBtn}>
                <X color={c.textMuted} size={24} />
              </Pressable>
            </View>

            <Text style={[Typography.body, { color: c.textMuted, marginBottom: 16 }]}>
              Знайшли баг чи маєте ідею? Напишіть нам, і ми відповімо вам на email!
            </Text>
            <TextInput
              style={[s.textInput, { backgroundColor: c.background, color: c.textMain, borderColor: c.border }]}
              placeholder="Твоє повідомлення..."
              placeholderTextColor={c.textMuted}
              multiline
              textAlignVertical="top"
              value={supportMessage}
              onChangeText={setSupportMessage}
            />

            <Pressable 
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Надіслати повідомлення у підтримку"
              onPress={handleSupportSubmit}
              style={({ pressed }) => [s.submitBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}
            >
              <Send color="#FFF" size={20} />
              <Text style={[Typography.button, { color: '#FFF', marginLeft: 8 }]}>Надіслати</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={isPreviewModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <HomeBackground isDark={isDark} previewAmbientOrbsEnabled={settings.ambientOrbsEnabled ?? true} previewPetEnabled={settings.petEnabled ?? true} />
          
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: Spacing.screenX, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable 
              onPress={() => setPreviewModalVisible(false)}
              style={({ pressed }) => [
                { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
                pressed && { opacity: 0.7 }
              ]}
            >
              <X color="#FFF" size={24} />
            </Pressable>
          </SafeAreaView>
          
          <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '500' }}>Це фон головного екрану</Text>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1 },
  header: { flexDirection: 'row', paddingHorizontal: Spacing.screenX, paddingTop: 12, paddingBottom: 24 },
  iconBtn: { padding: 12, borderRadius: Radii.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { paddingHorizontal: Spacing.screenX, marginBottom: 24 },
  scrollView: { flex: 1, paddingHorizontal: Spacing.screenX },
  sectionTitle: { marginBottom: 8, marginLeft: 4, letterSpacing: 1, fontSize: 12 },
  section: { marginBottom: 32, gap: 8 },
  settingRow: { padding: 16, borderRadius: Radii.lg, borderWidth: 1 },
  footerContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginBottom: 8,
    opacity: 0.6,
  },
  iconBox: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.screenX },
  modalCard: { width: '100%', padding: 24, borderRadius: Radii.xl, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeBtn: { padding: 4 },
  textInput: { height: 120, borderWidth: 1, borderRadius: Radii.md, padding: 16, fontSize: 16, fontFamily: 'Nunito_600SemiBold', marginBottom: 24 },
  submitBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' }
});