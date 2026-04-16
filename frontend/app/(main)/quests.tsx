import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ImageBackground, 
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Activity, 
  Footprints, 
  Palette,
  CheckCircle2
} from 'lucide-react-native';

export default function QuestsScreen() {
  const router = useRouter();
  
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';

  const colors = {
    overlay: isDark ? 'rgba(15, 20, 30, 0.75)' : 'rgba(0, 0, 0, 0.2)', 
    cardBg: isDark ? 'rgba(26, 32, 53, 0.85)' : 'rgba(255, 255, 255, 0.92)',
    textMain: isDark ? '#EFF6FF' : '#2D1B08',
    textMuted: isDark ? '#94A3B8' : 'rgba(45, 27, 8, 0.7)',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.85)',
    iconBg: isDark ? 'rgba(45, 212, 191, 0.15)' : '#FEF3C7',
    iconColor: isDark ? '#2DD4BF' : '#F97316', 
  };

  const quests = [
    {
      id: 1,
      title: 'ЩОДЕННА МЕДИТАЦІЯ',
      subtitle: 'Занурся в тишу на 10 хвилин',
      status: 'В ПРОЦЕСІ',
      statusBg: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
      statusColor: isDark ? '#CBD5E1' : '#6B7280',
      buttonText: 'ПРОДОВЖИТИ',
      icon: Activity,
      isCompleted: false,
    },
    {
      id: 2,
      title: 'ЛЕГКИЙ РУХ',
      subtitle: 'Півгодинна прогулянка в парку',
      status: 'ДОСТУПНО',
      statusBg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
      statusColor: isDark ? '#93C5FD' : '#1D4ED8',
      buttonText: 'ПОЧАТИ',
      icon: Footprints,
      isCompleted: false,
    },
    {
      id: 3,
      title: 'ТВОРЧЕ ЗАВДАННЯ',
      subtitle: 'Створи малюнок свого спокою',
      status: 'ВИКОНАНО',
      statusColor: isDark ? '#4ADE80' : '#16A34A',
      buttonText: 'ПЕРЕГЛЯНУТИ',
      icon: Palette,
      isCompleted: true,
    },
  ];

  return (
    <ImageBackground 
      source={require('@/assets/images/rain-window.png')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />

      <SafeAreaView style={s.safe}>
        
        <View style={s.header}>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: colors.headerBtnBg }, 
              pressed && s.pressed
            ]}
          >
            <ArrowLeft color={colors.textMain} size={24} strokeWidth={2} />
          </Pressable>

          <View style={s.headerRight}>
            <Pressable style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: colors.headerBtnBg }, 
              pressed && s.pressed
            ]}>
              <User color={colors.textMain} size={24} strokeWidth={2} />
            </Pressable>
            <Pressable style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: colors.headerBtnBg }, 
              pressed && s.pressed
            ]}>
              <Settings color={colors.textMain} size={24} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <Text style={s.mainTitle}>Квести</Text>

        <ScrollView 
          style={s.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }} 
        >
          {quests.map((quest) => {
            const IconComponent = quest.icon;

            return (
              <View key={quest.id} style={[s.card, { backgroundColor: colors.cardBg }]}>
                
                <View style={[s.iconBox, { backgroundColor: colors.iconBg }]}>
                  <IconComponent color={colors.iconColor} size={32} strokeWidth={2} />
                </View>

                <View style={s.cardContent}>
                  <Text style={[s.questTitle, { color: colors.textMain }]}>
                    {quest.title}
                  </Text>
                  <Text style={[s.questSubtitle, { color: colors.textMuted }]}>
                    {quest.subtitle}
                  </Text>

                  <View style={s.statusRow}>
                    {quest.isCompleted ? (
                      <View style={s.completedStatus}>
                        <Text style={[s.statusText, { color: quest.statusColor }]}>
                          {quest.status}
                        </Text>
                        <CheckCircle2 color={quest.statusColor} size={14} strokeWidth={2.5} />
                      </View>
                    ) : (
                      <View style={[s.statusBadge, { backgroundColor: quest.statusBg }]}>
                        <Text style={[s.statusText, { color: quest.statusColor }]}>
                          {quest.status}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Pressable style={({ pressed }) => [
                    s.actionButton,
                    isDark ? s.actionButtonDark : s.actionButtonLight,
                    pressed && s.pressedButtonBase,
                    pressed && isDark && s.pressedButtonDark, 
                    pressed && !isDark && s.pressedButtonLight 
                  ]}>
                    <Text style={s.actionButtonText}>{quest.buttonText}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontFamily: 'Nunito',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 24,
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  cardContent: {
    flex: 1,
  },
  questTitle: {
    fontFamily: 'Nunito',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  questSubtitle: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Nunito',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  actionButton: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  
  actionButtonLight: {
    backgroundColor: '#F97316', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  
  actionButtonDark: {
    backgroundColor: '#0F766E', 
    shadowColor: '#2DD4BF', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, 
    shadowRadius: 8, 
    elevation: 8,
  },
  
  actionButtonText: {
    fontFamily: 'Nunito',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  
  pressedButtonBase: {
    transform: [{ scale: 0.95 }], 
  },
  
  pressedButtonLight: {
    backgroundColor: '#EA580C', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2, 
  },
  
  pressedButtonDark: {
    backgroundColor: '#115E59', 
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, 
    shadowRadius: 3,
    elevation: 2,
  },
});