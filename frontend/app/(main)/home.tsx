import React, { useState, useCallback } from 'react';
import { 
  View, Text, Pressable, StyleSheet, ImageBackground, 
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  User, Settings, Moon, Sun, 
  Sparkles, Map, MessageCircleHeart, Clock, Activity 
} from 'lucide-react-native';
import BottomNav from '@/components/BottomNav'; 
import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/constants/api'; 
import HobbiesModal from '@/components/HobbiesModal';

export default function HomeScreen() {
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Отримуємо безпечні зони телефону
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHobbies, setShowHobbies] = useState(false);
  
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          
          if (!token) {
            router.replace('/');
            return;
          }

          const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            setUserProfile(data); 

            const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');
            
            if (isFirstLogin === 'true') {
              setShowHobbies(true);
              await SecureStore.deleteItemAsync('isFirstLogin');
            }
          } else {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('has_hobbies');
            await SecureStore.deleteItemAsync('user_saved_hobbies');
            router.replace('/');
          }
        } catch (error) {
          console.error("Помилка завантаження профілю:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();

      return () => {}; 
    }, [])
  );

  const getCardStyle = (pressed: boolean, isWide: boolean = false) => [
    isWide ? s.fullCard : s.halfCard,
    { backgroundColor: c.cardBg, borderColor: c.border },
    sh.soft,
    pressed && s.pressed
  ];

  const getIconBtnStyle = (pressed: boolean) => [
    s.iconBtn, 
    { backgroundColor: c.cardBg, borderColor: c.border }, 
    sh.soft, 
    pressed && s.pressed
  ];

  return (
    <ImageBackground 
      source={require('@/assets/images/background.jpg')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      {/* Головний контейнер з динамічним відступом зверху */}
      <View style={[s.content, { paddingTop: Math.max(insets.top + 16, 40) }]}>
        
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.userInfo}>
            <View style={[s.avatarPlaceholder, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <User color={c.textMain} size={IconSizes.sm} strokeWidth={2} />
            </View>
            <View>
              <Text style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}>
                З поверненням,
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={c.accent} style={{ alignSelf: 'flex-start' }} />
              ) : (
                <Text style={[Typography.titleMd, { color: c.textMain }]}>
                  {userProfile?.nickname || 'Мандрівник'}
                </Text>
              )}
            </View>
          </View>

          <View style={s.headerRight}>
            <Pressable 
              onPress={() => setIsDark(!isDark)} 
              style={({ pressed }) => getIconBtnStyle(pressed)}
            >
              {isDark ? (
                <Sun color={c.textMain} size={20} strokeWidth={2} />
              ) : (
                <Moon color={c.textMain} size={20} strokeWidth={2} />
              )}
            </Pressable>

            <Pressable 
              onPress={() => router.push({ pathname: '/tracker', params: { theme } })}
              style={({ pressed }) => getIconBtnStyle(pressed)}
            >
              <Activity color={c.textMain} size={20} strokeWidth={2} />
            </Pressable>

            <Pressable 
              onPress={() => router.push({ pathname: '/profile', params: { theme } })}
              style={({ pressed }) => getIconBtnStyle(pressed)}
            >
              <Settings color={c.textMain} size={20} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* GRID */}
        <View style={s.grid}>
          
          <View style={s.row}>
            <Pressable 
              onPress={() => router.push({ pathname: '/quests', params: { theme } })}                
              style={({ pressed }) => getCardStyle(pressed, false)}
            >
              <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                <Sparkles color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />
              </View>
              <Text style={[Typography.titleMd, { color: c.textMain }]}>Квести</Text>
            </Pressable>

            <Pressable 
              onPress={() => router.push({ pathname: '/geoquests', params: { theme } })}
              style={({ pressed }) => getCardStyle(pressed, false)}
            >
              <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                <Map color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />
              </View>
              <Text style={[Typography.titleMd, { color: c.textMain }]}>Геоквести</Text>
            </Pressable>
          </View>

          <Pressable 
            onPress={() => router.push({ pathname: '/feed', params: { theme } })}
            style={({ pressed }) => getCardStyle(pressed, true)}
          >
            <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, sh.glow]}>
              <MessageCircleHeart color={c.iconColor} size={IconSizes.md} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleLg, { color: c.textMain, marginBottom: 4 }]}>
                Анонімна стрічка
              </Text>
              <Text style={[Typography.muted, { color: c.textMuted }]}>
                Ділись почуттями безпечно
              </Text>
            </View>
          </Pressable>

          <Pressable 
            onPress={() => router.push({ pathname: '/time-capsule', params: { theme } })}
            style={({ pressed }) => getCardStyle(pressed, true)}
          >
            <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, sh.glow]}>
              <Clock color={c.iconColor} size={IconSizes.md} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.titleLg, { color: c.textMain, marginBottom: 4 }]}>
                Капсула часу
              </Text>
              <Text style={[Typography.muted, { color: c.textMuted }]}>
                Напиши собі в майбутнє
              </Text>
            </View>
          </Pressable>

        </View>
      </View>

      <BottomNav isDark={isDark} />
      
      <HobbiesModal 
        visible={showHobbies} 
        isDark={isDark}
        onSuccess={() => setShowHobbies(false)} 
        onClose={() => setShowHobbies(false)} 
      />
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  // Прибрали flex: 1 з content, щоб елементи не "розповзалися" по екрану
  content: { paddingHorizontal: Spacing.screenX },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.headMb },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { padding: Spacing.iconP, borderRadius: Radii.full, borderWidth: 1 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 10, borderRadius: Radii.md, borderWidth: 1 },
  grid: { gap: Spacing.gap },
  row: { flexDirection: 'row', gap: Spacing.gap },
  halfCard: { flex: 1, borderRadius: Radii.lg, padding: Spacing.cardP, alignItems: 'center', borderWidth: 1 },
  fullCard: { borderRadius: Radii.lg, padding: Spacing.cardP, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  iconBox: { padding: Spacing.iconP, borderRadius: Radii.md, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  iconBoxRow: { padding: Spacing.iconWideP, borderRadius: Radii.md, marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] }
});