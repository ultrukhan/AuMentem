import { BASE_URL } from "@/constants/api";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView
} from "react-native";
import { Mail, Lock, Sparkles, ArrowRight, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, Radii, Shadows, Spacing } from "@/constants/theme";
import * as SecureStore from "expo-secure-store";

export default function RegisterScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const theme = isDark ? "dark" : "light";
  const c = Colors[theme];
  const sh = Shadows[theme];

  const handleRegister = async () => {
    if (!nickname || !email || !password) {
      setErrorMessage("Будь ласка, заповніть всі поля");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Введіть коректний email (наприклад: user@mail.com)");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Пароль має містити щонайменше 6 символів");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('isFirstLogin');
      await SecureStore.deleteItemAsync('user_saved_hobbies');
      await SecureStore.deleteItemAsync('has_hobbies');

      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname,
          email: email,
          password: password,
          hobby_ids: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.detail?.[0]?.msg || errorData.detail || "Сталася помилка при реєстрації";
        setErrorMessage(detail);
        return;
      }

      await SecureStore.setItemAsync("isFirstLogin", "true");
      setShowSuccess(true);

    } catch (error) {
      setErrorMessage("Не вдалося з'єднатися з сервером.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={s.header}>
            <View style={[s.iconGlow, { backgroundColor: c.iconBg }, sh.glow]}>
              <Sparkles color={c.iconColor} size={40} strokeWidth={2} />
            </View>
            <Text style={[s.mainTitle, { color: c.textMain }]}>Реєстрація</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>
              Почни свій шлях в AuMentem 🌱
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
            <View style={s.inputGroup}>
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Твій нікнейм"
                  placeholderTextColor={c.textMuted}
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Mail color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Твій email"
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Lock color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}
          </View>

          <View style={s.footer}>
            <Pressable
              style={({ pressed }) => [
                s.primaryBtn,
                { backgroundColor: c.accent },
                pressed && s.btnPressed,
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={s.primaryBtnText}>Створити акаунт</Text>
                  <ArrowRight color="#FFF" size={20} strokeWidth={3} />
                </>
              )}
            </Pressable>

            <Pressable style={s.secondaryBtn} onPress={() => router.back()}>
              <Text style={[s.secondaryBtnText, { color: c.textMain }]}>
                Вже маєш акаунт? <Text style={{ color: c.accent }}>Увійти</Text>
              </Text>
            </Pressable>
          </View>
       </ScrollView>

        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: c.background, borderColor: c.border }]}>
              <Sparkles color={c.accent} size={48} style={{ marginBottom: 16 }} />
              <Text style={[Typography.titleLg, { color: c.textMain }]}>Майже готово! ✉️</Text>
              <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginVertical: 12 }]}>
                Акаунт успішно створено! 💌{'\n'}Будь ласка, перевір свою пошту та підтвердь реєстрацію, щоб увійти в додаток.
              </Text>
              {/* <Pressable 
                style={[s.modalBtn, { backgroundColor: c.accent }]} 
                onPress={() => { setShowSuccess(false); router.back(); }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Зрозуміло</Text>
              </Pressable> */}
              <Pressable 
  style={[s.modalBtn, { backgroundColor: c.accent }]} 
  onPress={async () => { 
    setShowSuccess(false); 
    // Ми вже записали 'isFirstLogin' у handleRegister, тому просто повертаємось
    router.replace('/'); // Повертаємось на екран авторизації
  }}
>
  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Зрозуміло</Text>
</Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: Spacing.screenX, 
    justifyContent: "center",
    paddingVertical: 40 
  },
  content: { flex: 1, paddingHorizontal: Spacing.screenX, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  iconGlow: { padding: Spacing.iconWideP, borderRadius: Radii.lg, marginBottom: 20 },
  mainTitle: { ...Typography.titleXl, marginBottom: 4 },
  subtitle: { ...Typography.body, textAlign: "center" },
  card: { borderRadius: Radii.lg, padding: Spacing.cardP, borderWidth: 1, marginBottom: Spacing.headMb },
  inputGroup: { gap: 12 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: Radii.md, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, ...Typography.body },
  errorText: { color: "#FF3B30", marginTop: 16, textAlign: "center", fontSize: 14, fontWeight: "500" },
  footer: { gap: Spacing.gap },
  primaryBtn: { flexDirection: "row", height: 60, borderRadius: Radii.full, alignItems: "center", justifyContent: "center", gap: 8 },
  primaryBtnText: { ...Typography.titleMd, color: "#FFF", fontSize: 18 },
  secondaryBtn: { height: 50, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { ...Typography.body, fontSize: 15 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  modalContent: { padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  modalBtn: { width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
});