import React, { useState, useCallback, useEffect, useRef } from "react";

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  User,
  Settings,
  Moon,
  Sun,
  Sparkles,
  Map,
  MessageCircleHeart,
} from "lucide-react-native";
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

import { useRouter, useFocusEffect } from "expo-router";
import { runOnJS } from "react-native-reanimated";

import * as SecureStore from "expo-secure-store";

import { BASE_URL } from "@/constants/api";

import HobbiesModal from "@/components/HobbiesModal";

import { BarChart3 } from "lucide-react-native";

import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withRepeat,
  withSequence,
  cancelAnimation,
  useAnimatedReaction,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

import { playClickSound, playAmbientSound } from "@/utils/audio";

import { useAppSettings } from "@/hooks/useAppSettings";

import { useSinglePress } from "@/hooks/useSinglePress";

import { cardShadow } from "@/utils/shadowStyle";

import { shouldShowTrackerToday } from "@/utils/trackerApi";

const AmbientOrb = ({
  size,
  top,
  left,
  right,
  bottom,
  colors,
  durX,
  durY,
  durScale,
  durOpacity,
  animationsEnabled,
}: any) => {
  const floatX = useSharedValue(0);
  const floatY = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(0.1);

  useEffect(() => {
    if (animationsEnabled) {
      floatX.value = withRepeat(
        withSequence(
          withTiming(15, { duration: durX }),
          withTiming(-15, { duration: durX }),
        ),
        -1,
        true,
      );
      floatY.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: durY }),
          withTiming(15, { duration: durY }),
        ),
        -1,
        true,
      );
      scaleAnim.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: durScale }),
          withTiming(0.7, { duration: durScale }),
        ),
        -1,
        true,
      );
      opacityAnim.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: durOpacity }),
          withTiming(0.1, { duration: durOpacity }),
        ),
        -1,
        true,
      );
    } else {
      floatX.value = 0;
      floatY.value = 0;
      scaleAnim.value = 1;
      opacityAnim.value = 0.6;
    }
  }, [animationsEnabled]);

  const style = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [
      { translateX: floatX.value },
      { translateY: floatY.value },
      { scale: scaleAnim.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          top,
          left,
          right,
          bottom,
          zIndex: 0,
          borderRadius: size / 2,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

const CatPath =
  "M290.59 192c-20.18 0-106.82 1.98-162.59 85.95V192c0-52.94-43.06-96-96-96-17.67 0-32 14.33-32 32s14.33 32 32 32c17.64 0 32 14.36 32 32v256c0 35.3 28.7 64 64 64h176c8.84 0 16-7.16 16-16v-16c0-17.67-14.33-32-32-32h-32l128-96v144c0 8.84 7.16 16 16 16h32c8.84 0 16-7.16 16-16V289.86c-10.29 2.67-20.89 4.54-32 4.54-61.81 0-113.52-44.05-125.41-102.4zM448 96h-64l-64-64v134.4c0 53.02 42.98 96 96 96s96-42.98 96-96V32l-64 64zm-72 80c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16zm80 0c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16zm80 0c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z";
const DogPath =
  "M298.06,224,448,277.55V496a16,16,0,0,1-16,16H368a16,16,0,0,1-16-16V384H192V496a16,16,0,0,1-16,16H112a16,16,0,0,1-16-16V282.09C58.84,268.84,32,233.66,32,192a32,32,0,0,1,64,0,32.06,32.06,0,0,0,32,32ZM544,112v32a64,64,0,0,1-64,64H448v35.58L320,197.87V48c0-14.25,17.22-21.39,27.31-11.31L374.59,64h53.63c10.91,0,23.75,7.92,28.62,17.69L464,96h64A16,16,0,0,1,544,112Zm-112,0a16,16,0,1,0-16,16A16,16,0,0,0,432,112Z";
const BirdPath =
  "M544 32h-16.36C513.04 12.68 490.09 0 464 0c-44.18 0-80 35.82-80 80v20.98L12.09 393.57A30.216 30.216 0 0 0 0 417.74c0 22.46 23.64 37.07 43.73 27.03L165.27 384h96.49l44.41 120.1c2.27 6.23 9.15 9.44 15.38 7.17l22.55-8.21c6.23-2.27 9.44-9.15 7.17-15.38L312.94 384H352c1.91 0 3.76-.23 5.66-.29l44.51 120.38c2.27 6.23 9.15 9.44 15.38 7.17l22.55-8.21c6.23-2.27 9.44-9.15 7.17-15.38l-41.24-111.53C485.74 352.8 544 279.26 544 192v-80l96-16c0-35.35-42.98-64-96-64zm-80 72c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z";

const PetIcon = ({
  type,
  color,
  size,
}: {
  type: number;
  color: string;
  size: number;
}) => {
  const paths = [CatPath, DogPath, BirdPath];
  const viewBoxes = ["0 0 512 512", "0 0 576 512", "0 0 640 512"];
  return (
    <Svg width={size} height={size} viewBox={viewBoxes[type]}>
      <Path d={paths[type]} fill={color} />
    </Svg>
  );
};

const AnimatedSvgPet = ({ isDark }: { isDark: boolean }) => {
  const { width } = useWindowDimensions();
  const [petType, setPetType] = useState<number>(0);
  const [isSleeping, setIsSleeping] = useState(Math.random() > 0.5);

  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync("selectedPetType").then((val) => {
        if (val !== null) setPetType(Number(val));
      });
    }, []),
  );

  const translateX = useSharedValue(20);
  const translateY = useSharedValue(0);
  const scaleX = useSharedValue(-1);
  const scaleY = useSharedValue(1);

  const walkLeft = useCallback(() => {
    scaleX.value = -1;
    const dist = translateX.value - 20;
    const dur = Math.max(100, (dist / Math.max(1, width - 100)) * 12000);
    translateX.value = withTiming(20, { duration: dur }, (finished) => {
      if (finished) runOnJS(walkRight)();
    });
  }, [width]);

  const walkRight = useCallback(() => {
    scaleX.value = 1;
    const dist = width - 80 - translateX.value;
    const dur = Math.max(100, (dist / Math.max(1, width - 100)) * 12000);
    translateX.value = withTiming(width - 80, { duration: dur }, (finished) => {
      if (finished) runOnJS(walkLeft)();
    });
  }, [width, walkLeft]);

  // Remove the old animated reaction since we handle scaleX explicitly now!
  // (We don't need useAnimatedReaction anymore)

  useEffect(() => {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(scaleY);

    if (isSleeping) {
      scaleY.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
        true,
      );
    } else {
      scaleY.value = withTiming(1, { duration: 300 });

      // Start walking in the current direction
      if (scaleX.value === 1) walkRight();
      else walkLeft();

      translateY.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        true,
      );
    }
  }, [isSleeping, walkLeft, walkRight]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const c = Colors[isDark ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 85 + Math.max(insets.bottom, 20),
          left: 0,
          zIndex: 10,
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => {
          playClickSound();
          setIsSleeping((prev) => !prev);
        }}
      >
        <PetIcon type={petType} color={c.textMain} size={48} />
        {isSleeping && (
          <Text
            style={{
              position: "absolute",
              top: -15,
              right: -10,
              fontSize: 16,
              color: c.textMuted,
            }}
          >
            Zzz
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

import { Appearance } from "react-native";

export default function HomeScreen() {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === "dark");

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { animationsEnabled } = useAppSettings();

  const runOnce = useSinglePress();

  const [userProfile, setUserProfile] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [showHobbies, setShowHobbies] = useState(false);

  const trackerCheckInFlight = useRef(false);
  const trackerCheckedThisSession = useRef(false);

  const theme = isDark ? "dark" : "light";

  const c = Colors[theme];

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await SecureStore.getItemAsync("userTheme");

      if (savedTheme) setIsDark(savedTheme === "dark");
    };

    loadTheme();
  }, []);

  useEffect(() => {
    playAmbientSound(0, isDark);
  }, [isDark]);

  const navigateToTracker = useCallback(() => {
    router.push({ pathname: "/tracker", params: { theme } });
  }, [router, theme]);

  const maybeShowTracker = useCallback(
    async (token: string) => {
      if (trackerCheckInFlight.current || trackerCheckedThisSession.current)
        return;
      trackerCheckInFlight.current = true;
      try {
        const show = await shouldShowTrackerToday(token);
        if (show !== null) {
          trackerCheckedThisSession.current = true;
          if (show) setTimeout(navigateToTracker, 500);
        }
      } finally {
        trackerCheckInFlight.current = false;
      }
    },
    [navigateToTracker],
  );

  // const finishHobbiesFlow = useCallback(async () => {

  //   setShowHobbies(false);

  //   const token = await SecureStore.getItemAsync('userToken');

  //   if (token) await maybeShowTracker(token);

  // }, [maybeShowTracker]);

  const finishHobbiesFlow = useCallback(async () => {
    setShowHobbies(false);

    await SecureStore.setItemAsync("has_hobbies", "true");

    const token = await SecureStore.getItemAsync("userToken");
    if (token) await maybeShowTracker(token);
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

          const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();

            setUserProfile(data);

            // const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');
            // const savedHasHobbies = await SecureStore.getItemAsync('has_hobbies');
            // const hasHobbies = (data.hobbies && data.hobbies.length > 0) || savedHasHobbies === 'true';

            // if (isFirstLogin === 'true' || !hasHobbies) {
            //   setShowHobbies(true);
            //   if (isFirstLogin === 'true') await SecureStore.deleteItemAsync('isFirstLogin');
            // } else {
            //   await maybeShowTracker(token);
            // }
            const isFirstLogin = await SecureStore.getItemAsync("isFirstLogin");

            // ПОКАЗУЄМО ХОБІ ТІЛЬКИ ЯКЩО ЦЕ ПЕРШИЙ ВХІД
            if (isFirstLogin === "true") {
              setShowHobbies(true);
              // Одразу видаляємо прапорець, щоб модалка більше ніколи не з'являлася
              await SecureStore.deleteItemAsync("isFirstLogin");
            } else {
              // Якщо це звичайний логін — просто показуємо трекер настрою
              await maybeShowTracker(token);
            }
          } else {
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("currentUserId");
            await SecureStore.deleteItemAsync("has_hobbies");
            await SecureStore.deleteItemAsync("user_saved_hobbies");
            router.replace("/");
          }
        } catch {
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
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
    <AnimatedBackground isDark={isDark} themeKey={isDark ? "dark" : "light"}>
      {animationsEnabled && (
        <>
          <AmbientOrb
            size={45}
            top="15%"
            left={30}
            colors={
              isDark
                ? ["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0)"]
                : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0)"]
            }
            durX={12000}
            durY={10000}
            durScale={6000}
            durOpacity={5500}
            animationsEnabled={animationsEnabled}
          />
          <AmbientOrb
            size={55}
            top="35%"
            right={40}
            colors={
              isDark
                ? ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0)"]
                : ["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0)"]
            }
            durX={14000}
            durY={11000}
            durScale={7500}
            durOpacity={6500}
            animationsEnabled={animationsEnabled}
          />
          <AmbientOrb
            size={35}
            bottom="25%"
            left={60}
            colors={
              isDark
                ? ["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0)"]
                : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0)"]
            }
            durX={11000}
            durY={13000}
            durScale={5000}
            durOpacity={7000}
            animationsEnabled={animationsEnabled}
          />
          <AmbientOrb
            size={45}
            top="50%"
            left={20}
            colors={
              isDark
                ? ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0)"]
                : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0)"]
            }
            durX={13000}
            durY={9000}
            durScale={8000}
            durOpacity={6000}
            animationsEnabled={animationsEnabled}
          />
          <AmbientOrb
            size={70}
            bottom="15%"
            right={50}
            colors={
              isDark
                ? ["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0)"]
                : ["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0)"]
            }
            durX={15000}
            durY={12000}
            durScale={7000}
            durOpacity={8000}
            animationsEnabled={animationsEnabled}
          />

          {isDark && (
            <>
              <AmbientOrb
                size={40}
                top="10%"
                right={80}
                colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0)"]}
                durX={10000}
                durY={14000}
                durScale={6500}
                durOpacity={5000}
                animationsEnabled={animationsEnabled}
              />
              <AmbientOrb
                size={65}
                bottom="40%"
                right={20}
                colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0)"]}
                durX={16000}
                durY={9000}
                durScale={5500}
                durOpacity={7500}
                animationsEnabled={animationsEnabled}
              />
              <AmbientOrb
                size={30}
                top="70%"
                left={40}
                colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0)"]}
                durX={12000}
                durY={15000}
                durScale={8000}
                durOpacity={6500}
                animationsEnabled={animationsEnabled}
              />
            </>
          )}

          <AnimatedSvgPet isDark={isDark} />
        </>
      )}

      <View style={[s.content, { paddingTop: Math.max(insets.top + 16, 40) }]}>
        <View style={s.header}>
          <AnimatedCard
            animationsEnabled={animationsEnabled}
            style={s.userInfo}
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
                  {userProfile?.nickname || "Мандрівник"}
                </Text>
              )}
            </View>
          </AnimatedCard>

          <View style={s.headerRight}>
            <AnimatedCard
              animationsEnabled={animationsEnabled}
              onPress={toggleTheme}
              style={getIconBtnStyle()}
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
    </AnimatedBackground>
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
