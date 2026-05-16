import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { 
  ArrowLeft, BarChart3, Calendar, MapPin, Trophy, Target, Sparkles 
} from 'lucide-react-native';

import { Colors, Typography, Radii, Shadows, Spacing } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playClickSound } from '@/utils/audio';

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
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK');

  const fetchStats = async () => {
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const chartData = useMemo(() => {
    if (stats.length === 0) return [];

    if (timeRange === 'WEEK') {
      // Показуємо останні 5 тижнів
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
      // Групуємо по місяцях (наприклад, "Січ", "Лют")
      const monthlyData: Record<string, number> = {};
      stats.forEach(s => {
        const d = new Date(s.week_start);
        const monthKey = d.toLocaleString('uk-UA', { month: 'short' }); 
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + s.total_score;
      });
      // Беремо останні 5 місяців
      return Object.entries(monthlyData).slice(0, 5).reverse().map(([label, value], i) => ({
        id: `month-${i}`, label, value
      }));
    }

    if (timeRange === 'YEAR') {
      // Групуємо по роках (наприклад, "2025", "2026")
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
        Статистика формується...
      </Text>
      <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 24 }]}>
        Ми збираємо твої успіхи! Перший звіт з'явиться тут у найближчий понеділок о 00:00. Продовжуй виконувати квести! 🚀
      </Text>
    </View>
  );

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const maxScore = Math.max(...chartData.map(s => s.value), 10); 

    return (
      <View style={[s.chartCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
        
        {/* ПЕРЕМИКАЧ ТАБІВ */}
        <View style={[s.tabsContainer, { backgroundColor: c.background }]}>
          {(['WEEK', 'MONTH', 'YEAR'] as TimeRange[]).map((tab) => {
            const isActive = timeRange === tab;
            const labels = { WEEK: 'Тижні', MONTH: 'Місяці', YEAR: 'Роки' };
            return (
              <Pressable
                key={tab}
                onPress={() => { playClickSound(); setTimeRange(tab); }}
                style={[s.tabBtn, isActive && { backgroundColor: c.cardBg, ...sh.soft }]}
              >
                <Text style={[s.tabText, { color: isActive ? c.textMain : c.textMuted, fontWeight: isActive ? '700' : '500' }]}>
                  {labels[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ГРАФІК */}
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
          onPress={() => { playClickSound(); router.back(); }}
          style={({ pressed }) => [s.roundBackBtn, { backgroundColor: c.cardBg, borderColor: c.border }, pressed && { opacity: 0.7 }]}
        >
          <ArrowLeft color={c.textMain} size={24} strokeWidth={2.5} />
        </Pressable>
        <Text style={[s.screenTitle, { color: c.textMain }]}>Моя статистика 📊</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 80 }} />
      ) : stats.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          
          {renderChart()}

          <Text style={[Typography.titleLg, { color: c.textMain, marginTop: 24, marginBottom: 16 }]}>
            Підсумки останнього тижня
          </Text>

          <View style={s.gridContainer}>
            <View style={[s.metricCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <View style={[s.iconBox, { backgroundColor: '#F59E0B15' }]}><Target color="#F59E0B" size={24} /></View>
              <Text style={[s.metricValue, { color: c.textMain }]}>{latestStat?.mini_quests_completed}</Text>
              <Text style={[s.metricLabel, { color: c.textMuted }]}>Міні-квестів</Text>
            </View>

            <View style={[s.metricCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <View style={[s.iconBox, { backgroundColor: '#3B82F615' }]}><MapPin color="#3B82F6" size={24} /></View>
              <Text style={[s.metricValue, { color: c.textMain }]}>{latestStat?.geo_quests_completed}</Text>
              <Text style={[s.metricLabel, { color: c.textMuted }]}>Гео-квестів</Text>
            </View>

            <View style={[s.metricCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <View style={[s.iconBox, { backgroundColor: '#10B98115' }]}><Calendar color="#10B981" size={24} /></View>
              <Text style={[s.metricValue, { color: c.textMain }]}>{latestStat?.active_days}</Text>
              <Text style={[s.metricLabel, { color: c.textMuted }]}>Активних днів</Text>
            </View>

            <View style={[s.metricCard, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
              <View style={[s.iconBox, { backgroundColor: '#8B5CF615' }]}><Sparkles color="#8B5CF6" size={24} /></View>
              <Text style={[s.metricValue, { color: c.textMain }]}>{latestStat?.unique_locations}</Text>
              <Text style={[s.metricLabel, { color: c.textMuted }]}>Нових локацій</Text>
            </View>
          </View>

          {latestStat?.top_hobby && (
            <View style={[s.hobbyCard, { backgroundColor: c.accent }, sh.strong]}>
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
  
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginTop: -60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },

  // Графік та Таби
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

  // Сітка карток
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  metricCard: { width: (width - Spacing.screenX * 2 - 16) / 2, padding: 16, borderRadius: Radii.lg, borderWidth: 1, alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { ...Typography.titleLg, fontSize: 28, marginBottom: 4 },
  metricLabel: { ...Typography.body, fontSize: 13, fontWeight: '500', textAlign: 'center' },

  // Хобі
  hobbyCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: Radii.xl, marginTop: 16, gap: 16 },
  hobbyTextCol: { flex: 1 },
});