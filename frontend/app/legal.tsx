import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mail, Shield, FileText, Users, AlertTriangle } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

export default function LegalScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      {/* HEADER */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft color={c.textMain} size={28} />
        </Pressable>
        <Text style={[Typography.titleLg, { color: c.textMain }]}>Юридична інформація</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* LOGO AREA */}
        <View style={s.logoArea}>
          <Text style={[s.logoText, { color: c.textMain }]}>AuMentem</Text>
          <Text style={s.subLogoText}>Legal & Privacy Center</Text>
          <Text style={s.updateDate}>Останнє оновлення: 24 травня 2026 р.</Text>
        </View>

        {/* 1. УМОВИ ВИКОРИСТАННЯ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <FileText color={c.accent} size={22} style={s.sectionIcon} />
            <Text style={[s.sectionTitle, { color: c.textMain }]}>Умови використання </Text>
          </View>
          
          <Text style={[s.text, { color: c.textMuted }]}>
            <Text style={s.boldSub}>1.1. Загальні положення.</Text> Ця угода є юридичним договором між вами (Користувачем) та AuMentem. Завантажуючи, встановлюючи або використовуючи додаток, ви беззастережно приймаєте ці умови.{"\n\n"}
            <Text style={s.boldSub}>1.2. Вікові обмеження та правила для неповнолітніх.</Text> Додаток дозволено для використання особам віком від **12 років**. Використання додатку особами віком від 12 до 18 років передбачає, що їхні батьки або законні опікуни ознайомилися з цими Умовами та надали свою повну згоду.{"\n\n"}
            <Text style={s.boldSub}>1.3. Безпека на геоквестах та локаціях.</Text> Додаток містить інтерактивні завдання, що виконуються у реальному фізичному просторі. Користувачі віком до 18 років зобов'язані проходити будь-які фізичні квести та відвідувати локації виключно у супроводі та під наглядом батьків або повнолітніх опікунів.{"\n\n"}
            <Text style={s.boldSub}>1.4. Звільнення від відповідальності.</Text> Розробники та адміністрація AuMentem не здійснюють фізичного нагляду за локаціями у реальному світі та не несуть відповідальності за будь-які травми, нещасні випадки, погіршення стану здоров'я, пошкодження майна пристроїв чи інші інциденти, що можуть статися з Користувачем під час проходження геоквестів.{"\n\n"}
            <Text style={s.boldSub}>1.5. Надання сервісу "як є".</Text> Додаток AuMentem надається за принципом "як є" ("as is"). Адміністрація не гарантує безперебійну, безпомилкову або постійно доступну роботу сервісу, а також відсутність технічних збоїв, втрати даних чи тимчасових обмежень функціоналу.{"\n\n"}
            <Text style={s.boldSub}>1.6. Зміни до умов.</Text> Ми залишаємо за собою право змінювати ці умови в будь-який час. Про істотні зміни мы повідомимо вас через внутрішні сповіщення додатку.{"\n\n"}
            <Text style={s.boldSub}>1.7. AI-рекомендації та автоматичні системи.</Text> Частина функцій AuMentem може використовувати автоматизовані алгоритми або AI-системи для генерації рекомендацій, квестів чи контенту. Такі результати можуть містити неточності та не повинні сприйматися як професійна порада.{"\n\n"}
            <Text style={s.boldSub}>1.8. Форс-мажор.</Text> Адміністрація не несе відповідальності за невиконання або затримку роботи сервісу через обставини непереборної сили, включаючи перебої електроенергії, воєнні дії, кібератаки, аварії дата-центрів або проблеми сторонніх сервісів.{"\n\n"}
            <Text style={s.boldSub}>1.9. Обмеження відповідальності.</Text> У максимально дозволеному законом обсязі AuMentem не несе відповідальності за будь-які непрямі, випадкові або супутні збитки, включаючи втрату даних, прибутку, репутації або особистого прогресу користувача.{"\n\n"}
            <Text style={s.boldSub}>1.10. Юрисдикція.</Text> Усі спори та правовідносини регулюються чинним законодавством країни реєстрації сервісу AuMentem.
          </Text>
        </View>

        {/* 2. ПРАВИЛА ПОВЕДІНКИ У СПІЛЬНОТІ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Users color={c.accent} size={22} style={s.sectionIcon} />
            <Text style={[s.sectionTitle, { color: c.textMain }]}>Правила поведінки у спільноті</Text>
          </View>
          
          <Text style={[s.text, { color: c.textMuted }]}>
            <Text style={s.boldSub}>2.1. Безпечне середовище.</Text> Наш додаток створено для взаємопідтримки та розвитку. Усі інтерактивні зони, форуми, чати та публічні простори мають залишатися безпечними для кожного учасника.{"\n\n"}
            <Text style={s.boldSub}>2.2. Категорично заборонено:</Text>{"\n"}
            • Будь-які прояви дискримінації (за расою, статтю, релігією, орієнтацією тощо);{"\n"}
            • Мова ворожнечі, агресія, нецензурна лексика, образи та цькування (булінг);{"\n"}
            • Шахрайство, розповсюдження спаму, маніпуляції чи фінансові схеми;{"\n"}
            • Публікація закликів до насильства або деструктивної поведінки.{"\n\n"}
            <Text style={s.boldSub}>2.3. Санкції за порушення.</Text> Система модерації або скарги користувачів можуть призвести до негайного видалення контенту.{"\n\n"}
            <Text style={s.boldSub}>2.4. {`\n`}Контент користувачів.</Text> Користувачі несуть особисту відповідальність за будь-який контент, повідомлення, зображення або матеріали, які вони публікують у додатку. Адміністрація AuMentem не несе відповідальності за дії, висловлювання чи поведінку користувачів.{"\n\n"}
            <Text style={s.boldSub}>2.5. Право на блокування.</Text> Адміністрація залишає за собою право без пояснення причин обмежити доступ користувача до сервісу (заблокувати акаунт) у випадках порушення правил, підозрілої активності або загрози безпеці платформи.
          </Text>
        </View>

        {/* 3. ОБМЕЖЕННЯ ТА ІНТЕЛЕКТУАЛЬНА ВЛАСНІСТЬ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <AlertTriangle color={c.accent} size={22} style={s.sectionIcon} />
            <Text style={[s.sectionTitle, { color: c.textMain }]}>Захист інтелектуальної власності</Text>
          </View>
          
          <Text style={[s.text, { color: c.textMuted }]}>
            <Text style={s.boldSub}>3.1. Заборона копіювання.</Text> Усі технології, дизайн, тексти квестів, алгоритми та архітектура коду є виключною власністю AuMentem. Користувачам суворо заборонено проводити реверс-інжиніринг (декомпіляцію), копіювати інтерфейс, видобувати бази даних або використовувати наш контент для навчання сторонніх ШІ-моделей чи створення конкуруючих сервісів.
          </Text>
        </View>

        {/* ДИСКЛЕЙМЕР ЗДОРОВ'Я */}
        <View style={[s.warning, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2' }]}>
           <Text style={[s.warningTitle, { color: '#EF4444' }]}>Медичний дисклеймер:</Text>
           <Text style={[s.text, { color: isDark ? '#FCA5A5' : '#DC2626', textAlign: 'left' }]}>
             Контент, статистика та інтерактивні квести в AuMentem носять виключно ознайомчий та розважальний характер. Вони не є заміною професійної медичної, психологічної чи терапетичної допомоги. Якщо ви відчуваєте погіршення ментального чи фізичного стану, будь ласка, негайно зверніться до лікаря.
           </Text>
        </View>

        {/* 4. ПОЛІТИКА КОНФІДЕНЦІЙНОСТІ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Shield color={c.accent} size={22} style={s.sectionIcon} />
            <Text style={[s.sectionTitle, { color: c.textMain }]}>Політика конфіденційності</Text>
          </View>
          
          <Text style={[s.text, { color: c.textMuted }]}>
            <Text style={s.boldSub}>4.1. Збір даних.</Text> Ми обробляємо дані профілю (email, ім'я) та технічні метрики виключно для забезпечення стабільної роботи додатку, збереження вашого прогресу та відображення внутрішньої статистики.{"\n\n"}
            <Text style={s.boldSub}>4.2. Геолокація.</Text> Додаток запитує доступ до геопозиції виключно з метою генерації інтерактивних точок і завдань поруч із вами. Дані не збираються у фоновому режимі прихованої активності та не передаються рекламодавцям чи третім особам.{"\n\n"}
            <Text style={s.boldSub}>4.3. Видалення даних та акаунту (Право на забуття).</Text> Ви маєте повне право у будь-який момент відкликати свою згоду на обробку даних та видалити свій профіль. Для повного видалення вашого акаунту, а також усіх пов'язаних із ним персональних даних, логів, прогресу та статистики з нашої бази даних, будь ласка, **надішліть офіційний запит у службу підтримки** за адресою <Text style={{ color: c.accent, fontWeight: '600' }} onPress={() => Linking.openURL('mailto:support@aumentem.com')}>support@aumentem.com</Text>. Запит буде оброблено відповідно до чинного законодавства.{"\n\n"}
            <Text style={s.boldSub}>4.4. Сторонні сервіси.</Text> Додаток може використовувати сторонні сервіси для аналітики, push-сповіщень, авторизації чи зберігання даних. Робота таких сервісів регулюється їхніми власними політиками конфіденційності.
          </Text>
        </View>

        {/* FOOTER */}
        <View style={[s.footer, { borderColor: c.border }]}>
           <Text style={[s.footerHint, { color: c.textMuted }]}>Маєте запитання чи пропозиції щодо юридичних умов?</Text>
           <Pressable style={s.contactBtn} onPress={() => Linking.openURL('mailto:support@aumentem.com')}>
              <Mail color={c.accent} size={20} />
              <Text style={[s.contactText, { color: c.accent }]}>support@aumentem.com</Text>
           </Pressable>
           <Text style={s.copyright}>© 2026 AuMentem Inc. Усі права захищено.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 8 },
  content: { padding: Spacing.screenX, paddingBottom: 60 },
  logoArea: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  logoText: { fontSize: 34, fontWeight: '900', letterSpacing: -0.5 },
  subLogoText: { fontSize: 11, color: '#999', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 },
  updateDate: { fontSize: 12, color: '#777', marginTop: 6, fontStyle: 'italic' },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { marginRight: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  boldSub: { fontWeight: '700', color: undefined },
  text: { fontSize: 14, lineHeight: 22, textAlign: 'left' },
  warning: { padding: 18, borderRadius: Radii.lg, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  warningTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  footer: { marginTop: 24, alignItems: 'center', borderTopWidth: 1, paddingTop: 24 },
  footerHint: { fontSize: 13, marginBottom: 12, textAlign: 'center' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: Radii.md },
  contactText: { fontSize: 15, fontWeight: '600', marginLeft: 8 },
  copyright: { fontSize: 12, color: '#AAA', marginTop: 16 }
});