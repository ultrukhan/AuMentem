import React, { useState, useCallback } from 'react';
import { 
  View, Text, Pressable, StyleSheet, ImageBackground, 
  SafeAreaView, Platform, ActivityIndicator 
} from 'react-native';
import { 
  User, Settings, Moon, Sun, 
  Sparkles, Map, MessageCircleHeart 
} from 'lucide-react-native';
import BottomNav from '@/components/BottomNav'; 
import { Colors, Typography, Radii, Shadows } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/constants/api'; 

export default function HomeScreen() {
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  
  // Стан для збереження даних користувача
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUserProfile(data); 
          } else {
            await SecureStore.deleteItemAsync('userToken');
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

  return (
    <ImageBackground 
      source={require('@/assets/images/background.jpg')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          
          <View style={s.header}>
            
            <View style={s.userInfo}>
              <View style={[s.avatarPlaceholder, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
                <User color={c.text} size={24} strokeWidth={2} />
              </View>
              <View>
                <Text style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}>
                  З поверненням,
                </Text>
                {isLoading ? (
                  <ActivityIndicator size="small" color={c.accent} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={[Typography.titleMd, { color: c.text }]}>
                    {userProfile?.nickname || 'Мандрівник'}
                  </Text>
                )}
              </View>
            </View>

            <View style={s.headerRight}>
              <Pressable 
                onPress={() => setIsDark(!isDark)} 
                style={({ pressed }) => [
                  s.iconBtn, 
                  { backgroundColor: c.card, borderColor: c.border }, 
                  sh.soft,
                  pressed && s.pressed
                ]}
              >
                {isDark ? (
                  <Sun color={c.text} size={24} strokeWidth={2} />
                ) : (
                  <Moon color={c.text} size={24} strokeWidth={2} />
                )}
              </Pressable>

              <Pressable 
                onPress={() => router.push('/profile')} 
                style={({ pressed }) => [
                s.iconBtn, 
                { backgroundColor: c.card, borderColor: c.border }, 
                sh.soft,
                pressed && s.pressed
              ]}>
                <Settings color={c.text} size={24} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <View style={s.grid}>
            
            <View style={s.row}>
              <Pressable 
                onPress={() => router.push({ pathname: '/quests', params: { theme: isDark ? 'dark' : 'light' } })}                
                style={({ pressed }) => [
                  s.halfCard, 
                  { backgroundColor: c.card, borderColor: c.border }, 
                  sh.soft,
                  pressed && s.pressed
              ]}>
                <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <Sparkles color={c.iconColor} size={32} strokeWidth={2} />
                </View>
                <Text style={[Typography.titleMd, { color: c.text }]}>Квести</Text>
              </Pressable>

              <Pressable 
                onPress={() => router.push({ pathname: '/geoquests', params: { theme: isDark ? 'dark' : 'light' } })}
                style={({ pressed }) => [
                s.halfCard, 
                { backgroundColor: c.card, borderColor: c.border }, 
                sh.soft,
                pressed && s.pressed
              ]}>
                <View style={[s.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <Map color={c.iconColor} size={32} strokeWidth={2} />
                </View>
                <Text style={[Typography.titleMd, { color: c.text }]}>Геоквести</Text>
              </Pressable>
            </View>

            <Pressable style={({ pressed }) => [
              s.fullCard, 
              { backgroundColor: c.card, borderColor: c.border }, 
              sh.soft,
              pressed && s.pressed
            ]}>
              <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, sh.glow]}>
                <MessageCircleHeart color={c.iconColor} size={28} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleLg, { color: c.text, marginBottom: 4 }]}>
                  Анонімна стрічка
                </Text>
                <Text style={[Typography.muted, { color: c.textMuted }]}>
                  Ділись почуттями безпечно
                </Text>
              </View>
            </Pressable>

          </View>

        </View>
      </SafeAreaView>

      <BottomNav />

    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? 40 : 0 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: 12 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 32 
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    padding: 12,
    borderRadius: Radii.full, 
    borderWidth: 1,
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 12 
  },
  iconBtn: { 
    padding: 12, 
    borderRadius: Radii.md, 
    borderWidth: 1 
  },
  grid: { gap: 16 },
  row: { flexDirection: 'row', gap: 16 },
  halfCard: { 
    flex: 1, 
    borderRadius: Radii.lg, 
    padding: 20, 
    alignItems: 'center', 
    borderWidth: 1 
  },
  fullCard: { 
    borderRadius: Radii.lg, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  iconBox: { 
    padding: 12, 
    borderRadius: Radii.md, 
    marginBottom: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  iconBoxRow: { 
    padding: 16, 
    borderRadius: Radii.md, 
    marginRight: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pressed: { 
    opacity: 0.85, 
    transform: [{ scale: 0.97 }] 
  }
});