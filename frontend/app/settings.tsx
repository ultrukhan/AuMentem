import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  ScrollView, 
  Switch, 
  Platform,
  Alert,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Music, 
  Volume2, 
  Sparkles, 
  Ghost, 
  MessageCircleQuestion, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Spacing, IconSizes } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Кнопка-посилання (для підтримки, політики тощо)
const SettingsLink = ({ icon: Icon, title, onPress, isDark }: any) => {
  const c = Colors[isDark ? 'dark' : 'light'];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      onPressIn={() => scale.value = withSpring(0.97, { damping: 15, stiffness: 200 })}
      onPressOut={() => scale.value = withSpring(1, { damping: 15, stiffness: 200 })}
      onPress={onPress}
      style={[s.settingRow, { backgroundColor: c.cardBg, borderColor: c.border }, animatedStyle]}
    >
      <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
        <Icon color={c.iconColor} size={20} strokeWidth={2} />
      </View>
      <Text style={[Typography.body, { color: c.textMain, flex: 1, marginLeft: 12 }]}>{title}</Text>
    </AnimatedPressable>
  );
};

// Перемикач (для музики, ефектів тощо)
const SettingsToggle = ({ icon: Icon, title, value, onValueChange, isDark }: any) => {
  const c = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[s.settingRow, { backgroundColor: c.cardBg, borderColor: c.border }]}>
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
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];

  // Стани налаштувань (за замовчуванням увімкнені)
  const [settings, setSettings] = useState({
    music: true,
    sfx: true,
    animations: true,
    anonymousMode: false,
  });

  // Завантажуємо збережені налаштування при старті
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await SecureStore.getItemAsync('userSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Помилка завантаження налаштувань:', error);
      }
    };
    loadSettings();
  }, []);

  // Зберігаємо налаштування при кожній зміні
  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await SecureStore.setItemAsync('userSettings', JSON.stringify(newSettings));
      
      // ТУТ МОЖНА ДОДАТИ ЛОГІКУ:
      // Якщо вимкнули музику (key === 'music' && !value) -> зупинити звук
      // Якщо увімкнули (key === 'music' && value) -> запустити звук
    } catch (error) {
      console.error('Помилка збереження:', error);
    }
  };

  const handleSupportPress = () => {
    Alert.alert("Підтримка", "Функція відправки повідомлення в підтримку з'явиться незабаром!");
  };

  const handlePolicyPress = () => {
    Alert.alert("Політика", "Тут буде текст політики конфіденційності.");
  };

  const handleFAQPress = () => {
    Alert.alert("FAQ", "Тут будуть часті питання.");
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/background.jpg')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        
        {/* Хедер */}
        <View style={s.header}>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: c.cardBg, borderColor: c.border },
              pressed && { opacity: 0.7 }
            ]}
          >
            <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={[Typography.titleXl, s.mainTitle, { color: c.textMain }]}>Налаштування</Text>

        <ScrollView 
          style={s.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* СЕКЦІЯ: Звук та Візуал */}
          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>
            ВРАЖЕННЯ ВІД ДОДАТКУ
          </Text>
          <View style={s.section}>
            <SettingsToggle 
              icon={Music} 
              title="Фонова музика" 
              value={settings.music} 
              onValueChange={(val: boolean) => updateSetting('music', val)} 
              isDark={isDark} 
            />
            <SettingsToggle 
              icon={Volume2} 
              title="Звукові ефекти" 
              value={settings.sfx} 
              onValueChange={(val: boolean) => updateSetting('sfx', val)} 
              isDark={isDark} 
            />
            <SettingsToggle 
              icon={Sparkles} 
              title="Анімації та конфеті" 
              value={settings.animations} 
              onValueChange={(val: boolean) => updateSetting('animations', val)} 
              isDark={isDark} 
            />
          </View>

          {/* СЕКЦІЯ: Приватність */}
          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>
            ПРИВАТНІСТЬ
          </Text>
          <View style={s.section}>
            <SettingsToggle 
              icon={Ghost} 
              title="Глобальний режим анонімності" 
              value={settings.anonymousMode} 
              onValueChange={(val: boolean) => updateSetting('anonymousMode', val)} 
              isDark={isDark} 
            />
            <Text style={[Typography.nav, { color: c.textMuted, marginTop: 8, paddingHorizontal: 4 }]}>
              Якщо увімкнено, всі твої нові пости у стрічці будуть публікуватися без імені за замовчуванням.
            </Text>
          </View>

          {/* СЕКЦІЯ: Інформація */}
          <Text style={[Typography.muted, s.sectionTitle, { color: c.textMuted }]}>
            ІНФОРМАЦІЯ
          </Text>
          <View style={s.section}>
            <SettingsLink 
              icon={MessageCircleQuestion} 
              title="Написати в підтримку" 
              onPress={handleSupportPress} 
              isDark={isDark} 
            />
            <SettingsLink 
              icon={ShieldCheck} 
              title="Політика конфіденційності" 
              onPress={handlePolicyPress} 
              isDark={isDark} 
            />
            <SettingsLink 
              icon={HelpCircle} 
              title="Часті питання (FAQ)" 
              onPress={handleFAQPress} 
              isDark={isDark} 
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

import { Pressable as NativePressable } from 'react-native';

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 12,
    paddingBottom: 24,
  },
  iconBtn: { 
    padding: 12, borderRadius: Radii.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' 
  },
  mainTitle: {
    paddingHorizontal: Spacing.screenX, marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  scrollView: { flex: 1, paddingHorizontal: Spacing.screenX },
  
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
    fontSize: 12,
  },
  section: {
    marginBottom: 32,
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});