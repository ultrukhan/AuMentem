import React, { useState, useCallback, useEffect, useRef } from 'react';

import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { User, Settings, Moon, Sun, Sparkles, Map, MessageCircleHeart } from 'lucide-react-native';

import BottomNav from '@/components/BottomNav';

import AnimatedCard from '@/components/AnimatedCard';

import { Colors, Typography, Radii, Spacing, IconSizes } from '@/constants/theme';

import { useRouter, useFocusEffect } from 'expo-router';

import * as SecureStore from 'expo-secure-store';

import { BASE_URL } from '@/constants/api';

import HobbiesModal from '@/components/HobbiesModal';

import { BarChart3 } from 'lucide-react-native';

import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { playClickSound, playAmbientSound } from '@/utils/audio';

import { useAppSettings } from '@/hooks/useAppSettings';

import { useSinglePress } from '@/hooks/useSinglePress';

import { cardShadow } from '@/utils/shadowStyle';

import { shouldShowTrackerToday } from '@/utils/trackerApi';



export default function HomeScreen() {

  const [isDark, setIsDark] = useState(false);

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { animationsEnabled } = useAppSettings();

  const runOnce = useSinglePress();



  const [userProfile, setUserProfile] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [showHobbies, setShowHobbies] = useState(false);

  const trackerCheckInFlight = useRef(false);



  const theme = isDark ? 'dark' : 'light';

  const c = Colors[theme];



  const backgroundImage = isDark

    ? require('@/assets/images/background_dark.png')

    : require('@/assets/images/background.png');



  useEffect(() => {

    const loadTheme = async () => {

      const savedTheme = await SecureStore.getItemAsync('userTheme');

      if (savedTheme) setIsDark(savedTheme === 'dark');

    };

    loadTheme();

  }, []);



  useEffect(() => {

    playAmbientSound(0, isDark);

  }, [isDark]);



  const overlayAnimatedStyle = useAnimatedStyle(() => ({

    backgroundColor: withTiming(c.overlay, { duration: animationsEnabled ? 400 : 0 }),

  }), [c.overlay, animationsEnabled]);



  const navigateToTracker = useCallback(() => {

    router.push({ pathname: '/tracker', params: { theme } });

  }, [router, theme]);



  const maybeShowTracker = useCallback(

    async (token: string) => {

      if (trackerCheckInFlight.current) return;

      trackerCheckInFlight.current = true;

      try {

        const show = await shouldShowTrackerToday(token);

        if (show) setTimeout(navigateToTracker, 500);

      } finally {

        trackerCheckInFlight.current = false;

      }

    },

    [navigateToTracker]

  );



  const finishHobbiesFlow = useCallback(async () => {

    setShowHobbies(false);

    const token = await SecureStore.getItemAsync('userToken');

    if (token) await maybeShowTracker(token);

  }, [maybeShowTracker]);



  const toggleTheme = async () => {

    playClickSound();

    const newTheme = !isDark;

    setIsDark(newTheme);

    await SecureStore.setItemAsync('userTheme', newTheme ? 'dark' : 'light');

  };



  useFocusEffect(

    useCallback(() => {

      const loadData = async () => {

        try {

          const token = await SecureStore.getItemAsync('userToken');

          if (!token) {

            router.replace('/');

            return;

          }



          const response = await fetch(`${BASE_URL}/auth/me`, {

            headers: { Authorization: `Bearer ${token}` },

          });



          if (response.ok) {

            const data = await response.json();

            setUserProfile(data);



            const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');

            if (isFirstLogin === 'true') {

              setShowHobbies(true);

              await SecureStore.deleteItemAsync('isFirstLogin');

            } else {

              await maybeShowTracker(token);

            }

          } else {

            await SecureStore.deleteItemAsync('userToken');

            await SecureStore.deleteItemAsync('currentUserId');

            await SecureStore.deleteItemAsync('has_hobbies');

            await SecureStore.deleteItemAsync('user_saved_hobbies');

            router.replace('/');

          }

        } catch {

        } finally {

          setIsLoading(false);

        }

      };



      loadData();

    }, [maybeShowTracker, router])

  );



  const getCardStyle = (isWide = false) => [

    isWide ? s.fullCard : s.halfCard,

    { backgroundColor: c.cardBg, borderColor: c.border },

    cardShadow(theme, 'soft'),

  ];



  const getIconBtnStyle = () => [

    s.iconBtn,

    { backgroundColor: c.cardBg, borderColor: c.border },

    cardShadow(theme, 'soft'),

  ];



  return (

    <ImageBackground source={backgroundImage} style={s.container} resizeMode="cover">

      <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]} />



      <View style={[s.content, { paddingTop: Math.max(insets.top + 16, 40) }]}>

        <View style={s.header}>

          <AnimatedCard

            animationsEnabled={animationsEnabled}

            style={s.userInfo}

            onPress={() => runOnce(() => {

              playClickSound();

              router.push({ pathname: '/profile', params: { theme } });

            })}

          >

            <View style={[s.avatarPlaceholder, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(theme, 'soft')]}>

              <User color={c.textMain} size={IconSizes.sm} strokeWidth={2} />

            </View>

            <View style={{ flex: 1, minWidth: 0 }}>

              <Text style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]} numberOfLines={1}>

                З поверненням,

              </Text>

              {isLoading ? (

                <ActivityIndicator size="small" color={c.accent} style={{ alignSelf: 'flex-start' }} />

              ) : (

                <Text style={[Typography.titleMd, { color: c.textMain }]} numberOfLines={1}>

                  {userProfile?.nickname || 'Мандрівник'}

                </Text>

              )}

            </View>

          </AnimatedCard>



          <View style={s.headerRight}>

            <AnimatedCard animationsEnabled={animationsEnabled} onPress={toggleTheme} style={getIconBtnStyle()}>

              {isDark ? <Sun color={c.textMain} size={20} strokeWidth={2} /> : <Moon color={c.textMain} size={20} strokeWidth={2} />}

            </AnimatedCard>



            <AnimatedCard

              animationsEnabled={animationsEnabled}

              onPress={() => runOnce(() => {

                playClickSound();

                router.push({ pathname: '/statsScreen', params: { theme } });

              })}

              style={getIconBtnStyle()}

            >

              <BarChart3 color={c.textMain} size={20} strokeWidth={2} />

            </AnimatedCard>



            <AnimatedCard

              animationsEnabled={animationsEnabled}

              onPress={() => runOnce(() => {

                playClickSound();

                router.push({ pathname: '/settings', params: { theme } });

              })}

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

              onPress={() => runOnce(() => {

                playClickSound();

                router.push({ pathname: '/quests', params: { theme } });

              })}

              style={getCardStyle(false)}

            >

              <View style={[s.iconBox, { backgroundColor: c.iconBg }, cardShadow(theme, 'glow')]}>

                <Sparkles color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />

              </View>

              <Text style={[Typography.titleMd, { color: c.textMain }]} numberOfLines={2}>

                Квести

              </Text>

            </AnimatedCard>



            <AnimatedCard

              animationsEnabled={animationsEnabled}

              onPress={() => runOnce(() => {

                playClickSound();

                router.push({ pathname: '/geoquests', params: { theme } });

              })}

              style={getCardStyle(false)}

            >

              <View style={[s.iconBox, { backgroundColor: c.iconBg }, cardShadow(theme, 'glow')]}>

                <Map color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />

              </View>

              <Text style={[Typography.titleMd, { color: c.textMain }]} numberOfLines={2}>

                Геоквести

              </Text>

            </AnimatedCard>

          </View>



          <AnimatedCard

            animationsEnabled={animationsEnabled}

            onPress={() => runOnce(() => {

              playClickSound();

              router.push({ pathname: '/feed', params: { theme } });

            })}

            style={getCardStyle(true)}

          >

            <View style={[s.iconBoxRow, { backgroundColor: c.iconBg }, cardShadow(theme, 'glow')]}>

              <MessageCircleHeart color={c.iconColor} size={IconSizes.md} strokeWidth={2} />

            </View>

            <View style={{ flex: 1, minWidth: 0 }}>

              <Text style={[Typography.titleLg, { color: c.textMain, marginBottom: 4 }]} numberOfLines={2}>

                Анонімна стрічка

              </Text>

              <Text style={[Typography.muted, { color: c.textMuted }]} numberOfLines={2}>

                Ділись почуттями безпечно

              </Text>

            </View>

          </AnimatedCard>

        </View>

      </View>



      <BottomNav isDark={isDark} theme={theme} />



      <HobbiesModal

        visible={showHobbies}

        isDark={isDark}

        onSuccess={finishHobbiesFlow}

        onClose={finishHobbiesFlow}

      />

    </ImageBackground>

  );

}



const s = StyleSheet.create({

  container: { flex: 1 },

  content: { paddingHorizontal: Spacing.screenX },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.headMb, gap: 8 },

  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },

  avatarPlaceholder: { padding: Spacing.iconP, borderRadius: Radii.full, borderWidth: 1 },

  headerRight: { flexDirection: 'row', gap: 8, flexShrink: 0 },

  iconBtn: { padding: 10, borderRadius: Radii.md, borderWidth: 1 },

  grid: { gap: Spacing.gap },

  row: { flexDirection: 'row', gap: Spacing.gap },

  halfCard: { flex: 1, borderRadius: Radii.lg, padding: Spacing.cardP, alignItems: 'center', borderWidth: 1, minWidth: 0 },

  fullCard: { borderRadius: Radii.lg, padding: Spacing.cardP, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },

  iconBox: { padding: Spacing.iconP, borderRadius: Radii.md, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },

  iconBoxRow: { padding: Spacing.iconWideP, borderRadius: Radii.md, marginRight: 16, alignItems: 'center', justifyContent: 'center' },

});

