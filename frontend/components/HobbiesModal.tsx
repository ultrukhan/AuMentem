import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import {
  Sparkles,
  Check,
  Code,
  BookOpen,
  Bike,
  Camera,
  Palette,
  Coffee,
  Heart,
  Star,
  X,
  Hash,
  Activity,
  Smile,
  Library,
  Music,
  Gamepad2,
  Dumbbell,
  Leaf,
  Film,
  Brain,
  PawPrint,
  Car,
  PenTool,
  Globe,
  Calculator,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import ConfettiCannon from "react-native-confetti-cannon";
import { BASE_URL } from "@/constants/api";
import { Colors, Typography, Radii } from "@/constants/theme";
import { textLayout } from "@/utils/textLayout";
import { cardShadow } from "@/utils/shadowStyle";
import { parseApiError } from "@/utils/apiErrors";
import { playClickSound, playSuccessSound } from "@/utils/audio";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Hobby {
  id: number;
  name: string;
}

interface Props {
  visible: boolean;
  onSuccess: (updatedHobbies: any[]) => void;
  onClose?: () => void;
  isDark?: boolean;
  userId?: string | null;
}

const getHobbyIcon = (name: string, color: string, size: number) => {
  if (!name) return <Hash color={color} size={size} />;
  const lower = name.toLowerCase();
  if (
    lower.includes("йога") ||
    lower.includes("медит") ||
    lower.includes("yoga")
  )
    return <Star color={color} size={size} />;
  if (
    lower.includes("програм") ||
    lower.includes("код") ||
    lower.includes("code") ||
    lower.includes("program")
  )
    return <Code color={color} size={size} />;
  if (
    lower.includes("читан") ||
    lower.includes("книг") ||
    lower.includes("read") ||
    lower.includes("book")
  )
    return <BookOpen color={color} size={size} />;
  if (
    lower.includes("вело") ||
    lower.includes("bike") ||
    lower.includes("cycl")
  )
    return <Bike color={color} size={size} />;
  if (lower.includes("фото") || lower.includes("photo"))
    return <Camera color={color} size={size} />;
  if (
    lower.includes("малюв") ||
    lower.includes("мист") ||
    lower.includes("art") ||
    lower.includes("paint") ||
    lower.includes("draw")
  )
    return <Palette color={color} size={size} />;
  if (
    lower.includes("кулін") ||
    lower.includes("готув") ||
    lower.includes("cook") ||
    lower.includes("bake")
  )
    return <Coffee color={color} size={size} />;
  if (
    lower.includes("волонтер") ||
    lower.includes("допомог") ||
    lower.includes("volunteer")
  )
    return <Heart color={color} size={size} />;
  if (
    lower.includes("спорт") ||
    lower.includes("фітнес") ||
    lower.includes("sport") ||
    lower.includes("fitness")
  )
    return <Dumbbell color={color} size={size} />;
  if (lower.includes("музик") || lower.includes("music"))
    return <Music color={color} size={size} />;
  if (lower.includes("ігр") || lower.includes("game"))
    return <Gamepad2 color={color} size={size} />;
  if (lower.includes("істор") || lower.includes("history"))
    return <Library color={color} size={size} />;
  if (
    lower.includes("садівн") ||
    lower.includes("рослин") ||
    lower.includes("garden")
  )
    return <Leaf color={color} size={size} />;
  if (
    lower.includes("кіно") ||
    lower.includes("фільм") ||
    lower.includes("cinema") ||
    lower.includes("movie")
  )
    return <Film color={color} size={size} />;
  if (lower.includes("психол") || lower.includes("psychology"))
    return <Brain color={color} size={size} />;
  if (lower.includes("танц") || lower.includes("dance"))
    return <Music color={color} size={size} />;
  if (
    lower.includes("тварин") ||
    lower.includes("animal") ||
    lower.includes("pet")
  )
    return <PawPrint color={color} size={size} />;
  if (
    lower.includes("авто") ||
    lower.includes("машин") ||
    lower.includes("car")
  )
    return <Car color={color} size={size} />;
  if (lower.includes("дизайн") || lower.includes("design"))
    return <PenTool color={color} size={size} />;
  if (lower.includes("мов") || lower.includes("lang"))
    return <Globe color={color} size={size} />;
  if (lower.includes("математ") || lower.includes("math"))
    return <Calculator color={color} size={size} />;
  return <Hash color={color} size={size} />;
};

export default function HobbiesModal({
  visible,
  onSuccess,
  onClose,
  isDark = false,
}: Props) {
  const theme = isDark ? "dark" : "light";
  const c = Colors[theme];

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      loadData();
      setError("");
      setIsSuccess(false);
      setShowConfetti(false);
    }
  }, [visible]);
  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");

      const [allHobbiesRes, userRes] = await Promise.all([
        fetch(`${BASE_URL}/auth/hobbies`),
        fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (allHobbiesRes.ok && userRes.ok) {
        const allHobbies = await allHobbiesRes.json();
        const userData = await userRes.json();

        setHobbies(allHobbies);

        if (userData.hobbies && Array.isArray(userData.hobbies)) {
          const ids = userData.hobbies.map((h: Hobby) => h.id);
          setSelectedIds(ids);
        } else {
          setSelectedIds([]);
        }
      } else {
        setError("Error loading interests");
      }
    } catch (err) {
      setError("Server connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHobby = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((hobbyId) => hobbyId !== id)
        : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("Select at least one interest!");
      return;
    }
    setIsSaving(true);
    setError("");

    try {
      const token = await SecureStore.getItemAsync("userToken");

      const response = await fetch(`${BASE_URL}/app_user/upd_hobbies`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hobby_ids: selectedIds }),
      });

      if (response.ok) {
        const updatedUser = await response.json();

        playSuccessSound();
        setIsSuccess(true);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          onSuccess(updatedUser.hobbies || []);
        }, 1800);
      } else {
        setError(await parseApiError(response, "Failed to save changes"));
      }
    } catch (err) {
      setError("Network error during save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    playClickSound();
    setIsSaving(true);
    setError("");

    try {
      const token = await SecureStore.getItemAsync("userToken");

      const response = await fetch(`${BASE_URL}/app_user/upd_hobbies`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hobby_ids: [] }),
      });

      if (response.ok) {
        onSuccess([]);
      } else {
        setError(await parseApiError(response, "Failed to skip"));
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[s.overlay, { zIndex: 1000 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            s.modalContent,
            { backgroundColor: c.background, borderColor: c.border },
            cardShadow(theme, "hard"),
          ]}
        >
          {onClose && (
            <Pressable
              style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
              onPress={onClose}
              disabled={isSaving || isSuccess}
            >
              <View
                style={[
                  s.closeIconBg,
                  { backgroundColor: c.cardBg, borderColor: c.border },
                ]}
              >
                <X color={c.textMuted} size={20} />
              </View>
            </Pressable>
          )}

          <View style={[s.dragIndicator, { backgroundColor: c.border }]} />

          <View style={s.header}>
            <View style={[s.iconBox, { backgroundColor: c.iconBg }]}>
              <Sparkles color={c.iconColor} size={28} />
            </View>
            <Text
              style={[
                Typography.titleXl,
                { color: c.textMain, textAlign: "center", marginBottom: 6 },
              ]}
            >
              Що тебе надихає?
            </Text>
            <Text
              style={[
                Typography.body,
                {
                  color: c.textMuted,
                  textAlign: "center",
                  paddingHorizontal: 20,
                },
              ]}
            >
              Ми підлаштуємо квести під твої вподобання.
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={c.accent}
              style={{ marginVertical: 60 }}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
            >
              <View style={s.hobbiesGrid}>
                {hobbies.map((hobby) => {
                  const isSelected = selectedIds.includes(hobby.id);
                  const bgColor = isSelected ? c.accent : c.cardBg;
                  const borderColor = isSelected ? c.accent : c.border;
                  const textColor = isSelected ? "#FFFFFF" : c.textMain;
                  const iconColor = isSelected ? "#FFFFFF" : c.textMuted;

                  return (
                    <Pressable
                      key={hobby.id}
                      onPress={() => toggleHobby(hobby.id)}
                      disabled={isSaving || isSuccess}
                      style={({ pressed }) => [
                        s.hobbyChip,
                        {
                          backgroundColor: bgColor,
                          borderColor: borderColor,
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                      ]}
                    >
                      <View style={s.chipInner}>
                        {getHobbyIcon(hobby.name, iconColor, 18)}
                        <Text
                          style={[
                            Typography.body,
                            s.chipLabel,
                            { color: textColor },
                          ]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {hobby.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={s.checkCircle}>
                          <Check color={c.accent} size={14} strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
            </ScrollView>
          )}

          <View style={[s.footer, { borderTopColor: c.border }]}>
            <Text
              style={[
                Typography.muted,
                { color: c.textMuted, textAlign: "center", marginBottom: 12 },
              ]}
            >
              Обрано інтересів: {selectedIds.length}
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={isSaving || isSuccess || selectedIds.length === 0}
              style={({ pressed }) => [
                s.saveBtn,
                { backgroundColor: isSuccess ? "#34C759" : c.accent },
                pressed && s.btnPressed,
                (isSaving || selectedIds.length === 0) &&
                  !isSuccess && { opacity: 0.5 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : isSuccess ? (
                <View style={s.successContent}>
                  <Check color="#FFF" size={24} strokeWidth={3} />
                  <Text style={s.saveBtnText}>Збережено!</Text>
                </View>
              ) : (
                <Text style={s.saveBtnText}>Підтвердити вибір</Text>
              )}
            </Pressable>

            {!isSuccess && (
              <Pressable
                onPress={handleSkip}
                disabled={isSaving}
                style={({ pressed }) => [
                  { marginTop: 16, alignItems: "center", paddingVertical: 8 },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={[
                    Typography.body,
                    { color: c.textMuted, fontSize: 16, fontWeight: "600" },
                  ]}
                >
                  Без хобі
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        {showConfetti && (
          <ConfettiCannon
            count={50}
            origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
            explosionSpeed={500}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  closeIconBg: { padding: 8, borderRadius: Radii.full, borderWidth: 1 },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },
  iconBox: { padding: 14, borderRadius: Radii.full, marginBottom: 16 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  hobbiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  hobbyChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 32,
    borderRadius: Radii.full,
    borderWidth: 1,
    width: "47%",
    minHeight: 48,
    position: "relative",
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    flex: 1,
    maxWidth: "100%",
  },
  chipLabel: {
    fontFamily: "Nunito_600SemiBold",
    textAlign: "left",
    fontSize: 13,
    flex: 1,
    ...textLayout,
  },
  checkCircle: {
    position: "absolute",
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 2,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 60,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { ...Typography.titleMd, color: "#FFF", fontSize: 18 },
  successContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnPressed: { transform: [{ scale: 0.98 }] },
});
