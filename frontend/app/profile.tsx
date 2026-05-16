// import React, { useState, useEffect } from 'react';
// import {
//   View, Text, TextInput, Pressable, StyleSheet,
//   KeyboardAvoidingView, Platform, ActivityIndicator, Share,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { User, ArrowLeft, Check, AlertCircle, Sparkles, Share2 ,LogOut} from 'lucide-react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import * as SecureStore from 'expo-secure-store';

// import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
// import { BASE_URL } from '@/constants/api';

// import HobbiesModal from '@/components/HobbiesModal';

// export default function ProfileScreen() {
//   const router = useRouter();
  
//   const { theme: themeParam } = useLocalSearchParams();
//   const isDark = themeParam === 'dark';
  
//   const [nickname, setNickname] = useState('');
//   const [completedQuests, setCompletedQuests] = useState(0);

//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [message, setMessage] = useState({ text: '', type: '' });
  
//   const [showHobbiesModal, setShowHobbiesModal] = useState(false);

//   const theme = isDark ? 'dark' : 'light';
//   const c = Colors[theme];
//   const sh = Shadows[theme];

//   useEffect(() => {
//     const fetchCurrentProfile = async () => {
//       try {
//         const token = await SecureStore.getItemAsync('userToken');
//         if (!token) return;

//         const response = await fetch(`${BASE_URL}/auth/me`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           setNickname(data.nickname);
//         }
//       } catch (error) {
//         console.error("Помилка завантаження:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchCurrentProfile();
//   }, []);

//   const handleLogout = async () => {
//   try {
//     await SecureStore.deleteItemAsync('userToken');
//     await SecureStore.deleteItemAsync('has_hobbies');
    
//     router.replace('/');
//   } catch (error) {
//     console.error("Помилка при виході:", error);
//   }
// };
//   const handleUpdateNickname = async () => {
//     if (!nickname.trim()) {
//       setMessage({ text: 'Нікнейм не може бути порожнім', type: 'error' });
//       return;
//     }

//     setIsSaving(true);
//     setMessage({ text: '', type: '' });

//     try {
//       const token = await SecureStore.getItemAsync('userToken');
      
//       const response = await fetch(`${BASE_URL}/app_user/update_nick`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ nickname: nickname }),
//       });

//       if (response.ok) {
//         setMessage({ text: 'Нікнейм успішно оновлено! 🎉', type: 'success' });
//       } else {
//         const errorData = await response.json();
//         setMessage({ text: errorData.detail || 'Помилка оновлення', type: 'error' });
//       }
//     } catch (error) {
//       setMessage({ text: 'Помилка з\'єднання з сервером', type: 'error' });
//     } finally {
//       setIsSaving(false);
//     }
//   };

 
//   const handleShareApp = async () => {
//     try {
//       const shareMessage = `Привіт! Я використовую додаток AuMentem. Мій нік: ${nickname}, і я вже виконав(ла) ${completedQuests} квестів для свого ментального здоров'я! Приєднуйся: https://aumentem.app 🚀`;
      
//       await Share.share({
//         message: shareMessage,
//       });
//     } catch (error) {
//       console.error("Помилка при шерингу", error);
//     }
//   };

//   return (
//     <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <View style={s.header}>
//           <Pressable
//             onPress={() => router.back()}
//             style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
//           >
//             <ArrowLeft color={c.textMain} size={IconSizes.sm} />
//           </Pressable>
//           <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>
//             Мій профіль
//           </Text>
//         </View>

//         <View style={s.content}>
//           {isLoading ? (
//             <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
//           ) : (
//             <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              
//               <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 12 }]}>
//                 Особисті дані
//               </Text>
              
//               <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
//                 <User color={c.textMuted} size={20} />
//                 <TextInput
//                   style={[s.input, { color: c.textMain }]}
//                   placeholder="Введіть новий нікнейм"
//                   placeholderTextColor={c.textMuted}
//                   value={nickname}
//                   onChangeText={(text) => {
//                     setNickname(text);
//                     if (message.text) setMessage({ text: '', type: '' });
//                   }}
//                 />
//               </View>

//               {message.text ? (
//                 <View style={[s.messageBox, { backgroundColor: message.type === 'success' ? '#34C75920' : '#FF3B3020' }]}>
//                   {message.type === 'success' ? (
//                     <Check color="#34C759" size={18} />
//                   ) : (
//                     <AlertCircle color="#FF3B30" size={18} />
//                   )}
//                   <Text style={[s.messageText, { color: message.type === 'success' ? '#34C759' : '#FF3B30' }]}>
//                     {message.text}
//                   </Text>
//                 </View>
//               ) : null}

//               <Pressable
//                 style={({ pressed }) => [
//                   s.primaryBtn,
//                   { backgroundColor: c.accent, marginTop: 16 },
//                   pressed && s.pressed,
//                   isSaving && { opacity: 0.7 }
//                 ]}
//                 onPress={handleUpdateNickname}
//                 disabled={isSaving}
//               >
//                 {isSaving ? (
//                   <ActivityIndicator color="#FFF" />
//                 ) : (
//                   <Text style={s.primaryBtnText}>Оновити нікнейм</Text>
//                 )}
//               </Pressable>

//               <View style={[s.divider, { backgroundColor: c.border }]} />

//               <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 12 }]}>
//                 Вподобання
//               </Text>

//               <Pressable
//                 onPress={() => setShowHobbiesModal(true)}
//                 style={({ pressed }) => [
//                   s.inputWrapper,
//                   { backgroundColor: c.background, justifyContent: 'space-between' },
//                   pressed && s.pressed
//                 ]}
//               >
//                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
//                   <Sparkles color={c.textMuted} size={20} />
//                   <Text style={[Typography.body, { color: c.textMain }]}>
//                     Твої інтереси
//                   </Text>
//                 </View>
//                 <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>Змінити</Text>
//               </Pressable>

//               <View style={[s.divider, { backgroundColor: c.border }]} />

//               {/* Кнопка "Поділитися додатком" */}
//               <Pressable
//                 onPress={handleShareApp}
//                 style={({ pressed }) => [
//                   s.shareBtn,
//                   { backgroundColor: c.background, borderColor: c.border },
//                   pressed && s.pressed
//                 ]}
//               >
//                 <Share2 color={c.textMain} size={20} />
//                 <Text style={[Typography.titleMd, { color: c.textMain, marginLeft: 12 }]}>
//                   Поділитися додатком
//                 </Text>
//               </Pressable>
// <View style={[s.miniDivider, { backgroundColor: c.border }]} />

//               <Pressable
//                 onPress={handleLogout}
//                 style={({ pressed }) => [
//                   s.logoutBtn,
//                   { backgroundColor: isDark ? '#FF3B3015' : '#FF3B3005' },
//                   pressed && s.pressed
//                 ]}
//               >
//                 <LogOut color="#FF3B30" size={20} />
//                 <Text style={[Typography.titleMd, { color: '#FF3B30', marginLeft: 12 }]}>
//                   Вийти з акаунта
//                 </Text>
//               </Pressable>

//             </View>
            
//           )}
//         </View>

//         <HobbiesModal
//           visible={showHobbiesModal}
//           isDark={isDark}
//           onSuccess={() => setShowHobbiesModal(false)}
//           onClose={() => setShowHobbiesModal(false)}
//         />

//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const s = StyleSheet.create({
//   container: { flex: 1 },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: Spacing.screenX,
//     paddingTop: 10,
//     paddingBottom: 20,
//   },
//   backBtn: {
//     padding: 8,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: Spacing.screenX,
//     paddingTop: 20,
//   },
//   card: {
//     borderRadius: Radii.lg,
//     padding: Spacing.cardP,
//     borderWidth: 1,
//   },
//   divider: {
//     height: 1,
//     width: '100%',
//     marginVertical: 24,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: Radii.md,
//     paddingHorizontal: 16,
//     height: 56,
//     gap: 12,
//   },
//   input: {
//     flex: 1,
//     ...Typography.body,
//   },
//   messageBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     borderRadius: Radii.md,
//     marginTop: 12,
//     gap: 8,
//   },
//   messageText: {
//     ...Typography.body,
//     fontSize: 14,
//     fontWeight: '500',
//     flex: 1,
//   },
//   primaryBtn: {
//     height: 50,
//     borderRadius: Radii.full,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   primaryBtnText: {
//     ...Typography.titleMd,
//     color: '#FFF',
//     fontSize: 15,
//   },
//   shareBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14,
//     borderRadius: Radii.md,
//     borderWidth: 1,
//   },
//   pressed: {
//     opacity: 0.85,
//     transform: [{ scale: 0.98 }],
//   },
//   miniDivider: {
//     height: 1,
//     width: '100%',
//     marginVertical: 12,
//   },
//   logoutBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14,
//     borderRadius: Radii.md,
//     borderWidth: 1,
//     borderColor: '#FF3B3020',
//   },
// });
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Share, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, ArrowLeft, Check, AlertCircle, Sparkles, 
  Share2, LogOut, Lock, Key, Eye, EyeOff, CheckCircle2, Circle
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playClickSound } from '@/utils/audio';

import HobbiesModal from '@/components/HobbiesModal';

export default function ProfileScreen() {
  const router = useRouter();
  
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  const theme = isDark ? 'dark' : 'light';
  const c = Colors[theme];
  const sh = Shadows[theme];
  
  // Стан для Нікнейма та Статистики
  const [nickname, setNickname] = useState('');
  const [completedQuests, setCompletedQuests] = useState(0); 
  const [isSavingNick, setIsSavingNick] = useState(false);
  const [nickMessage, setNickMessage] = useState({ text: '', type: '' });

  // Стан для Зміни пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });

  // Загальні стани
  const [isLoading, setIsLoading] = useState(true);
  const [showHobbiesModal, setShowHobbiesModal] = useState(false);

  // === ДИНАМІЧНА ВАЛІДАЦІЯ ПАРОЛЯ ===
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword);
  
  const isNewPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;

        // ПАРАЛЕЛЬНО ТЯГНЕМО ПРОФІЛЬ І СТАТИСТИКУ!
        const [profileRes, statsRes] = await Promise.all([
          fetch(`${BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${BASE_URL}/stats/my-weekly-stats`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setNickname(data.nickname);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          // Рахуємо всі-всі квести за всі тижні
          let totalQuests = 0;
          statsData.forEach((stat: any) => {
            totalQuests += (stat.mini_quests_completed || 0) + (stat.geo_quests_completed || 0);
          });
          setCompletedQuests(totalQuests);
        }

      } catch (error) {
        console.error("Помилка завантаження:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    playClickSound();
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('has_hobbies');
      router.replace('/'); 
    } catch (error) {
      console.error("Помилка при виході:", error);
    }
  };

  const handleUpdateNickname = async () => {
    playClickSound();
    if (!nickname.trim()) {
      setNickMessage({ text: 'Нікнейм не може бути порожнім', type: 'error' });
      return;
    }

    setIsSavingNick(true);
    setNickMessage({ text: '', type: '' });

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/app_user/update_nick`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname }),
      });

      if (response.ok) {
        setNickMessage({ text: 'Нікнейм успішно оновлено! 🎉', type: 'success' });
      } else {
        const errorData = await response.json();
        setNickMessage({ text: errorData.detail || 'Помилка оновлення', type: 'error' });
      }
    } catch (error) {
      setNickMessage({ text: 'Помилка з\'єднання з сервером', type: 'error' });
    } finally {
      setIsSavingNick(false);
    }
  };

  const handleChangePassword = async () => {
    playClickSound();
    if (!oldPassword || !isNewPasswordValid) return;

    setIsChangingPwd(true);
    setPwdMessage({ text: '', type: '' });

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/app_user/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          old_password: oldPassword, 
          new_password: newPassword 
        }),
      });

      if (response.ok) {
        setPwdMessage({ text: 'Пароль успішно змінено! 🔒', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setShowPassword(false);
      } else {
        const errorData = await response.json();
        setPwdMessage({ text: errorData.detail || 'Помилка зміни пароля', type: 'error' });
      }
    } catch (error) {
      setPwdMessage({ text: 'Помилка з\'єднання з сервером', type: 'error' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  // === ОНОВЛЕНИЙ ШЕРИНГ ===
  const handleShareApp = async () => {
    playClickSound();
    try {
      const shareMessage = completedQuests > 0 
        ? `Привіт! Це ${nickname} 👋 Я прокачую своє ментальне здоров'я в AuMentem і маю вже ${completedQuests} виконаних квестів! 🌟 Долучайся, давай покращувати себе разом: https://aumentem.app 🚀`
        : `Привіт! Це ${nickname} 👋 Я починаю свій шлях в AuMentem — крутому додатку для ментального здоров'я та цікавих квестів! 🌟 Приєднуйся до мене: https://aumentem.app 🚀`;
      
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("Помилка при шерингу", error);
    }
  };

  const RequirementItem = ({ text, isValid }: { text: string, isValid: boolean }) => (
    <View style={s.requirementRow}>
      {isValid ? <CheckCircle2 color="#34C759" size={16} /> : <Circle color={c.textMuted} size={16} />}
      <Text style={[s.requirementText, { color: isValid ? c.textMain : c.textMuted }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.header}>
          <Pressable
            onPress={() => { playClickSound(); router.back(); }}
            style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          >
            <ArrowLeft color={c.textMain} size={IconSizes.sm} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>
            Мій профіль
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            
            {/* КАРТКА 1: ОСОБИСТІ ДАНІ */}
            <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 12 }]}>
                Особисті дані
              </Text>
              
              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <User color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Введіть новий нікнейм"
                  placeholderTextColor={c.textMuted}
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    if (nickMessage.text) setNickMessage({ text: '', type: '' });
                  }}
                />
              </View>

              {nickMessage.text ? (
                <View style={[s.messageBox, { backgroundColor: nickMessage.type === 'success' ? '#34C75920' : '#FF3B3020' }]}>
                  {nickMessage.type === 'success' ? <Check color="#34C759" size={18} /> : <AlertCircle color="#FF3B30" size={18} />}
                  <Text style={[s.messageText, { color: nickMessage.type === 'success' ? '#34C759' : '#FF3B30' }]}>
                    {nickMessage.text}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  s.primaryBtn,
                  { backgroundColor: c.accent, marginTop: 16 },
                  pressed && s.pressed,
                  isSavingNick && { opacity: 0.7 }
                ]}
                onPress={handleUpdateNickname}
                disabled={isSavingNick}
              >
                {isSavingNick ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Оновити нікнейм</Text>}
              </Pressable>
            </View>

            {/* КАРТКА 2: БЕЗПЕКА (ЗМІНА ПАРОЛЯ) */}
            <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 12 }]}>
                Безпека
              </Text>

              <View style={[s.inputWrapper, { backgroundColor: c.background, marginBottom: 12 }]}>
                <Lock color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Поточний пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPassword}
                  value={oldPassword}
                  onChangeText={(t) => { setOldPassword(t); if (pwdMessage.text) setPwdMessage({text: '', type: ''}); }}
                />
                <Pressable onPress={() => { playClickSound(); setShowPassword(!showPassword); }} style={{ padding: 4 }}>
                  {showPassword ? <EyeOff color={c.textMuted} size={20} /> : <Eye color={c.textMuted} size={20} />}
                </Pressable>
              </View>

              <View style={[s.inputWrapper, { backgroundColor: c.background }]}>
                <Key color={c.textMuted} size={20} />
                <TextInput
                  style={[s.input, { color: c.textMain }]}
                  placeholder="Новий пароль"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); if (pwdMessage.text) setPwdMessage({text: '', type: ''}); }}
                />
              </View>

              {newPassword.length > 0 && !isNewPasswordValid && (
                <View style={s.requirementsContainer}>
                  <RequirementItem text="Мінімум 8 символів" isValid={hasMinLength} />
                  <RequirementItem text="Велика літера (A-Z)" isValid={hasUpper} />
                  <RequirementItem text="Мала літера (a-z)" isValid={hasLower} />
                  <RequirementItem text="Цифра (0-9)" isValid={hasNumber} />
                  <RequirementItem text="Спецсимвол (!@#$...)" isValid={hasSpecial} />
                </View>
              )}

              {pwdMessage.text ? (
                <View style={[s.messageBox, { backgroundColor: pwdMessage.type === 'success' ? '#34C75920' : '#FF3B3020' }]}>
                  {pwdMessage.type === 'success' ? <Check color="#34C759" size={18} /> : <AlertCircle color="#FF3B30" size={18} />}
                  <Text style={[s.messageText, { color: pwdMessage.type === 'success' ? '#34C759' : '#FF3B30' }]}>
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
                  isChangingPwd && { opacity: 0.7 }
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPwd || !oldPassword || !isNewPasswordValid}
              >
                {isChangingPwd ? <ActivityIndicator color={c.background} /> : <Text style={[s.primaryBtnText, { color: c.background }]}>Змінити пароль</Text>}
              </Pressable>
            </View>

            {/* КАРТКА 3: ІНШЕ */}
            <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <Pressable
                onPress={() => { playClickSound(); setShowHobbiesModal(true); }}
                style={({ pressed }) => [s.actionRow, pressed && s.pressed]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Sparkles color={c.textMuted} size={20} />
                  <Text style={[Typography.body, { color: c.textMain, fontWeight: '500' }]}>Твої інтереси</Text>
                </View>
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>Змінити</Text>
              </Pressable>

              <View style={[s.miniDivider, { backgroundColor: c.border }]} />

              <Pressable 
                onPress={handleShareApp}
                style={({ pressed }) => [s.actionRow, pressed && s.pressed]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Share2 color={c.textMuted} size={20} />
                  <Text style={[Typography.body, { color: c.textMain, fontWeight: '500' }]}>Поділитися додатком</Text>
                </View>
              </Pressable>

              <View style={[s.miniDivider, { backgroundColor: c.border }]} />

              <Pressable 
                onPress={handleLogout}
                style={({ pressed }) => [s.actionRow, pressed && s.pressed]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <LogOut color="#FF3B30" size={20} />
                  <Text style={[Typography.body, { color: '#FF3B30', fontWeight: '600' }]}>Вийти з акаунта</Text>
                </View>
              </Pressable>
            </View>

          </ScrollView>
        )}

        <HobbiesModal
          visible={showHobbiesModal}
          isDark={isDark}
          onSuccess={() => setShowHobbiesModal(false)}
          onClose={() => setShowHobbiesModal(false)}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: '100%',
  },
  requirementsContainer: {
    marginTop: 12,
    gap: 6,
    paddingHorizontal: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    ...Typography.body,
    fontSize: 13,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    marginTop: 12,
    gap: 8,
  },
  messageText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    height: 50,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  miniDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4, 
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});