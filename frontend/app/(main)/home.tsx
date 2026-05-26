import React, { useState, useCallback, useEffect, useRef } from "react";

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
 Appearance } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bell, Heart, Leaf, MapPin, Sparkles, BookOpen, Star, Zap, Coffee, Settings, User, Trophy, BarChart3, Clock, Flame, ChevronRight, Moon, Sun, Volume2, VolumeX, History, Camera, Activity, Calendar, Map, MessageCircleHeart } from "lucide-react-native";
import NetInfo from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from "@expo/vector-icons";

import BottomNav from "@/components/BottomNav";

import AnimatedBackground from "@/components/AnimatedBackground";

import AnimatedCard from "@/components/AnimatedCard";

import {
  Colors,
  Typography,
  Radii,
  Spacing,
  IconSizes,
} from "@/constants/theme";

import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import Animated, { runOnJS ,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withRepeat,
  withSequence,
  cancelAnimation,
  useAnimatedReaction,
} from "react-native-reanimated";

import * as SecureStore from "expo-secure-store";

import { BASE_URL } from "@/constants/api";

import HobbiesModal from "@/components/HobbiesModal";




import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

import { playClickSound, playAmbientSound } from "@/utils/audio";

import { useAppSettings } from "@/hooks/useAppSettings";
import { useSinglePress } from "@/hooks/useSinglePress";
import { hasLoadedData, markDataLoaded } from "@/utils/sessionCache";

import { cardShadow } from "@/utils/shadowStyle";

import { shouldShowTrackerToday } from "@/utils/trackerApi";

import HomeBackground from "@/components/HomeBackground";


export default function HomeScreen() {
  const { theme: paramTheme } = useLocalSearchParams();
  const [isDark, setIsDark] = useState(paramTheme ? paramTheme === 'dark' : (Appearance.getColorScheme() === "dark"));

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { animationsEnabled } = useAppSettings();

  const runOnce = useSinglePress();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [cachedNickname, setCachedNickname] = useState<string>("");
  const [isLoading, setIsLoading] = useState(!hasLoadedData('home'));

  const [showHobbies, setShowHobbies] = useState(false);

  const trackerCheckInFlight = useRef(false);
  const trackerCheckedThisSession = useRef(false);

  const theme = isDark ? "dark" : "light";

  const c = Colors[theme];

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await SecureStore.getItemAsync("userTheme");
      if (savedTheme) {
        setIsDark(savedTheme === "dark");
        router.setParams({ theme: savedTheme });
      }
    };
    if (!paramTheme) {
      loadTheme();
    }
  }, [paramTheme]);

  useEffect(() => {
    playAmbientSound(0, isDark);
  }, [isDark]);

  const navigateToTracker = useCallback(() => {
    router.push({ pathname: "/tracker", params: { theme } });
  }, [router, theme]);


  const maybeShowTracker = useCallback(
    async (token: string, userId: string) => {
      if (trackerCheckInFlight.current || trackerCheckedThisSession.current)
        return;

      trackerCheckInFlight.current = true;
      try {
        const todayStr = new Date().toDateString();
        const lastSeen = await SecureStore.getItemAsync(`last_tracker_date_${userId}`);
        if (lastSeen === todayStr) {
          trackerCheckedThisSession.current = true;
          return;
        }

        const show = await shouldShowTrackerToday(token);
        if (show) {
          trackerCheckedThisSession.current = true;
          await SecureStore.setItemAsync(`last_tracker_date_${userId}`, todayStr);
          router.push({
            pathname: "/tracker",
            params: { theme, canSkip: "true" }, 
          });
        }
      } finally {
        trackerCheckInFlight.current = false;
      }
    },
    [router, theme],
  );


  const finishHobbiesFlow = useCallback(async () => {
    setShowHobbies(false);
    const token = await SecureStore.getItemAsync("userToken");
    const userId = await SecureStore.getItemAsync("currentUserId");
    if (token && userId) {
      await maybeShowTracker(token, userId);
    }
  }, [maybeShowTracker]);
  const toggleTheme = async () => {
    playClickSound();

    const newTheme = !isDark;

    setIsDark(newTheme);

    await SecureStore.setItemAsync("userTheme", newTheme ? "dark" : "light");
  };


  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");
          if (!token) {
            router.replace("/");
            return;
          }

          if (hasLoadedData('home')) {
            const nick = await SecureStore.getItemAsync("cachedNickname");
            if (nick) setCachedNickname(nick);
          }

          const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
            setCachedNickname(data.nickname);
            await SecureStore.setItemAsync("cachedNickname", data.nickname);
            markDataLoaded('home');

            // Зберігаємо ID для інших екранів
            const userId = String(data.id);
            await SecureStore.setItemAsync("currentUserId", userId);

            // Check if is_onboarding_completed is false, but strictly enforce ONCE locally
            const localHobbiesFlag = await SecureStore.getItemAsync(`hobbies_shown_${userId}`);
            if (data.is_onboarding_completed === false && !localHobbiesFlag) {
              setShowHobbies(true);
              await SecureStore.setItemAsync(`hobbies_shown_${userId}`, "true");
            } else {
              await maybeShowTracker(token, userId);
            }
          } else if (response.status === 401) {
            // Якщо токен протух
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("currentUserId");
            router.replace("/");
          }
        } catch {
          // Ігноруємо помилки мережі, щоб додаток не крашився
        } finally {
          setIsLoading(false);
        }
      };

      loadData();

      const unsubscribe = NetInfo.addEventListener(state => {
        if (state.isConnected) {
          loadData();
        }
      });
      
      SecureStore.getItemAsync("cachedNickname").then(name => {
        if (name) setCachedNickname(name);
      });

      return () => {
        unsubscribe();
      };
    }, [maybeShowTracker, router]),
  );

  const getCardStyle = (isWide = false) => [
    isWide ? s.fullCard : s.halfCard,

    { backgroundColor: c.cardBg, borderColor: c.border },

    cardShadow(theme, "soft"),
  ];

  const getIconBtnStyle = () => [
    s.iconBtn,

    { backgroundColor: c.cardBg, borderColor: c.border },

    cardShadow(theme, "soft"),
  ];

  return (
    <HomeBackground isDark={isDark}>
      <View style={[s.content, { paddingTop: Math.max(insets.top + 16, 40) }]}>
        <View style={s.header}>
          <AnimatedCard
            animationsEnabled={animationsEnabled}
            style={s.userInfo}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Перейти до профілю користувача"
            onPress={() =>
              runOnce(() => {
                playClickSound();

                router.push({ pathname: "/profile", params: { theme } });
              })
            }
          >
            <View
              style={[
                s.avatarPlaceholder,
                { backgroundColor: c.cardBg, borderColor: c.border },
                cardShadow(theme, "soft"),
              ]}
            >
              <User color={c.textMain} size={IconSizes.sm} strokeWidth={2} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}
                numberOfLines={1}
              >
                З поверненням,
              </Text>

              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={c.accent}
                  style={{ alignSelf: "flex-start" }}
                />
              ) : (
                <Text
                  style={[Typography.titleMd, { color: c.textMain }]}
                  numberOfLines={1}
                >
                  {userProfile?.nickname || cachedNickname || "Мандрівник"}
                </Text>
              )}
            </View>
          </AnimatedCard>

          <View style={s.headerRight}>
            <AnimatedCard
              animationsEnabled={animationsEnabled}
              onPress={toggleTheme}
              style={getIconBtnStyle()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"
              }
            >
              {isDark ? (
                <Sun color={c.textMain} size={20} strokeWidth={2} />
              ) : (
                <Moon color={c.textMain} size={20} strokeWidth={2} />
              )}
            </AnimatedCard>

            <AnimatedCard
              animationsEnabled={animationsEnabled}
              onPress={() =>
                runOnce(() => {
                  playClickSound();
                  router.push({ pathname: "/statsScreen", params: { theme } });
                })
              }
              style={getIconBtnStyle()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Відкрити статистику"
            >
              <BarChart3 color={c.textMain} size={20} strokeWidth={2} />
            </AnimatedCard>

            <AnimatedCard
              animationsEnabled={animationsEnabled}
              onPress={() =>
                runOnce(() => {
                  playClickSound();

                  router.push({ pathname: "/settings", params: { theme } });
                })
              }
              style={getIconBtnStyle()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Відкрити налаштування"
            >
              <Settings color={c.textMain} size={20} strokeWidth={2} />
            </AnimatedCard>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.row}>
            <AnimatedCard
              animationsEnabled={animationsEnabled}
              onPress={() =>
                runOnce(() => {
                  playClickSound();
                  router.push({ pathname: "/quests", params: { theme } });
                })
              }
              style={getCardStyle(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Відкрити квести"
            >
              <View
                style={[
                  s.iconBox,
                  { backgroundColor: c.iconBg },
                  cardShadow(theme, "glow"),
                ]}
              >
                <Sparkles
                  color={c.iconColor}
                  size={IconSizes.lg}
                  strokeWidth={2}
                />
              </View>
              <Text
                style={[Typography.titleMd, { color: c.textMain }]}
                numberOfLines={2}
              >
                Квести
              </Text>
            </AnimatedCard>

            <AnimatedCard
              animationsEnabled={animationsEnabled}
              onPress={() =>
                runOnce(() => {
                  playClickSound();
                  router.push({ pathname: "/geoquests", params: { theme } });
                })
              }
              style={getCardStyle(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Відкрити геоквести"
            >
              <View
                style={[
                  s.iconBox,
                  { backgroundColor: c.iconBg },
                  cardShadow(theme, "glow"),
                ]}
              >
                <Map color={c.iconColor} size={IconSizes.lg} strokeWidth={2} />
              </View>
              <Text
                style={[Typography.titleMd, { color: c.textMain }]}
                numberOfLines={2}
              >
                Геоквести
              </Text>
            </AnimatedCard>
          </View>

          <AnimatedCard
            animationsEnabled={animationsEnabled}
            onPress={() =>
              runOnce(() => {
                playClickSound();
                router.push({ pathname: "/feed", params: { theme } });
              })
            }
            style={getCardStyle(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Відкрити анонімну стрічку"
          >
            <View
              style={[
                s.iconBoxRow,
                { backgroundColor: c.iconBg },
                cardShadow(theme, "glow"),
              ]}
            >
              <MessageCircleHeart
                color={c.iconColor}
                size={IconSizes.md}
                strokeWidth={2}
              />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  Typography.titleLg,
                  { color: c.textMain, marginBottom: 4 },
                ]}
                numberOfLines={2}
              >
                Анонімна стрічка
              </Text>

              <Text
                style={[Typography.muted, { color: c.textMuted }]}
                numberOfLines={2}
              >
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
      />
    </HomeBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  content: { paddingHorizontal: Spacing.screenX },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.headMb,
    gap: 8,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },

  avatarPlaceholder: {
    padding: Spacing.iconP,
    borderRadius: Radii.full,
    borderWidth: 1,
  },

  headerRight: { flexDirection: "row", gap: 8, flexShrink: 0 },

  iconBtn: { padding: 10, borderRadius: Radii.md, borderWidth: 1 },

  grid: { gap: Spacing.gap },

  row: { flexDirection: "row", gap: Spacing.gap },

  halfCard: {
    flex: 1,
    borderRadius: Radii.lg,
    padding: Spacing.cardP,
    alignItems: "center",
    borderWidth: 1,
    minWidth: 0,
  },

  fullCard: {
    borderRadius: Radii.lg,
    padding: Spacing.cardP,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  iconBox: {
    padding: Spacing.iconP,
    borderRadius: Radii.md,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  iconBoxRow: {
    padding: Spacing.iconWideP,
    borderRadius: Radii.md,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
