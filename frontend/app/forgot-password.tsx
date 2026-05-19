import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, ScrollView 
} from 'react-native';
import { Mail, ArrowLeft, Sparkles, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

import { Colors, Typography, Radii, Spacing, AuthLayout } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playClickSound } from '@/utils/audio';
import { useSavedTheme } from '@/hooks/useSavedTheme';
import { useAppSettings } from '@/hooks/useAppSettings';
import { parseApiError } from '@/utils/apiErrors';
import { cardShadow } from '@/utils/shadowStyle';
import FadeInView from '@/components/FadeInView';
import AnimatedCard from '@/components/AnimatedCard';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useSavedTheme();
  const { animationsEnabled } = useAppSettings();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const c = Colors[theme];

  const isValidEmail = email.includes('@') && email.includes('.');

  const handleResetRequest = async () => {
    if (!isValidEmail) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setShowSuccess(true);
      } else {
        setErrorMessage(await parseApiError(response, 'Помилка сервера. Спробуйте пізніше.'));
      }
    } catch (error) {
      setErrorMessage('Не вдалося з’єднатися з сервером.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      
      <Pressable 
        onPress={() => { playClickSound(); router.back(); }}
        style={[
          s.backBtn, 
          { borderColor: c.border, backgroundColor: c.background, top: Math.max(insets.top + 10, 20) }
        ]}
      >
        <ArrowLeft color={c.textMain} size={24} />
      </Pressable>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={s.scrollContent}>
          <View style={s.header}>
            <View style={[s.iconGlow, { backgroundColor: c.iconBg }, cardShadow(theme, 'glow')]}>
              <Mail color={c.iconColor} size={40} />
            </View>
            
            <Text style={[s.mainTitle, { color: c.textMain }]}>Відновлення</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>
              Введіть Email, на який ми надішлемо посилання для зміни пароля 🔑
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(theme, 'soft')]}>
            <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
              <Mail color={c.textMuted} size={20} />
              <TextInput
                style={[s.input, { color: c.textMain }]}
                placeholder="Твій email"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}
          </View>

          <View style={s.footer}>
           
            <Pressable 
              style={({ pressed }) => [
                s.primaryBtn, 
                { backgroundColor: c.accent },
                (!isValidEmail || isLoading) && s.btnDisabled, 
                pressed && isValidEmail && !isLoading && s.btnPressed,
              ]}
              onPress={() => {
                if (!isLoading && isValidEmail) {
                  playClickSound(); 
                  handleResetRequest();
                }
              }}
              disabled={isLoading || !isValidEmail}
            >
              {isLoading ? (
                <View style={s.loadingWrapper}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={s.primaryBtnText}>Відправляємо...</Text>
                </View>
              ) : (
                <>
                  <Text style={s.primaryBtnText}>Надіслати лінк</Text>
                  <Send color="#FFF" size={20} />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>

        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: c.cardBg, borderColor: c.border }]}>
              <Sparkles color={c.accent} size={48} style={{ marginBottom: 16 }} />
              <Text style={[Typography.titleLg, { color: c.textMain }]}>Перевір пошту! 📩</Text>
              <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginVertical: 12, lineHeight: 22 }]}>
                Ми відправили інструкції на {email}. {'\n'}Якщо листа немає — перевір папку "Спам".
              </Text>
              <Pressable 
                style={[s.modalBtn, { backgroundColor: c.accent }]} 
                onPress={() => { setShowSuccess(false); router.replace('/'); }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' ,fontSize: 16}}>Повернутися до входу</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { 
    position: 'absolute', 
    left: Spacing.screenX, 
    padding: 10, 
    borderRadius: Radii.md, 
    borderWidth: 1,
    zIndex: 100 
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.screenX, justifyContent: 'center', paddingVertical: AuthLayout.scrollPaddingVertical },
  header: { alignItems: 'center', marginBottom: AuthLayout.headerMarginBottom, marginTop: AuthLayout.headerMarginTop },
  iconGlow: { padding: 20, borderRadius: Radii.lg, marginBottom: 20 },
  mainTitle: { ...Typography.titleXl, marginBottom: 4 },
  subtitle: { ...Typography.body, textAlign: 'center', paddingHorizontal: 10 },
  card: { borderRadius: Radii.lg, padding: Spacing.cardP, borderWidth: 1, marginBottom: 32 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radii.md, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, ...Typography.body },
  errorText: { color: '#FF3B30', marginTop: 12, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  footer: { gap: 16 },
  primaryBtn: { flexDirection: 'row', height: 60, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 18 },
  btnDisabled: { opacity: 0.5 }, 
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  loadingWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  modalContent: { padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  modalBtn: { width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
});