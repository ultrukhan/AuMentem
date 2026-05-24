

import { BASE_URL } from "@/constants/api";
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, 
  Platform, SafeAreaView, ActivityIndicator, Modal, ScrollView, Image, Keyboard
} from "react-native";
import { Mail, Lock, Sparkles, ArrowRight, User, Eye, EyeOff, Check, Sun, Moon, Volume2, VolumeX } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, Radii, Spacing, AuthLayout } from "@/constants/theme";
import * as SecureStore from "expo-secure-store";
import { playClickSound, stopAmbientSound, playAmbientSound } from '@/utils/audio';
import { useSavedTheme } from '@/hooks/useSavedTheme';
import { useAppSettings } from '@/hooks/useAppSettings';
import { parseApiError } from '@/utils/apiErrors';
import AnimatedCard from '@/components/AnimatedCard';
import FadeInView from '@/components/FadeInView';

const ReqItem = ({ met, text, c }: { met: boolean, text: string, c: any }) => (
  <View style={s.reqItemRow}>
    <View style={[s.checkboxSmall, { borderWidth: met ? 0 : 1, borderColor: c.textMuted, backgroundColor: met ? '#34D399' : 'transparent' }]}>
      {met && <Check color="#FFF" size={10} strokeWidth={3} />}
    </View>
    <Text style={[Typography.nav, { color: met ? c.textMain : c.textMuted }]}>{text}</Text>
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const { isDark, theme, toggleTheme } = useSavedTheme();
  const { animationsEnabled } = useAppSettings();
  const [showSuccess, setShowSuccess] = useState(false);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await SecureStore.getItemAsync('userSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setIsMuted(parsed.music === false && parsed.sfx === false);
        } catch {}
      }
    };
    loadSettings();
  }, []);

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    try {
      const saved = await SecureStore.getItemAsync('userSettings');
      let current = saved ? JSON.parse(saved) : {};
      current.music = !newMuted;
      current.sfx = !newMuted;
      current.musicVolume = newMuted ? 0 : 0.5;
      current.sfxVolume = newMuted ? 0 : 0.5;
      await SecureStore.setItemAsync('userSettings', JSON.stringify(current));
    } catch {}
    
    if (newMuted) {
      stopAmbientSound();
    } else {
      setTimeout(() => playClickSound(), 50);
      playAmbientSound(0, isDark);
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const c = Colors[theme];
  const appIcon = require('@/assets/images/icon.jpg');

  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /\d/.test(password);
  const reqSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const allReqsMet = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  const handleRegister = async () => {
    playClickSound();
    if (!nickname || !email || !password) return setErrorMessage("Будь ласка, заповніть всі поля");
    if (!email.includes("@") || !email.includes(".")) return setErrorMessage("Введіть коректний email");
    if (!allReqsMet) return setErrorMessage("Виконайте всі вимоги до паролю");
    if (!agreed) return setErrorMessage("Погодьтеся з політикою конфіденційності");

    setIsLoading(true);
    setErrorMessage("");

    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('isFirstLogin');
      
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, email, password, hobby_ids: [] }),
      });

      if (!response.ok) {
        return setErrorMessage(await parseApiError(response, "Сталася помилка при реєстрації"));
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
      <Pressable style={s.soundToggle} onPress={toggleMute}>
        {isMuted ? <VolumeX color={c.textMain} size={24} /> : <Volume2 color={c.textMain} size={24} />}
      </Pressable>

      <Pressable style={s.themeToggle} onPress={toggleTheme}>
        {isDark ? <Sun color={c.textMain} size={24} /> : <Moon color={c.textMain} size={24} />}
      </Pressable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={keyboardVisible}
          contentContainerStyle={[s.scrollContent, !keyboardVisible && s.scrollContentCentered]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={keyboardVisible}
        >
          
          <FadeInView animationsEnabled={animationsEnabled} style={s.header}>
            <Image source={appIcon} style={s.headerIcon} resizeMode="cover" />
            <Text style={[s.mainTitle, { color: c.textMain }]}>Реєстрація</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>Почни свій шлях в Altera 🌱</Text>
          </FadeInView>

          <FadeInView animationsEnabled={animationsEnabled} delay={80} style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <View style={s.inputGroup}>
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} />
                <TextInput style={[s.input, { color: c.textMain }]} placeholder="Твій нікнейм" placeholderTextColor={c.textMuted} value={nickname} onChangeText={setNickname} />
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Mail color={c.textMuted} size={20} />
                <TextInput style={[s.input, { color: c.textMain }]} placeholder="Твій email" placeholderTextColor={c.textMuted} autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>

              {/* ЗУМ-БЕЗПЕЧНИЙ ПАРОЛЬ */}
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Lock color={c.textMuted} size={20} />
                
                <View style={{ flex: 1, position: 'relative', justifyContent: 'center', height: '100%' }}>
                  {!showPassword && password.length > 0 && (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]} pointerEvents="none">
                      <Text 
                        style={{ ...Typography.body, color: c.textMain, fontSize: 16, letterSpacing: 2, marginTop: Platform.OS === 'ios' ? 4 : 0 }} 
                        numberOfLines={1}
                      >
                        {"•".repeat(password.length)}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={[
                      s.input,
                      { color: c.textMain },
                      !showPassword && password.length > 0 && { color: 'rgba(255,255,255,0)' }
                    ]}
                    placeholder="Пароль"
                    placeholderTextColor={c.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    caretHidden={!showPassword}
                    selectionColor={(!showPassword && password.length > 0) ? 'rgba(255,255,255,0)' : c.accent}
                    cursorColor={(!showPassword && password.length > 0) ? 'rgba(255,255,255,0)' : c.accent}
                  />
                </View>
                
                <Pressable onPress={() => { playClickSound(); setShowPassword(!showPassword); }} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff color={c.textMuted} size={20} /> : <Eye color={c.textMuted} size={20} />}
                </Pressable>
              </View>

            </View>

            <View style={s.requirementsBox}>
              <Text style={[Typography.nav, { color: c.textMuted, marginBottom: 8 }]}>Вимоги до паролю:</Text>
              <ReqItem met={reqLength} text="Мінімум 8 символів" c={c} />
              <ReqItem met={reqUpper} text="Хоча б одна велика літера (A-Z)" c={c} />
              <ReqItem met={reqLower} text="Хоча б одна мала літера (a-z)" c={c} />
              <ReqItem met={reqNumber} text="Хоча б одна цифра (0-9)" c={c} />
              <ReqItem met={reqSpecial} text='Спецсимвол (напр. !@#$%^&*)' c={c} />
            </View>

            <View style={s.checkboxRow}>
              <Pressable onPress={() => { playClickSound(); setAgreed(!agreed); }} hitSlop={8}>
                <View style={[s.checkbox, { borderColor: c.textMuted, backgroundColor: agreed ? c.accent : 'transparent' }, agreed && { borderColor: c.accent }]}>
                  {agreed && <Check color="#FFF" size={14} strokeWidth={3} />}
                </View>
              </Pressable>
              <Text style={[Typography.nav, { color: c.textMuted, flex: 1, marginLeft: 10, lineHeight: 18 }]}>
                Я погоджуюсь з{' '}
                <Text style={{ color: c.accent, textDecorationLine: 'underline' }} onPress={() => { playClickSound();  router.push({
      pathname: '/legal', 
      params: { theme: theme } // передаємо поточну тему
    }); }}>
                  умовами використання та політикою конфіденційності
                </Text>
              </Text>
            </View>

            {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}
          </FadeInView>

          <FadeInView animationsEnabled={animationsEnabled} delay={160} style={s.footer}>
            <AnimatedCard animationsEnabled={animationsEnabled} style={[s.primaryBtn, { backgroundColor: c.accent }, (isLoading || !allReqsMet || !agreed) && { opacity: 0.7 }]} onPress={handleRegister} disabled={isLoading || !allReqsMet || !agreed}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <><Text style={s.primaryBtnText}>Створити акаунт</Text><ArrowRight color="#FFF" size={20} strokeWidth={3} /></>}
            </AnimatedCard>

            <AnimatedCard animationsEnabled={animationsEnabled} style={s.secondaryBtn} onPress={() => { playClickSound(); router.back(); }}>
              <Text style={[s.secondaryBtnText, { color: c.textMain }]}>Вже маєш акаунт? <Text style={{ color: c.accent }}>Увійти</Text></Text>
            </AnimatedCard>
          </FadeInView>

        </ScrollView>

        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: c.cardBg, borderColor: c.border }]}>
              <Sparkles color={c.accent} size={48} style={{ marginBottom: 16 }} />
              <Text style={[Typography.titleLg, { color: c.textMain }]}>Готово! 🎉</Text>
              <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginVertical: 12 }]}>Акаунт успішно створено! 💌{'\n'}Будь ласка, перевір свою пошту та підтвердь реєстрацію, щоб увійти в додаток.</Text>
              <Pressable style={[s.modalBtn, { backgroundColor: c.accent }]} onPress={async () => { playClickSound(); setShowSuccess(false); router.replace('/'); }}>
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
  themeToggle: { position: 'absolute', top: 50, right: 24, zIndex: 10, padding: 8 },
  soundToggle: { position: 'absolute', top: 50, right: 72, zIndex: 10, padding: 8 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.screenX, paddingVertical: AuthLayout.scrollPaddingVertical },
  scrollContentCentered: { justifyContent: 'center' },
  header: { alignItems: "center", marginBottom: AuthLayout.headerMarginBottom, marginTop: AuthLayout.headerMarginTop },
  headerIcon: { width: AuthLayout.headerIconSize, height: AuthLayout.headerIconSize, borderRadius: AuthLayout.headerIconRadius, marginBottom: 20 },
  mainTitle: { ...Typography.titleXl, marginBottom: 2, fontSize: 26 },
  subtitle: { ...Typography.body, textAlign: "center", fontSize: 14 },
  card: { borderRadius: Radii.lg, padding: 16, borderWidth: 1, marginBottom: 16 },
  inputGroup: { gap: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: Radii.md, paddingHorizontal: 16, height: 50, gap: 10 },
  input: { flex: 1, ...Typography.body, fontSize: 15 },
  requirementsBox: { marginTop: 16, paddingHorizontal: 4 },
  reqItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  checkboxSmall: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, paddingHorizontal: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: "#FF3B30", marginTop: 12, textAlign: "center", fontSize: 13, fontWeight: "500" },
  footer: { gap: 12 },
  primaryBtn: { flexDirection: "row", height: 54, borderRadius: Radii.full, alignItems: "center", justifyContent: "center", gap: 8 },
  primaryBtnText: { ...Typography.titleMd, color: "#FFF", fontSize: 16 },
  secondaryBtn: { height: 44, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { ...Typography.body, fontSize: 14 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  modalContent: { padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  modalBtn: { width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
});