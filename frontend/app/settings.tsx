import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, Switch, Platform, Alert, Pressable, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Music, Volume2, Sparkles, Ghost, MessageCircleQuestion, ShieldCheck, X, Send, Bell } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';

import { Colors, Typography, Radii, Spacing, Shadows } from '@/constants/theme';
import { playClickSound, stopAmbientSound, setAmbientVolume } from '@/utils/audio';
import { BASE_URL } from '@/constants/api';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SettingsLink = ({ icon: Icon, title, onPress, isDark }: any) => {
  const c = Colors[isDark ? 'dark' : 'light'];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => scale.value = withSpring(0.97)}
      onPressOut={() => scale.value = withSpring(1)}
      onPress={() => { playClickSound(); onPress(); }}
      style={[s.settingRow, { backgroundColor: c.cardBg, borderColor: c.border }, animatedStyle]}
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
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [settings, setSettings] = useState({
    music: true,
    musicVolume: 0.5,
    sfx: true,
    sfxVolume: 0.5,
    animations: true,
    notifications: true,
    anonymousMode: false,
  });

  const [isSupportModalVisible, setSupportModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

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
    setSettings(newSettings as any);
    
    try {
      await SecureStore.setItemAsync('userSettings', JSON.stringify(newSettings));
      
      if (!isSlider) {
        if (key === 'sfx' && value === false) {
          // Якщо вимкнули звуки — нічого не граємо
        } else {
          // Якщо ввімкнули звуки, або змінили інший тумблер — граємо звук
          playClickSound(); 
        }
      }

      if (key === 'music' && value === false) stopAmbientSound();
      
      if (key === 'musicVolume') {
        setAmbientVolume(value);
      }
    } catch (error) {}
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) return Alert.alert("Увага", "Напишіть повідомлення.");
    playClickSound();
    
    try {
      const token = await SecureStore.getItemAsync('userToken');
      await fetch(`${BASE_URL}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: supportMessage })
      });
      
      Alert.alert("Дякуємо!", "Твоє повідомлення надіслано в підтримку.");
      setSupportModalVisible(false);
      setSupportMessage('');
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося надіслати повідомлення.");
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://tvoj-sajt.com/privacy').catch(() => {
      Alert.alert("Політика", "Тут будуть розписані правила використання.");
    });
  };

  return (
    <ImageBackground source={require('@/assets/images/background.jpg')} style={s.container} resizeMode="cover">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable 
            onPress={() => { playClickSound(); router.back(); }}
            style={({ pressed }) => [s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }, pressed && { opacity: 0.7 }]}
          >
            <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={[Typography.titleXl, s.mainTitle, { color: c.textMain }]}>Налаштування</Text>

        <ScrollView style={s.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
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

          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>ПРИВАТНІСТЬ ТА СПОВІЩЕННЯ</Text>
          <View style={s.section}>
            <SettingsToggle 
              icon={Bell} title="Push-сповіщення" isDark={isDark}
              value={settings.notifications} 
              onValueChange={(val: boolean) => updateSetting('notifications', val)}
            />
            <SettingsToggle 
              icon={Ghost} title="Глобальний режим анонімності" isDark={isDark}
              value={settings.anonymousMode} 
              onValueChange={(val: boolean) => updateSetting('anonymousMode', val)}
            />
            <Text style={[Typography.nav, { color: c.textMuted, marginTop: 4, paddingHorizontal: 4 }]}>
              Всі нові пости у стрічці будуть публікуватися без імені.
            </Text>
          </View>

          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>ІНФОРМАЦІЯ</Text>
          <View style={s.section}>
            <SettingsLink icon={MessageCircleQuestion} title="Написати в підтримку" isDark={isDark} onPress={() => setSupportModalVisible(true)} />
            <SettingsLink icon={ShieldCheck} title="Умови та Політика" isDark={isDark} onPress={openPrivacyPolicy} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={isSupportModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: c.cardBg, borderColor: c.border }, Platform.OS === 'ios' ? sh.soft : { elevation: 10 }]}>
            <View style={s.modalHeader}>
              <Text style={[Typography.titleLg, { color: c.textMain }]}>Служба підтримки</Text>
              <Pressable onPress={() => { playClickSound(); setSupportModalVisible(false); }} style={s.closeBtn}>
                <X color={c.textMuted} size={24} />
              </Pressable>
            </View>
            <Text style={[Typography.body, { color: c.textMuted, marginBottom: 16 }]}>
              Знайшли баг чи маєте ідею? Напишіть нам!
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
              onPress={handleSupportSubmit}
              style={({ pressed }) => [s.submitBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}
            >
              <Send color="#FFF" size={20} />
              <Text style={[Typography.button, { color: '#FFF', marginLeft: 8 }]}>Надіслати</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1 },
  header: { flexDirection: 'row', paddingHorizontal: Spacing.screenX, paddingTop: 12, paddingBottom: 24 },
  iconBtn: { padding: 12, borderRadius: Radii.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { paddingHorizontal: Spacing.screenX, marginBottom: 24, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  scrollView: { flex: 1, paddingHorizontal: Spacing.screenX },
  sectionTitle: { marginBottom: 8, marginLeft: 4, letterSpacing: 1, fontSize: 12 },
  section: { marginBottom: 32, gap: 8 },
  settingRow: { padding: 16, borderRadius: Radii.lg, borderWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.screenX },
  modalCard: { width: '100%', padding: 24, borderRadius: Radii.xl, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeBtn: { padding: 4 },
  textInput: { height: 120, borderWidth: 1, borderRadius: Radii.md, padding: 16, fontSize: 16, fontFamily: 'Nunito_600SemiBold', marginBottom: 24 },
  submitBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' }
});