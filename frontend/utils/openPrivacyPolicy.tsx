// import { Alert, Linking } from 'react-native';
// import { PRIVACY_POLICY_URL } from '@/constants/links';

// export function openPrivacyPolicy() {
//   Linking.openURL(PRIVACY_POLICY_URL).catch(() => {
//     Alert.alert('Політика', 'Сторінка в розробці.');
//   });
// }

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

export default function LegalScreen() { 
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft color={c.textMain} size={28} />
        </Pressable>
        <Text style={[Typography.titleLg, { color: c.textMain }]}>Офіційно</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.logoArea}>
          <Text style={[s.logoText, { color: c.textMain }]}>AuMentem</Text>
          <Text style={s.subLogoText}>Legal Center</Text>
        </View>

        <Section title="Умови використання" text="AuMentem — це проект, створений для вашого розвитку. Користуючись додатком, ви приймаєте наші правила спільноти. Ми працюємо над тим, щоб квести були безпечними, проте ви берете на себе відповідальність за свої дії під час їх проходження." isDark={isDark} />
        
        <View style={[s.warning, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
           <Text style={[s.text, { color: '#EF4444', fontWeight: 'bold' }]}>Дисклеймер здоров'я:</Text>
           <Text style={[s.text, { color: '#EF4444' }]}>Ми не несемо відповідальності за ваш фізичний або ментальний стан. Додаток не є заміною професійної медичної допомоги.</Text>
        </View>

        <Section title="Політика конфіденційності" text="Ваші дані захищені. Ми використовуємо геолокацію виключно для відображення квестів поруч з вами. Ми не передаємо дані третім особам. Ви маєте повне право видалити свій акаунт разом з усіма даними в налаштуваннях." isDark={isDark} />

        <View style={[s.footer, { borderColor: c.border }]}>
           <Pressable style={s.contactBtn} onPress={() => Linking.openURL('mailto:am.altera.noreply@gmail.com')}>
              <Mail color={c.accent} size={20} />
              <Text style={{ color: c.accent, marginLeft: 8 }}>am.altera.noreply@gmail.com</Text>
           </Pressable>
           <Text style={s.copyright}>© 2026 AuMentem Inc. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, text, isDark }: any) => {
  const c = Colors[isDark ? 'dark' : 'light'];
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: c.textMain }]}>{title}</Text>
      <Text style={[s.text, { color: c.textMuted }]}>{text}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.screenX },
  backBtn: { padding: 8, marginRight: 8 },
  content: { padding: Spacing.screenX, paddingBottom: 60 },
  logoArea: { alignItems: 'center', marginVertical: 30 },
  logoText: { fontSize: 32, fontWeight: '800' },
  subLogoText: { fontSize: 14, color: '#999', letterSpacing: 2, textTransform: 'uppercase' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  text: { fontSize: 15, lineHeight: 24, textAlign: 'justify' },
  warning: { padding: 20, borderRadius: Radii.lg, marginBottom: 24 },
  footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, paddingTop: 20 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  copyright: { fontSize: 12, color: '#AAA' }
});