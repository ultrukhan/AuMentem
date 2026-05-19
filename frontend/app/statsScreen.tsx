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

import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playClickSound } from '@/utils/audio';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSinglePress } from '@/hooks/useSinglePress';
import { cardShadow } from '@/utils/shadowStyle';
import AnimatedCard from '@/components/AnimatedCard';
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
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK');

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
    }, [])
  );

  const chartData = useMemo(() => {
    if (stats.length === 0) return [];

    if (timeRange === 'WEEK') {
      return stats.slice(0, 5).reverse().map(s => {
        const d = new Date(s.week_start);
        return {
          id: s.id,
          label: `${d.getDate()}.${d.getMonth() + 1}`,
          value: s.total_score
        };
      });
    }

    if (timeRange === 'MONTH') {
      const monthlyData: Record<string, number> = {};
      stats.forEach(s => {
        const d = new Date(s.week_start);
        const monthKey = d.toLocaleString('uk-UA', { month: 'short' }); 
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + s.total_score;
      });
      return Object.entries(monthlyData).slice(0, 5).reverse().map(([label, value], i) => ({
        id: `month-${i}`, label, value
      }));
    }

    if (timeRange === 'YEAR') {
      const yearlyData: Record<string, number> = {};
      stats.forEach(s => {
        const yearKey = new Date(s.week_start).getFullYear().toString();
        yearlyData[yearKey] = (yearlyData[yearKey] || 0) + s.total_score;
      });
      return Object.entries(yearlyData).reverse().map(([label, value], i) => ({
        id: `year-${i}`, label, value
      }));
    }

    return [];
  }, [stats, timeRange]);

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

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const maxScore = Math.max(...chartData.map(s => s.value), 10); 

    return (
      <View style={[s.chartCard, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(themeKey, 'soft')]}>
        
        <View style={[s.tabsContainer, { backgroundColor: c.background }]}>
          {(['WEEK', 'MONTH', 'YEAR'] as TimeRange[]).map((tab) => {
            const isActive = timeRange === tab;
            const labels = { WEEK: 'Тижні', MONTH: 'Місяці', YEAR: 'Роки' };
            return (
              <AnimatedCard
                key={tab}
                animationsEnabled={animationsEnabled}
                onPress={() => { playClickSound(); setTimeRange(tab); }}
                style={[s.tabBtn, isActive && { backgroundColor: c.cardBg, ...cardShadow(themeKey, 'soft') }]}
              >
                <Text style={[s.tabText, { color: isActive ? c.textMain : c.textMuted, fontWeight: isActive ? '700' : '500' }]} numberOfLines={1}>
                  {labels[tab]}
                </Text>
              </AnimatedCard>
            );
          })}
        </View>

        <View style={s.chartContainer}>
          {chartData.map((item, index) => {
            const barHeight = (item.value / maxScore) * 100; 
            const isLatest = index === chartData.length - 1; 

            return (
              <View key={item.id} style={s.barWrapper}>
                <Text style={[s.barValue, { color: isLatest ? c.accent : c.textMuted }]}>{item.value}</Text>
                <View style={s.barBackground}>
                  <View 
                    style={[
                      s.barFill, 
                      { height: `${barHeight}%`, backgroundColor: isLatest ? c.accent : c.border }
                    ]} 
                  />
                </View>
                <Text style={[s.barLabel, { color: c.textMuted }]} numberOfLines={1}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const latestStat = stats.length > 0 ? stats[0] : null;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={s.header}>
        <Pressable 
          onPress={() => runOnce(() => { playClickSound(); router.back(); })}
          style={({ pressed }) => [s.roundBackBtn, { backgroundColor: c.cardBg, borderColor: c.border }, cardShadow(themeKey, 'soft'), pressed && { opacity: 0.7 }]}
        >
          <ArrowLeft color={c.textMain} size={24} strokeWidth={2.5} />
        </Pressable>
        <Text style={[s.screenTitle, { color: c.textMain }]}>Моя статистика 📊</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.screenX, gap: 16, marginTop: 24 }}>
          <Skeleton colorMode={isDark ? 'dark' : 'light'} width="100%" height={220} radius={24} />
          <Skeleton colorMode={isDark ? 'dark' : 'light'} width="100%" height={120} radius={24} />
        </View>
      ) : stats.length === 0 ? (
        <ScrollView
          contentContainerStyle={s.emptyScroll}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
        >
          
          {renderChart()}

          <Text style={[Typography.titleLg, { color: c.textMain, marginTop: 24, marginBottom: 16 }]}>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, marginTop: 8, marginBottom: 16 },
  roundBackBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  screenTitle: { ...Typography.titleXl, fontSize: 26 },
  scrollContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 40 },
  
  emptyScroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  emptyStateContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },

  chartCard: { padding: 16, borderRadius: Radii.xl, borderWidth: 1, marginTop: 10 },
  tabsContainer: { flexDirection: 'row', borderRadius: Radii.lg, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radii.md },
  tabText: { fontSize: 14 },
  
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