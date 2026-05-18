import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Settings, Moon, Sun, Sparkles, Map, MessageCircleHeart, Clock, Activity } from 'lucide-react-native';
import BottomNav from '@/components/BottomNav'; 
import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/constants/api'; 
import HobbiesModal from '@/components/HobbiesModal';
import { BarChart3 } from 'lucide-react-native'; 

import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { playClickSound, playAmbientSound, stopAmbientSound } from '@/utils/audio';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedCard = ({ onPress, style, children, animationsEnabled }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        if (animationsEnabled) scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        if (animationsEnabled) scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      onPress={onPress}
      style={[style, animationsEnabled ? animatedStyle : null]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function HomeScreen() {
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHobbies, setShowHobbies] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];

  const backgroundImage = isDark 
    ? require('@/assets/images/background_dark.png') 
    : require('@/assets/images/background.png');

  useEffect(() => {
    playAmbientSound(0, isDark);
  }, [isDark]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(c.overlay, { duration: animationsEnabled ? 400 : 0 }),
    };
  }, [c.overlay, animationsEnabled]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const savedSettings = await SecureStore.getItemAsync('userSettings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setAnimationsEnabled(parsed.animations !== false);
          }

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

            const today = new Date().toISOString().split('T')[0];
            const lastTrackerDate = await SecureStore.getItemAsync('lastTrackerDate');
            
            if (lastTrackerDate !== today) {
              await SecureStore.setItemAsync('lastTrackerDate', today);
              setTimeout(() => {
                router.push({ pathname: '/tracker', params: { theme } });
              }, 500);
            }

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
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
      return () => {}; 
    }, [])
  );

  const getCardStyle = (isWide: boolean = false) => [
    isWide ? s.fullCard : s.halfCard,
    { backgroundColor: c.cardBg, borderColor: c.border },
    Platform.OS === 'ios' ? sh.soft : { elevation: 0 } 
  ];

  const getIconBtnStyle = () => [
    s.iconBtn, 
    { backgroundColor: c.cardBg, borderColor: c.border }, 
    Platform.OS === 'ios' ? sh.soft : { elevation: 0 }
  ];

  return (
    <ImageBackground source={backgroundImage} style={s.container} resizeMode="cover">
      <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]} />

      <View style={[s.content, { paddingTop: Math.max(insets.top + 16, 40) }]}>
        
        <View style={s.header}>
          <AnimatedCard 
            animationsEnabled={animationsEnabled}
            style={s.userInfo}
            onPress={() => {
              playClickSound();
              router.push({ pathname: '/profile', params: { theme } });
            }}
          >
            <View style={[s.avatarPlaceholder, { backgroundColor: c.cardBg, borderColor: c.border }, Platform.OS === 'ios' ? sh.soft : null]}>
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
          </AnimatedCard>

          <View style={s.headerRight}>
            <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                setIsDark(!isDark);
              }} 
              style={getIconBtnStyle()}
            >
              {isDark ? (
                <Sun color={c.textMain} size={20} strokeWidth={2} />
              ) : (
                <Moon color={c.textMain} size={20} strokeWidth={2} />
              )}
            </AnimatedCard>

            {/* <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                router.push({ pathname: '/tracker', params: { theme } });
              }} 
              style={getIconBtnStyle()}
            >
              <Activity color={c.textMain} size={20} strokeWidth={2} />
            </AnimatedCard> */}

            <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                router.push({ pathname: '/statsScreen', params: { theme } });
              }} 
              style={getIconBtnStyle()}
            >
              <BarChart3 color={c.textMain} size={20} strokeWidth={2} />
            </AnimatedCard>

            <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                router.push({ pathname: '/settings', params: { theme } });
              }} 
              style={getIconBtnStyle()}
            >
              <Settings color={c.textMain} size={20} strokeWidth={2} />
            </AnimatedCard>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.row}>
            <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                router.push({ pathname: '/quests', params: { theme } });
              }}                
              style={getCardStyle(false)}
            >
              <View style={[s.iconBox, { backgroundColor: c.iconBg }, Platform.OS === 'ios' ? sh.glow : { elevation: 0 }]}>
                <Sparkles color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />
              </View>
              <Text style={[Typography.titleMd, { color: c.textMain }]}>Квести</Text>
            </AnimatedCard>

            <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                router.push({ pathname: '/geoquests', params: { theme } });
              }}
              style={getCardStyle(false)}
            >
              <View style={[s.iconBox, { backgroundColor: c.iconBg }, Platform.OS === 'ios' ? sh.glow : { elevation: 0 }]}>
                <Map color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />
              </View>
              <Text style={[Typography.titleMd, { color: c.textMain }]}>Геоквести</Text>
            </AnimatedCard>
          </View>

          <AnimatedCard 
            animationsEnabled={animationsEnabled}
            onPress={() => {
              playClickSound();
              router.push({ pathname: '/feed', params: { theme } });
            }}
            style={getCardStyle(true)}
          >
            <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, Platform.OS === 'ios' ? sh.glow : { elevation: 0 }]}>
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
          </AnimatedCard>

          {/* <AnimatedCard 
            animationsEnabled={animationsEnabled}
            onPress={() => {
              playClickSound();
              router.push({ pathname: '/time-capsule', params: { theme } });
            }}
            style={getCardStyle(true)}
          >
            <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, Platform.OS === 'ios' ? sh.glow : { elevation: 0 }]}>
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
          </AnimatedCard> */}
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
});