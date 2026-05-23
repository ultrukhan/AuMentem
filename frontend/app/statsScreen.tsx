import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, Pressable, ScrollView, Dimensions, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { 
  ArrowLeft, BarChart3, Calendar, MapPin, Trophy, Target, Sparkles 
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

const CatPath = "M290.59 192c-20.18 0-106.82 1.98-162.59 85.95V192c0-52.94-43.06-96-96-96-17.67 0-32 14.33-32 32s14.33 32 32 32c17.64 0 32 14.36 32 32v256c0 35.3 28.7 64 64 64h176c8.84 0 16-7.16 16-16v-16c0-17.67-14.33-32-32-32h-32l128-96v144c0 8.84 7.16 16 16 16h32c8.84 0 16-7.16 16-16V289.86c-10.29 2.67-20.89 4.54-32 4.54-61.81 0-113.52-44.05-125.41-102.4zM448 96h-64l-64-64v134.4c0 53.02 42.98 96 96 96s96-42.98 96-96V32l-64 64zm-72 80c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16zm80 0c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z";
const DogPath = "M298.06,224,448,277.55V496a16,16,0,0,1-16,16H368a16,16,0,0,1-16-16V384H192V496a16,16,0,0,1-16,16H112a16,16,0,0,1-16-16V282.09C58.84,268.84,32,233.66,32,192a32,32,0,0,1,64,0,32.06,32.06,0,0,0,32,32ZM544,112v32a64,64,0,0,1-64,64H448v35.58L320,197.87V48c0-14.25,17.22-21.39,27.31-11.31L374.59,64h53.63c10.91,0,23.75,7.92,28.62,17.69L464,96h64A16,16,0,0,1,544,112Zm-112,0a16,16,0,1,0-16,16A16,16,0,0,0,432,112Z";
const BirdPath = "M544 32h-16.36C513.04 12.68 490.09 0 464 0c-44.18 0-80 35.82-80 80v20.98L12.09 393.57A30.216 30.216 0 0 0 0 417.74c0 22.46 23.64 37.07 43.73 27.03L165.27 384h96.49l44.41 120.1c2.27 6.23 9.15 9.44 15.38 7.17l22.55-8.21c6.23-2.27 9.44-9.15 7.17-15.38L312.94 384H352c1.91 0 3.76-.23 5.66-.29l44.51 120.38c2.27 6.23 9.15 9.44 15.38 7.17l22.55-8.21c6.23-2.27 9.44-9.15 7.17-15.38l-41.24-111.53C485.74 352.8 544 279.26 544 192v-80l96-16c0-35.35-42.98-64-96-64zm-80 72c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z";

const PetIcon = ({ type, color, size }: { type: number, color: string, size: number }) => {
  const paths = [CatPath, DogPath, BirdPath];
  const viewBoxes = ["0 0 512 512", "0 0 576 512", "0 0 640 512"];
  return (
    <Svg width={size} height={size} viewBox={viewBoxes[type]}>
      <Path d={paths[type]} fill={color} />
    </Svg>
  );
};

import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playClickSound } from '@/utils/audio';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSinglePress } from '@/hooks/useSinglePress';
import { cardShadow } from '@/utils/shadowStyle';
import AnimatedCard from '@/components/AnimatedCard';
import FadeInView from '@/components/FadeInView';
import { Skeleton } from 'moti/skeleton';
import { MotiView } from 'moti';

interface WeeklyStat {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  geo_quests_completed: number;
  mini_quests_completed: number;
  active_days: number;
  top_hobby: string | null;
  unique_locations: number;
  total_score: number;
}

const { width } = Dimensions.get('window');

type TimeRange = 'WEEK' | 'MONTH' | 'YEAR';

export default function StatsScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const themeKey = isDark ? 'dark' : 'light';
  const c = Colors[themeKey];
  const { animationsEnabled } = useAppSettings();
  const runOnce = useSinglePress();

  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [petType, setPetType] = useState<number>(0);

  const fetchStats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/stats/my-weekly-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Помилка завантаження статистики:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      SecureStore.getItemAsync('selectedPetType').then(val => {
        if (val !== null) setPetType(Number(val));
      });
    }, [])
  );


  const renderEmptyState = () => (
    <View style={s.emptyStateContainer}>
      <View style={[s.iconCircle, { backgroundColor: `${c.accent}15` }]}>
        <BarChart3 color={c.accent} size={48} strokeWidth={1.5} />
      </View>
      <Text style={[Typography.titleXl, { color: c.textMain, marginTop: 24, textAlign: 'center' }]}>
        Ще немає даних
      </Text>
      <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 24 }]}>
        Виконуй квести — тут з'явиться твоя статистика. Перший звіт згенерується наприкінці тижня. 🚀
      </Text>
    </View>
  );

  const renderPetBanner = () => (
    <View style={[s.scoreBanner, { backgroundColor: c.cardBg, borderColor: c.accent, borderWidth: 1.5, marginBottom: 24 }, cardShadow(themeKey, 'soft')]}>
      <View style={{ height: 110, justifyContent: 'flex-end', marginBottom: 16 }}>
        <MotiView
          key={petType}
          from={{ translateY: 0, scaleY: 1, scaleX: 1 }}
          animate={animationsEnabled ? { translateY: -35, scaleY: 1.1, scaleX: 0.95 } : { translateY: 0, scaleY: 1, scaleX: 1 }}
          transition={{
            type: 'timing',
            duration: animationsEnabled ? 450 : 0,
            loop: animationsEnabled,
            repeatReverse: animationsEnabled,
          }}
          style={{ alignItems: 'center' }}
        >
          <Pressable onPress={() => {
            playClickSound();
            setPetType((prev) => {
              const next = (prev + 1) % 3;
              SecureStore.setItemAsync('selectedPetType', String(next));
              return next;
            });
          }}>
            <PetIcon type={petType} color={c.accent} size={80} />
          </Pressable>
        </MotiView>
        <MotiView
          key={`shadow-${petType}`}
          from={{ scaleX: 1, opacity: 0.3 }}
          animate={{ scaleX: 0.5, opacity: 0.1 }}
          transition={{ type: 'timing', duration: 450, loop: true, repeatReverse: true }}
          style={{ width: 60, height: 10, borderRadius: 50, backgroundColor: c.textMain, position: 'absolute', bottom: -5, alignSelf: 'center' }}
        />
      </View>
      <Text style={[Typography.titleXl, { color: c.textMain, fontSize: 24, textAlign: 'center' }]}>
        Твій улюбленець радіє! 🎉
      </Text>
      <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 16, lineHeight: 22 }]}>
        Він пишається тобою за виконання квестів. Продовжуй в тому ж дусі!
      </Text>
    </View>
  );


  const latestStat = stats.length > 0 ? stats[0] : null;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={s.header}>
        <AnimatedCard animationsEnabled={animationsEnabled} onPress={() => { playClickSound(); router.back(); }} style={[s.roundBackBtn, { backgroundColor: c.cardBg }]}>
          <ArrowLeft color={c.textMain} size={24} />
        </AnimatedCard>
        <Text style={[Typography.titleLg, { color: c.textMain }]}>Твоя статистика</Text>
        <View style={{ width: 48 }} />
      </View>

      <FadeInView animationsEnabled={animationsEnabled} style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ padding: Spacing.screenX, gap: 16, marginTop: 24 }}>
            <Skeleton colorMode={isDark ? 'dark' : 'light'} width="100%" height={220} radius={24} />
            <Skeleton colorMode={isDark ? 'dark' : 'light'} width="100%" height={120} radius={24} />
          </View>
        ) : stats.length === 0 ? (
          <ScrollView
            contentContainerStyle={[s.emptyScroll, { paddingTop: 24 }]}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
          >
            {renderPetBanner()}
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.scrollContent, { paddingTop: 24 }]}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
          >
            
            {renderPetBanner()}

            <Text style={[Typography.titleLg, { color: c.textMain, marginBottom: 16 }]}>
              Підсумки останнього тижня
            </Text>

            <View style={s.gridContainer}>
              {[
                { icon: Target, color: '#F59E0B', bg: '#F59E0B15', value: latestStat?.mini_quests_completed, label: 'Міні-квестів' },
                { icon: MapPin, color: '#3B82F6', bg: '#3B82F615', value: latestStat?.geo_quests_completed, label: 'Гео-квестів' },
                { icon: Calendar, color: '#10B981', bg: '#10B98115', value: latestStat?.active_days, label: 'Активних днів' },
                { icon: Sparkles, color: '#8B5CF6', bg: '#8B5CF615', value: latestStat?.unique_locations, label: 'Нових локацій' },
              ].map((metric, index) => {
                const card = (
                  <View style={[s.metricCard, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(themeKey, 'soft')]}>
                    <View style={[s.iconBox, { backgroundColor: metric.bg }]}><metric.icon color={metric.color} size={24} /></View>
                    <Text style={[s.metricValue, { color: c.textMain }]}>{metric.value ?? 0}</Text>
                    <Text style={[s.metricLabel, { color: c.textMuted }]} numberOfLines={2}>{metric.label}</Text>
                  </View>
                );
                if (!animationsEnabled) return <View key={metric.label}>{card}</View>;
                return (
                  <MotiView
                    key={metric.label}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 350, delay: index * 60 }}
                  >
                    {card}
                  </MotiView>
                );
              })}
            </View>

            {latestStat?.top_hobby && (
              <View style={[s.hobbyCard, { backgroundColor: c.accent }, cardShadow(themeKey, 'soft')]}>
                <Trophy color="#FFF" size={32} />
                <View style={s.hobbyTextCol}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>Хобі тижня</Text>
                  <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>{latestStat.top_hobby}</Text>
                </View>
              </View>
            )}

          </ScrollView>
        )}
      </FadeInView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, marginTop: 8, marginBottom: 16 },
  roundBackBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  screenTitle: { ...Typography.titleXl, fontSize: 26 },
  scrollContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 40 },
  
  emptyScroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40, paddingHorizontal: Spacing.screenX },
  emptyStateContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },

  chartCard: { padding: 16, borderRadius: Radii.xl, borderWidth: 1, marginTop: 10 },
  tabsContainer: { flexDirection: 'row', borderRadius: Radii.lg, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radii.md },
  tabText: { fontSize: 14 },
  
  scoreBanner: { padding: 24, borderRadius: Radii.xl, alignItems: 'center', marginTop: 10 },
  scoreIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  barWrapper: { alignItems: 'center', flex: 1 },
  barBackground: { width: 16, height: 100, backgroundColor: 'transparent', justifyContent: 'flex-end', borderRadius: 8, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { ...Typography.muted, fontSize: 11, marginTop: 8, textTransform: 'capitalize' },
  barValue: { ...Typography.body, fontSize: 12, fontWeight: '700', marginBottom: 6 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  metricCard: { width: (width - Spacing.screenX * 2 - 16) / 2, padding: 16, borderRadius: Radii.lg, borderWidth: 1, alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { ...Typography.titleLg, fontSize: 28, marginBottom: 4 },
  metricLabel: { ...Typography.body, fontSize: 13, fontWeight: '500', textAlign: 'center' },

  hobbyCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: Radii.xl, marginTop: 16, gap: 16 },
  hobbyTextCol: { flex: 1 },
});