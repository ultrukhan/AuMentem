import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  Share2,
  LogOut,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  Colors,
  Typography,
  Radii,
  Shadows,
  Spacing,
  IconSizes,
} from "@/constants/theme";
import { BASE_URL } from "@/constants/api";
import { playClickSound, stopAmbientSound } from "@/utils/audio";
import { useAppSettings } from "@/hooks/useAppSettings";
import FadeInView from "@/components/FadeInView";
import AnimatedCard from "@/components/AnimatedCard";

import HobbiesModal from "@/components/HobbiesModal";
import { hasLoadedData, markDataLoaded } from "@/utils/sessionCache";

export default function ProfileScreen() {
  const router = useRouter();

  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === "dark";
  const currentTheme = isDark ? "dark" : "light";
  const c = Colors[currentTheme];
  const sh = Shadows[currentTheme];
  const { animationsEnabled } = useAppSettings();

  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [completedQuests, setCompletedQuests] = useState(0);
  const [isSavingNick, setIsSavingNick] = useState(false);
  const [nickMessage, setNickMessage] = useState({ text: "", type: "" });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: "", type: "" });

  const [isLoading, setIsLoading] = useState(!hasLoadedData('profile'));
  const [showHobbiesModal, setShowHobbiesModal] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword);
  const [userHobbies, setUserHobbies] = useState<any[]>([]);
  const isNewPasswordValid =
    hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const fetchProfileData = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      const storedUserId = await SecureStore.getItemAsync("currentUserId");
      setUserId(storedUserId);

      const [profileRes, statsRes, hobbiesRes] = await Promise.all([
        fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/stats/my-weekly-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setNickname(data.nickname);
        setUserHobbies(data.hobbies || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        let totalQuests = 0;
        statsData.forEach((stat: any) => {
          totalQuests +=
            (stat.mini_quests_completed || 0) +
            (stat.geo_quests_completed || 0);
        });
        setCompletedQuests(totalQuests);
      }
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
      markDataLoaded('profile');
    }
  };
  useEffect(() => {
    fetchProfileData();
  }, []);
  const handleLogout = async () => {
    playClickSound();
    stopAmbientSound();
    try {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("currentUserId");

      await SecureStore.deleteItemAsync("isFirstLogin");
      await SecureStore.deleteItemAsync("lastCookieDate");
      await SecureStore.deleteItemAsync("lastCookieText");
      await SecureStore.deleteItemAsync("lastNotificationDate");
      await SecureStore.deleteItemAsync("selectedPetType");
      import('@/utils/sessionCache').then(({ clearSessionCache }) => clearSessionCache());

      router.replace({ pathname: "/", params: { theme: currentTheme } });
    } catch (error) {
      console.error("Помилка при виході:", error);
    }
  };

  const handleUpdateNickname = async () => {
    playClickSound();
    if (!nickname.trim()) {
      setNickMessage({ text: "Нікнейм не може бути порожнім", type: "error" });
      return;
    }

    setIsSavingNick(true);
    setNickMessage({ text: "", type: "" });

    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(`${BASE_URL}/app_user/update_nick`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: nickname }),
      });

      if (response.ok) {
        setNickMessage({
          text: "Нікнейм успішно оновлено! 🎉",
          type: "success",
        });
      } else {
        const errorData = await response.json();
        setNickMessage({
          text: errorData.detail || "Помилка оновлення",
          type: "error",
        });
      }
    } catch (error) {
      setNickMessage({ text: "Помилка з'єднання з сервером", type: "error" });
    } finally {
      setIsSavingNick(false);
    }
  };

  const handleChangePassword = async () => {
    playClickSound();
    if (!oldPassword || !isNewPasswordValid) return;

    setIsChangingPwd(true);
    setPwdMessage({ text: "", type: "" });

    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(`${BASE_URL}/app_user/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setPwdMessage({ text: "Пароль успішно змінено! 🔒", type: "success" });
        setOldPassword("");
        setNewPassword("");
        setShowPassword(false);
      } else {
        const errorData = await response.json();
        setPwdMessage({
          text: errorData.detail || "Помилка зміни пароля",
          type: "error",
        });
      }
    } catch (error) {
      setPwdMessage({ text: "Помилка з'єднання з сервером", type: "error" });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleShareApp = async () => {
    playClickSound();
    try {
      const shareMessage =
        completedQuests > 0
          ? `Привіт! Це ${nickname} 👋 Я прокачую своє ментальне здоров'я в AuMentem і маю вже ${completedQuests} виконаних квестів! 🌟 Долучайся, давай покращувати себе разом: https://expo.dev/artifacts/eas/e5GqyHQ9RHF8TxBckF5ZQ.apk 🚀`
          : `Привіт! Це ${nickname} 👋 Я починаю свій шлях в AuMentem — крутому додатку для ментального здоров'я та цікавих квестів! 🌟 Приєднуйся до мене: https://expo.dev/artifacts/eas/e5GqyHQ9RHF8TxBckF5ZQ.apk 🚀`;

      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("Помилка при шерингу", error);
    }
  };

  const RequirementItem = ({
    text,
    isValid,
  }: {
    text: string;
    isValid: boolean;
  }) => (
    <View style={s.requirementRow}>
      {isValid ? (
        <CheckCircle2 color="#34C759" size={16} />
      ) : (
        <Circle color={c.textMuted} size={16} />
      )}
      <Text
        style={[
          s.requirementText,
          { color: isValid ? c.textMain : c.textMuted },
        ]}
      >
        {text}
      </Text>
    </View>
  );
  const handleHobbiesUpdate = (updatedHobbies: any[]) => {
    setUserHobbies(updatedHobbies);
  };
  const handleHobbiesSuccess = async () => {
    setShowHobbiesModal(false);

    const token = await SecureStore.getItemAsync("userToken");
    if (token) {
      const profileRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserHobbies(data.hobbies || []);
      }
    }
  };

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: c.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.header}>
          <Pressable
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          >
            <ArrowLeft color={c.textMain} size={IconSizes.sm} />
          </Pressable>
          <Text
            style={[
              Typography.titleLg,
              {
                color: c.textMain,
                flex: 1,
                textAlign: "center",
                marginRight: 40,
              },
            ]}
          >
            Мій профіль
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={c.accent}
            style={{ marginTop: 50 }}
          />
        ) : (
          <FadeInView animationsEnabled={animationsEnabled} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
            >
              {/* КАРТКА 1: ОСОБИСТІ ДАНІ */}
              <View
                style={[
                  s.card,
                  { backgroundColor: c.cardBg, borderColor: c.border },
                  sh.soft,
                ]}
              >
                <Text
                  style={[
                    Typography.titleMd,
                    { color: c.textMain, marginBottom: 12 },
                  ]}
                >
                  Особисті дані
                </Text>

                <View
                  style={[s.inputWrapper, { backgroundColor: c.background }]}
                >
                  <User color={c.textMuted} size={20} />
                  <TextInput
                    style={[s.input, { color: c.textMain }]}
                    placeholder="Введіть новий нікнейм"
                    placeholderTextColor={c.textMuted}
                    value={nickname}
                    onChangeText={(text) => {
                      setNickname(text);
                      if (nickMessage.text)
                        setNickMessage({ text: "", type: "" });
                    }}
                  />
                </View>

                {nickMessage.text ? (
                  <View
                    style={[
                      s.messageBox,
                      {
                        backgroundColor:
                          nickMessage.type === "success"
                            ? "#34C75920"
                            : "#FF3B3020",
                      },
                    ]}
                  >
                    {nickMessage.type === "success" ? (
                      <Check color="#34C759" size={18} />
                    ) : (
                      <AlertCircle color="#FF3B30" size={18} />
                    )}
                    <Text
                      style={[
                        s.messageText,
                        {
                          color:
                            nickMessage.type === "success"
                              ? "#34C759"
                              : "#FF3B30",
                        },
                      ]}
                    >
                      {nickMessage.text}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    s.primaryBtn,
                    { backgroundColor: c.accent, marginTop: 16 },
                    pressed && s.pressed,
                    isSavingNick && { opacity: 0.7 },
                  ]}
                  onPress={handleUpdateNickname}
                  disabled={isSavingNick}
                >
                  {isSavingNick ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={s.primaryBtnText}>Оновити нікнейм</Text>
                  )}
                </Pressable>
              </View>

              {/* КАРТКА 2: БЕЗПЕКА (ЗМІНА ПАРОЛЯ) */}
              <View
                style={[
                  s.card,
                  { backgroundColor: c.cardBg, borderColor: c.border },
                  sh.soft,
                ]}
              >
                <Text
                  style={[
                    Typography.titleMd,
                    { color: c.textMain, marginBottom: 12 },
                  ]}
                >
                  Безпека
                </Text>

                {/* ПОТОЧНИЙ ПАРОЛЬ */}
                <View
                  style={[
                    s.inputWrapper,
                    { backgroundColor: c.background, marginBottom: 12 },
                  ]}
                >
                  <Lock color={c.textMuted} size={20} />

                  <View
                    style={{
                      flex: 1,
                      position: "relative",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <TextInput
                      style={[
                        s.input,
                        { color: c.textMain }
                      ]}
                      placeholder="Поточний пароль"
                      placeholderTextColor={c.textMuted}
                      value={oldPassword}
                      onChangeText={(t) => {
                        setOldPassword(t);
                        if (pwdMessage.text)
                          setPwdMessage({ text: "", type: "" });
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      secureTextEntry={!showPassword}
                      selectionColor={c.accent}
                      cursorColor={c.accent}
                    />
                  </View>

                  <Pressable
                    onPress={() => {
                      playClickSound();
                      setShowPassword(!showPassword);
                    }}
                    style={{ padding: 4 }}
                  >
                    {showPassword ? (
                      <EyeOff color={c.textMuted} size={20} />
                    ) : (
                      <Eye color={c.textMuted} size={20} />
                    )}
                  </Pressable>
                </View>

                {/* НОВИЙ ПАРОЛЬ */}
                <View
                  style={[s.inputWrapper, { backgroundColor: c.background }]}
                >
                  <Key color={c.textMuted} size={20} />

                  <View
                    style={{
                      flex: 1,
                      position: "relative",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <TextInput
                      style={[
                        s.input,
                        { color: c.textMain }
                      ]}
                      placeholder="Новий пароль"
                      placeholderTextColor={c.textMuted}
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        if (pwdMessage.text)
                          setPwdMessage({ text: "", type: "" });
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      secureTextEntry={!showPassword}
                      selectionColor={c.accent}
                      cursorColor={c.accent}
                    />
                  </View>

                  <Pressable
                    onPress={() => {
                      playClickSound();
                      setShowPassword(!showPassword);
                    }}
                    style={{ padding: 4 }}
                  >
                    {showPassword ? (
                      <EyeOff color={c.textMuted} size={20} />
                    ) : (
                      <Eye color={c.textMuted} size={20} />
                    )}
                  </Pressable>
                </View>

                {newPassword.length > 0 && !isNewPasswordValid && (
                  <View style={s.requirementsContainer}>
                    <RequirementItem
                      text="Мінімум 8 символів"
                      isValid={hasMinLength}
                    />
                    <RequirementItem
                      text="Велика літера (A-Z)"
                      isValid={hasUpper}
                    />
                    <RequirementItem
                      text="Мала літера (a-z)"
                      isValid={hasLower}
                    />
                    <RequirementItem text="Цифра (0-9)" isValid={hasNumber} />
                    <RequirementItem
                      text="Спецсимвол (!@#$...)"
                      isValid={hasSpecial}
                    />
                  </View>
                )}

                {pwdMessage.text ? (
                  <View
                    style={[
                      s.messageBox,
                      {
                        backgroundColor:
                          pwdMessage.type === "success"
                            ? "#34C75920"
                            : "#FF3B3020",
                      },
                    ]}
                  >
                    {pwdMessage.type === "success" ? (
                      <Check color="#34C759" size={18} />
                    ) : (
                      <AlertCircle color="#FF3B30" size={18} />
                    )}
                    <Text
                      style={[
                        s.messageText,
                        {
                          color:
                            pwdMessage.type === "success"
                              ? "#34C759"
                              : "#FF3B30",
                        },
                      ]}
                    >
                      {pwdMessage.text}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    s.primaryBtn,
                    { backgroundColor: c.textMain, marginTop: 16 },
                    (!oldPassword || !isNewPasswordValid) && { opacity: 0.5 },
                    pressed && s.pressed,
                    isChangingPwd && { opacity: 0.7 },
                  ]}
                  onPress={handleChangePassword}
                  disabled={
                    isChangingPwd || !oldPassword || !isNewPasswordValid
                  }
                >
                  {isChangingPwd ? (
                    <ActivityIndicator color={c.background} />
                  ) : (
                    <Text style={[s.primaryBtnText, { color: c.background }]}>
                      Змінити пароль
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* КАРТКА 3: ІНШЕ */}
              <View
                style={[
                  s.card,
                  { backgroundColor: c.cardBg, borderColor: c.border },
                  sh.soft,
                ]}
              >
                <AnimatedCard
                  animationsEnabled={animationsEnabled}
                  onPress={() => setShowHobbiesModal(true)}
                  style={s.actionRow}
                >
                  <View
                    style={[
                      s.rowContainer,
                      { flex: 1, alignItems: "flex-start" },
                    ]}
                  >
                    <Sparkles
                      color={c.textMuted}
                      size={20}
                      style={{ marginTop: 2 }}
                    />

                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={[
                          Typography.body,
                          { color: c.textMain, fontWeight: "500" },
                        ]}
                      >
                        Твої інтереси
                      </Text>
                      {/* Прибираємо numberOfLines, текст буде переноситися на нові рядки */}
                      <Text
                        style={{
                          color: c.textMuted,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {userHobbies.length > 0
                          ? userHobbies.map((h) => h.name).join(", ")
                          : "Не обрано"}
                      </Text>
                    </View>
                  </View>

                  {/* Кнопка залишається збоку зверху */}
                  <Text
                    style={{
                      color: c.accent,
                      fontWeight: "600",
                      fontSize: 14,
                      marginLeft: 10,
                      marginTop: 2,
                    }}
                  >
                    Змінити
                  </Text>
                </AnimatedCard>

                {/* Роздільник із коректним динамічним кольором */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: c.border,
                    marginHorizontal: 12,
                  }}
                />

                <AnimatedCard
                  animationsEnabled={animationsEnabled}
                  onPress={handleShareApp}
                  style={s.actionRow}
                >
                  <View style={s.rowContainer}>
                    <Share2 color={c.textMuted} size={20} />
                    <Text
                      style={[
                        Typography.body,
                        { color: c.textMain, marginLeft: 12 },
                      ]}
                    >
                      Поділитися
                    </Text>
                  </View>
                </AnimatedCard>

                <View
                  style={{
                    height: 1,
                    backgroundColor: c.border,
                    marginHorizontal: 12,
                  }}
                />

                <AnimatedCard
                  animationsEnabled={animationsEnabled}
                  onPress={handleLogout}
                  style={s.actionRow}
                >
                  <View style={s.rowContainer}>
                    <LogOut color="#FF3B30" size={20} />
                    <Text
                      style={[
                        Typography.body,
                        { color: "#FF3B30", marginLeft: 12 },
                      ]}
                    >
                      Вийти
                    </Text>
                  </View>
                </AnimatedCard>
              </View>
            </ScrollView>
          </FadeInView>
        )}

        <HobbiesModal 
          visible={showHobbiesModal} 
          userId={userId}
          onSuccess={async () => {
            setShowHobbiesModal(false);
          }}
          onClose={() => setShowHobbiesModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenX,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: { padding: 8 },
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    borderRadius: Radii.lg,
    padding: Spacing.cardP,
    borderWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: "100%",
  },
  requirementsContainer: {
    marginTop: 12,
    gap: 6,
    paddingHorizontal: 4,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    ...Typography.body,
    fontSize: 13,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: Radii.md,
    marginTop: 12,
    gap: 8,
  },
  messageText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  primaryBtn: {
    height: 50,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    ...Typography.titleMd,
    color: "#FFF",
    fontSize: 15,
  },

  rowContainer: {
    flexDirection: "row",
    alignItems: "center", // було flex-start
    flex: 1,
  },

  miniDivider: {
    height: 1,
    width: "100%",
    opacity: 0.08, // замість жирної лінії
    marginVertical: 4,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12, // Додаємо внутрішній відступ
  },

  // Додайте цей стиль для контейнера з усіма кнопками
  actionsContainer: {
    gap: 0, // Прибираємо проміжки, якщо використовуємо роздільники
  },
});
