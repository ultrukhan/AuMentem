


import { BASE_URL } from '@/constants/api';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, 
  Platform, ActivityIndicator, ScrollView, Image, Keyboard, Appearance 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Lock, ArrowRight, Eye, EyeOff, Sun, Moon, Volume2, VolumeX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors, Typography, Radii, Spacing, AuthLayout } from '@/constants/theme';
import { playClickSound, stopAmbientSound, playAmbientSound, refreshAudioSettings } from '@/utils/audio';
import { useAppSettings } from '@/hooks/useAppSettings';
import { parseApiError } from '@/utils/apiErrors';
import AnimatedCard from '@/components/AnimatedCard';
import FadeInView from '@/components/FadeInView';
import { useSinglePress } from '@/hooks/useSinglePress';

export default function AuthScreen() {
  const router = useRouter();
  const { theme: paramTheme } = useLocalSearchParams();
  const runOnce = useSinglePress();
  const { animationsEnabled } = useAppSettings();

  const [themeReady, setThemeReady] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [splashStage, setSplashStage] = useState<'brand' | 'app' | 'done'>('brand');

  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];

  const teamLogo = require('@/assets/images/team_icon.png');
  const appIcon = require('@/assets/images/icon.png');

  const toggleTheme = async () => {
    playClickSound();
    const newTheme = !isDark;
    setIsDark(newTheme);
    await SecureStore.setItemAsync('userTheme', newTheme ? 'dark' : 'light');
    playAmbientSound(0, newTheme);
  };

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
      await refreshAudioSettings();
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

  useEffect(() => {
    if (!isCheckingToken && !isMuted) {
      playAmbientSound(0, isDark);
    }
  }, [isCheckingToken]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const savedTheme = await SecureStore.getItemAsync('userTheme');
      const savedSettings = await SecureStore.getItemAsync('userSettings');
      if (!cancelled) {
        let actualTheme: 'dark' | 'light';
        if (paramTheme === 'dark' || paramTheme === 'light') {
          actualTheme = paramTheme as 'dark' | 'light';
        } else if (savedTheme === 'dark' || savedTheme === 'light') {
          actualTheme = savedTheme;
        } else {
          actualTheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
        }
        
        setIsDark(actualTheme === 'dark');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setIsMuted(parsed.music === false && parsed.sfx === false);
          } catch {}
        }
        setThemeReady(true);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (cancelled) return;

      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setSplashStage('app');
          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (cancelled) return;

          try {
            const response = await fetch(`${BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');
              const targetTheme = (paramTheme === 'dark' || paramTheme === 'light') 
                ? paramTheme 
                : (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
              
              if (isFirstLogin === 'true') {
                router.replace({ pathname: '/into', params: { theme: targetTheme } });
              } else {
                router.replace({ pathname: '/(main)/home', params: { theme: targetTheme } });
              }
              return;
            }
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('currentUserId');
          } catch {
            // Offline: if we have a token but network failed, proceed anyway
            if (await SecureStore.getItemAsync('userToken')) {
              const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');
              const savedT = await SecureStore.getItemAsync('userTheme');
              const offlineTheme = savedT === 'dark' || savedT === 'light' ? savedT : (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
              if (isFirstLogin === 'true') {
                router.replace({ pathname: '/into', params: { theme: offlineTheme } });
              } else {
                router.replace({ pathname: '/(main)/home', params: { theme: offlineTheme } });
              }
              return;
            }
          }
        }
      } catch {}

      if (!cancelled) setSplashStage('done');
      // If we reach here, there's no valid token, so we show the login screen
      setIsCheckingToken(false);
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogin = async () => {
    playClickSound();

    if (!nickname || !password) return setErrorMessage('Введіть нікнейм та пароль');

    setIsLoading(true);
    setErrorMessage('');

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', nickname);
      formBody.append('password', password);

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
      });

      if (!response.ok) {
        return setErrorMessage(await parseApiError(response, 'Помилка авторизації'));
      }

      const data = await response.json();

      // Очищаємо старі хобі перед збереженням нового юзера (для чистого мультиакаунту)
      await SecureStore.deleteItemAsync('has_hobbies');
      await SecureStore.deleteItemAsync('user_saved_hobbies');

      await SecureStore.setItemAsync('userToken', data.access_token);

      const isFirstLogin = await SecureStore.getItemAsync('isFirstLogin');

      if (isFirstLogin === 'true') {
        router.replace({ pathname: '/into', params: { theme: isDark ? 'dark' : 'light' } });
      } else {
        router.replace({ pathname: '/(main)/home', params: { theme: isDark ? 'dark' : 'light' } });
      }

    } catch {
      setErrorMessage('Не вдалося з\'єднатися з сервером. Перевірте підключення.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!themeReady) {
    return null;
  }

  if (splashStage === 'brand') {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={s.splashLogoFrame}>
          <Image source={teamLogo} style={s.splashLogo} resizeMode="contain" />
        </View>
        <Text style={[Typography.titleXl, { color: c.textMain, marginTop: 20 }]}>AuMentem</Text>
      </SafeAreaView>
    );
  }

  if (splashStage === 'app') {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={s.splashLogoFrame}>
          <Image source={appIcon} style={s.splashLogo} resizeMode="contain" />
        </View>
        <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <Pressable style={s.soundToggle} onPress={toggleMute}>
        {isMuted ? <VolumeX color={c.textMain} size={24} /> : <Volume2 color={c.textMain} size={24} />}
      </Pressable>

      <Pressable style={s.themeToggle} onPress={toggleTheme}>
        {isDark ? <Moon color={c.textMain} size={24} /> : <Sun color={c.textMain} size={24} />}
      </Pressable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          ref={scrollViewRef}
          scrollEnabled={keyboardVisible}
          contentContainerStyle={[s.scrollContent, !keyboardVisible && { flexGrow: 1, justifyContent: 'center' }]} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false} 
          bounces={keyboardVisible}
        >

          <FadeInView animationsEnabled={animationsEnabled} style={s.header}>
            <Image source={appIcon} style={s.headerIcon} resizeMode="cover" />
            <Text style={[s.mainTitle, { color: c.textMain }]}>Altera</Text>
            <Text style={[s.subtitle, { color: c.textMuted }]}>Твій простір для відновлення 🌿</Text>
          </FadeInView>

          <FadeInView animationsEnabled={animationsEnabled} delay={80} style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <View style={s.inputGroup}>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} />
                <TextInput style={[s.input, { color: c.textMain }]} placeholder="Твій нікнейм" placeholderTextColor={c.textMuted} autoCapitalize="none" value={nickname} onChangeText={setNickname} />
              </View>

              {/* ЗУМ-БЕЗПЕЧНИЙ ПАРОЛЬ */}
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Lock color={c.textMuted} size={20} />
                
                <View style={{ flex: 1, position: 'relative', justifyContent: 'center', height: '100%' }}>
                  <TextInput
                    style={[
                      s.input,
                      { color: c.textMain }
                    ]}
                    placeholder="Пароль"
                    placeholderTextColor={c.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    secureTextEntry={!showPassword}
                    selectionColor={c.accent}
                    cursorColor={c.accent}
                  />
                </View>
                
                <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff color={c.textMuted} size={20} /> : <Eye color={c.textMuted} size={20} />}
                </Pressable>
              </View>

            </View>

            {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}

            <Pressable style={s.forgotBtn} onPress={() => runOnce(() => { playClickSound(); router.push('/forgot-password'); })}>
              <Text style={[s.forgotText, { color: c.accent }]}>Забули пароль?</Text>
            </Pressable>

          </FadeInView>

          <FadeInView animationsEnabled={animationsEnabled} delay={160} style={s.footer}>
            <AnimatedCard animationsEnabled={animationsEnabled} style={[s.primaryBtn, { backgroundColor: c.accent }, isLoading && { opacity: 0.7 }]} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <><Text style={s.primaryBtnText}>Увійти</Text><ArrowRight color="#FFF" size={20} strokeWidth={3} /></>}
            </AnimatedCard>

            <AnimatedCard animationsEnabled={animationsEnabled} style={s.secondaryBtn} onPress={() => runOnce(() => { playClickSound(); router.push('/register'); })}>
              <Text style={[s.secondaryBtnText, { color: c.textMain }]}>Ще немає акаунту? <Text style={{ color: c.accent }}>Створити</Text></Text>
            </AnimatedCard>
          </FadeInView>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  themeToggle: { position: 'absolute', top: 50, right: 24, zIndex: 10, padding: 8 },
  soundToggle: { position: 'absolute', top: 50, right: 72, zIndex: 10, padding: 8 },
  splashLogoFrame: { width: 120, height: 120, borderRadius: 28, overflow: 'hidden' },
  splashLogo: { width: '100%', height: '100%' },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.screenX, justifyContent: 'center', paddingVertical: AuthLayout.scrollPaddingVertical },
  header: { alignItems: 'center', marginBottom: AuthLayout.headerMarginBottom, marginTop: AuthLayout.headerMarginTop },
  headerIcon: { width: AuthLayout.headerIconSize, height: AuthLayout.headerIconSize, borderRadius: AuthLayout.headerIconRadius, marginBottom: 20 },
  mainTitle: { ...Typography.titleXl, marginBottom: 4 },
  subtitle: { ...Typography.body, textAlign: 'center' },
  card: { borderRadius: Radii.lg, padding: Spacing.cardP, borderWidth: 1, marginBottom: 32 },
  inputGroup: { gap: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radii.md, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, ...Typography.body },
  errorText: { color: '#FF3B30', marginTop: 12, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 16, paddingHorizontal: 4 },
  forgotText: { ...Typography.muted, fontWeight: '700' },
  footer: { gap: 16 },
  primaryBtn: { flexDirection: 'row', height: 60, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 18 },
  secondaryBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { ...Typography.body, fontSize: 15 },
});

/*

// import { BASE_URL } from '@/constants/api';

// import React, { useState, useEffect } from 'react';

// import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image, Keyboard, Appearance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// import { User, Lock, ArrowRight, Eye, EyeOff, Sun, Moon, Volume2, VolumeX } from 'lucide-react-native';

// import { useRouter } from 'expo-router';

// import * as SecureStore from 'expo-secure-store';

// import { Colors, Typography, Radii, Spacing, AuthLayout } from '@/constants/theme';

// import { playClickSound, stopAmbientSound, playAmbientSound } from '@/utils/audio';

// import { useAppSettings } from '@/hooks/useAppSettings';

// import { parseApiError } from '@/utils/apiErrors';

// import AnimatedCard from '@/components/AnimatedCard';

// import FadeInView from '@/components/FadeInView';

// import { useSinglePress } from '@/hooks/useSinglePress';

// export default function AuthScreen() {

//   const router = useRouter();

//   const runOnce = useSinglePress();

//   const { animationsEnabled } = useAppSettings();

//   const [themeReady, setThemeReady] = useState(false);

//   const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

//   const [nickname, setNickname] = useState('');

//   const [password, setPassword] = useState('');

//   const [showPassword, setShowPassword] = useState(false);

//   const [isLoading, setIsLoading] = useState(false);

//   const [errorMessage, setErrorMessage] = useState('');

//   const [isMuted, setIsMuted] = useState(false);

//   const [keyboardVisible, setKeyboardVisible] = useState(false);

//   const scrollViewRef = React.useRef<ScrollView>(null);

//   const [splashStage, setSplashStage] = useState<'brand' | 'app' | 'done'>('brand');

//   const theme = isDark ? 'dark' : 'light';

//   const c = Colors[theme];

//   const teamLogo = require('@/assets/images/team_icon.png');

//   c
//   container: { flex: 1 },

//   themeToggle: { position: 'absolute', top: 50, right: 24, zIndex: 10, padding: 8 },

//   soundToggle: { position: 'absolute', top: 50, right: 72, zIndex: 10, padding: 8 },

//   splashLogoFrame: { width: 120, height: 120, borderRadius: 28, overflow: 'hidden' },

//   splashLogo: { width: '100%', height: '100%' },

//   scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.screenX, justifyContent: 'center', paddingVertical: AuthLayout.scrollPaddingVertical },

//   header: { alignItems: 'center', marginBottom: AuthLayout.headerMarginBottom, marginTop: AuthLayout.headerMarginTop },

//   headerIcon: { width: AuthLayout.headerIconSize, height: AuthLayout.headerIconSize, borderRadius: AuthLayout.headerIconRadius, marginBottom: 20 },

//   mainTitle: { ...Typography.titleXl, marginBottom: 4 },

//   subtitle: { ...Typography.body, textAlign: 'center' },

//   card: { borderRadius: Radii.lg, padding: Spacing.cardP, borderWidth: 1, marginBottom: 32 },

//   inputGroup: { gap: 12 },

//   inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radii.md, paddingHorizontal: 16, height: 56, gap: 12 },

//   input: { flex: 1, ...Typography.body },

//   errorText: { color: '#FF3B30', marginTop: 12, textAlign: 'center', fontSize: 14, fontWeight: '500' },

//   forgotBtn: { alignSelf: 'flex-end', marginTop: 16, paddingHorizontal: 4 },

//   forgotText: { ...Typography.muted, fontWeight: '700' },

//   footer: { gap: 16 },

//   primaryBtn: { flexDirection: 'row', height: 60, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', gap: 8 },

//   primaryBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 18 },

//   secondaryBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },

//   secondaryBtnText: { ...Typography.body, fontSize: 15 },

// });

*/
