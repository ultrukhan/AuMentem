import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, User, Settings, Activity, Footprints, Palette, CheckCircle2, Sparkles, Star, Check, Share, Ghost, Hash, Smile, Meh, Frown, Code, BookOpen, Bike, Camera, Coffee, Heart, Compass, Library, Music, Gamepad2, Dumbbell, Leaf, Film, Brain, PawPrint, Car, PenTool, Globe, Calculator } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants/api';
import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, interpolate, Extrapolation, FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import AnimatedBackground from '@/components/AnimatedBackground';
import ConfettiCannon from 'react-native-confetti-cannon';
import Toast from 'react-native-toast-message';
import { playClickSound, playSuccessSound } from '@/utils/audio';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '@/components/AnimatedCard';
import { useAppSettings } from '@/hooks/useAppSettings';
import { parseApiError } from '@/utils/apiErrors';
import { fetchWithCache } from '@/utils/apiWithCache';
import { SyncManager } from '@/utils/SyncManager';
const getHobbyIcon = (name: string, color: string, size: number) => {
  if (!name) return <Hash color={color} size={size} />;
  const lower = name.toLowerCase();
  if (lower.includes('йога') || lower.includes('медит') || lower.includes('yoga')) return <Star color={color} size={size} />;
  if (lower.includes('програм') || lower.includes('код') || lower.includes('code') || lower.includes('program')) return <Code color={color} size={size} />;
  if (lower.includes('читан') || lower.includes('книг') || lower.includes('read') || lower.includes('book')) return <BookOpen color={color} size={size} />;
  if (lower.includes('вело') || lower.includes('bike') || lower.includes('cycl')) return <Bike color={color} size={size} />;
  if (lower.includes('фото') || lower.includes('photo')) return <Camera color={color} size={size} />;
  if (lower.includes('малюв') || lower.includes('мист') || lower.includes('art') || lower.includes('paint') || lower.includes('draw')) return <Palette color={color} size={size} />;
  if (lower.includes('кулін') || lower.includes('готув') || lower.includes('cook') || lower.includes('bake')) return <Coffee color={color} size={size} />;
  if (lower.includes('волонтер') || lower.includes('допомог') || lower.includes('volunteer')) return <Heart color={color} size={size} />;
  if (lower.includes('спорт') || lower.includes('фітнес') || lower.includes('sport') || lower.includes('fitness')) return <Dumbbell color={color} size={size} />;
  if (lower.includes('музик') || lower.includes('music')) return <Music color={color} size={size} />;
  if (lower.includes('ігр') || lower.includes('game')) return <Gamepad2 color={color} size={size} />;
  if (lower.includes('істор') || lower.includes('history')) return <Library color={color} size={size} />;
  if (lower.includes('садівн') || lower.includes('рослин') || lower.includes('garden')) return <Leaf color={color} size={size} />;
  if (lower.includes('кіно') || lower.includes('фільм') || lower.includes('cinema') || lower.includes('movie')) return <Film color={color} size={size} />;
  if (lower.includes('психол') || lower.includes('psychology')) return <Brain color={color} size={size} />;
  if (lower.includes('танц') || lower.includes('dance')) return <Music color={color} size={size} />;
  if (lower.includes('тварин') || lower.includes('animal') || lower.includes('pet')) return <PawPrint color={color} size={size} />;
  if (lower.includes('авто') || lower.includes('машин') || lower.includes('car')) return <Car color={color} size={size} />;
  if (lower.includes('дизайн') || lower.includes('design')) return <PenTool color={color} size={size} />;
  if (lower.includes('мов') || lower.includes('lang')) return <Globe color={color} size={size} />;
  if (lower.includes('математ') || lower.includes('math')) return <Calculator color={color} size={size} />;
  return <Hash color={color} size={size} />;
};

const SkeletonCard = ({ c, isDark }: any) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => { opacity.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true) }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, animStyle]}>
      <View style={[s.iconBoxInner, { backgroundColor: c.iconBg }]} />
      <View style={s.cardContent}>
        <View style={{ height: 20, width: '70%', backgroundColor: c.iconBg, borderRadius: 4, marginBottom: 8 }} />
        <View style={{ height: 14, width: '40%', backgroundColor: c.iconBg, borderRadius: 4, marginBottom: 16 }} />
        <View style={{ height: 44, width: '100%', backgroundColor: c.iconBg, borderRadius: Radii.full }} />
      </View>
    </Animated.View>
  );
};

const getFlowerProps = (hobbies: any[], id: string) => {
  const colors = ['#FF6B6B', '#60A5FA', '#C084FC', '#FBBF24', '#34D399', '#F472B6', '#F87171', '#38BDF8'];
  const centerColors = ['#FFD700', '#FFFFFF', '#FEF08A', '#FBCFE8'];
  const scales = [0.85, 0.95, 1.05, 1.15];
  let seedStr = id;
  if (hobbies && hobbies.length > 0) { seedStr += hobbies[0].name; }
  const sum = seedStr.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  return {
    color: colors[sum % colors.length],
    center: centerColors[sum % centerColors.length],
    scale: scales[sum % scales.length],
    isPointy: sum % 2 === 0
  };
};

const MiniPlant = ({ status, hobbies, id }: { status: string, hobbies: any[], id: string }) => {
  const animatedProgress = useSharedValue(0);
  const { color, center, scale, isPointy } = useMemo(() => getFlowerProps(hobbies, id), [hobbies, id]);

  useEffect(() => {
    const target = status === 'COMPLETED' ? 1 : status === 'IN_PROGRESS' ? 0.6 : 0.2;
    animatedProgress.value = withSpring(target, { damping: 14, stiffness: 90 });
  }, [status]);
  
  const stemStyle = useAnimatedStyle(() => ({ height: interpolate(animatedProgress.value, [0, 1], [0, 45], Extrapolation.CLAMP) }));
  const leafStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(animatedProgress.value, [0.3, 0.6], [0, 1], Extrapolation.CLAMP) }], opacity: interpolate(animatedProgress.value, [0.3, 0.5], [0, 1], Extrapolation.CLAMP) }));
  const flowerHeadStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(animatedProgress.value, [0.6, 1], [0, scale], Extrapolation.CLAMP) }, { rotate: `${interpolate(animatedProgress.value, [0.6, 1], [0, 360], Extrapolation.CLAMP)}deg` }], opacity: interpolate(animatedProgress.value, [0.6, 0.8], [0, 1], Extrapolation.CLAMP) }));

  const petalShape = isPointy ? { borderTopLeftRadius: 10, borderBottomRightRadius: 10, borderTopRightRadius: 2, borderBottomLeftRadius: 2 } : { borderRadius: 6 };
  
  return (
    <View style={s.miniPlantContainer}>
      <Animated.View style={[s.miniFlowerHead, flowerHeadStyle]}>
        <View style={[s.miniPetal, s.miniPetal1, petalShape, { backgroundColor: color }]} />
        <View style={[s.miniPetal, s.miniPetal2, petalShape, { backgroundColor: color }]} />
        <View style={[s.miniPetal, s.miniPetal3, petalShape, { backgroundColor: color }]} />
        <View style={[s.miniPetal, s.miniPetal4, petalShape, { backgroundColor: color }]} />
        <View style={[s.miniFlowerCenter, { backgroundColor: center }]} />
      </Animated.View>
      <View style={s.miniStemWrapper}>
        <Animated.View style={[s.miniStem, stemStyle, { backgroundColor: '#4CAF50' }]} />
        <Animated.View style={[s.miniLeaf, s.miniLeafLeft, leafStyle, { backgroundColor: '#4CAF50' }]} />
        <Animated.View style={[s.miniLeaf, s.miniLeafRight, leafStyle, { backgroundColor: '#4CAF50' }]} />
      </View>
      <View style={[s.miniPot, { backgroundColor: '#8B4513' }]}><View style={[s.miniPotRim, { backgroundColor: '#A0522D' }]} /></View>
    </View>
  );
};

export default function QuestsScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  
  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [questToShare, setQuestToShare] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [evalQuestId, setEvalQuestId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const { animationsEnabled } = useAppSettings();

  const toggleExpand = (id: string) => {
    playClickSound();
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const totalQuests = quests.length;
  const completedQuestsCount = quests.filter(q => q.status === 'COMPLETED').length;

  const gardenQuests = useMemo(
    () => [...quests].sort((a, b) => a.id.localeCompare(b.id)),
    [quests]
  );

  const loadQuests = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetchWithCache(`${BASE_URL}/mini-quests/daily`, { 
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal,
        cacheKey: `quests_daily_${token}`
      });
      clearTimeout(timeoutId);
      if (response.ok && response.data) {
        const data = response.data;
        const priority: Record<string, number> = { 'IN_PROGRESS': 1, 'AVAILABLE': 2, 'COMPLETED': 3 };
        const sorted = data.sort((a: any, b: any) => (priority[a.status] || 99) - (priority[b.status] || 99));
        setQuests(sorted.slice(0, 5));
      }
    } catch (error) { Toast.show({ type: 'error', text1: 'Помилка', text2: 'Не вдалося завантажити квести' }); } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadQuests(false);
  };

  useFocusEffect(useCallback(() => {
    loadQuests(true);
    return () => {};
  }, []));

  const handleUpdateStatus = async (questId: string, action: 'start' | 'complete') => {
    playClickSound(); setActionLoadingId(questId);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      let success = false;
      try {
        const response = await fetch(`${BASE_URL}/mini-quests/my-quests/${questId}/${action}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) success = true;
      } catch (e) {
        await SyncManager.enqueueAction(`${BASE_URL}/mini-quests/my-quests/${questId}/${action}`, 'PATCH');
        success = true;
        Toast.show({ type: 'info', text1: 'Офлайн', text2: 'Дію збережено. Буде відправлено пізніше.' });
      }

      if (success) {
        setQuests(prev => {
          const newQuests = prev.map(q => q.id === questId ? { ...q, status: action === 'complete' ? 'COMPLETED' : 'IN_PROGRESS' } : q);
          AsyncStorage.setItem(`quests_daily_${token}`, JSON.stringify(newQuests)).catch(() => {});
          return newQuests;
        });
        if (action === 'complete') {
          playSuccessSound();
          let defaultAnonymous = false;
          const savedSettings = await SecureStore.getItemAsync('userSettings');
          if (savedSettings) { try { defaultAnonymous = !!JSON.parse(savedSettings).anonymousMode; } catch (e) {} }
          if (animationsEnabled) {
            setShowConfetti(true);
            setTimeout(() => { setQuestToShare(questId); setIsAnonymous(defaultAnonymous); setShareModalVisible(true); }, 1500);
            setTimeout(() => setShowConfetti(false), 4000);
          } else {
            setQuestToShare(questId); setIsAnonymous(defaultAnonymous); setShareModalVisible(true);
          }
        }
      } else { Toast.show({ type: 'error', text1: 'Помилка', text2: 'Не вдалося оновити статус' }); }
    } catch (error) { Toast.show({ type: 'error', text1: 'Помилка мережі', text2: 'Перевір підключення до інтернету' }); } finally { setActionLoadingId(null); }
  };

  const handleShareQuest = async () => {
    playClickSound(); if (!questToShare) return; setIsSharing(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_mini_quest_id: questToShare, is_anonymous: isAnonymous }) });
      if (response.ok) {
        setShareModalVisible(false); setQuestToShare(null);
        Toast.show({ type: 'success', text1: 'Супер! 🎉', text2: 'Твій успіх вже у стрічці підтримки.' });
      } else { Toast.show({ type: 'error', text1: 'Помилка', text2: 'Не вдалося опублікувати пост' }); }
    } catch (error) { Toast.show({ type: 'error', text1: 'Помилка мережі', text2: 'Перевір підключення до інтернету' }); } finally { setIsSharing(false); }
  };

  const promptEvaluation = (questId: string) => { playClickSound(); setEvalQuestId(questId); setEvalModalVisible(true); };

  const handleEvaluate = async (evaluation: 'BETTER' | 'SAME' | 'WORSE') => {
    if (!evalQuestId) return; playClickSound(); setEvalModalVisible(false); setActionLoadingId(evalQuestId);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      let success = false;
      try {
        const response = await fetch(`${BASE_URL}/mini-quests/my-quests/${evalQuestId}/evaluate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ evaluation }) });
        if (response.ok) success = true;
      } catch (e) {
        await SyncManager.enqueueAction(`${BASE_URL}/mini-quests/my-quests/${evalQuestId}/evaluate`, 'PATCH', { evaluation });
        success = true;
        Toast.show({ type: 'info', text1: 'Офлайн', text2: 'Оцінку збережено локально.' });
      }

      if (success) {
        setQuests(prev => {
          const newQuests = prev.map(q => q.id === evalQuestId ? { ...q, evaluation } : q);
          AsyncStorage.setItem(`quests_daily_${token}`, JSON.stringify(newQuests)).catch(() => {});
          return newQuests;
        });
        Toast.show({ type: 'success', text1: 'Оцінку збережено', text2: 'Дякуємо, що ділишся своїм станом!' });
      } else { Toast.show({ type: 'error', text1: 'Помилка', text2: 'Не вдалося зберегти оцінку' }); }
    } catch (error) { Toast.show({ type: 'error', text1: 'Помилка мережі', text2: 'Не вдалося зберегти оцінку' }); } finally { setActionLoadingId(null); setEvalQuestId(null); }
  };



  return (
    <AnimatedBackground isDark={isDark} themeKey={isDark ? 'dark' : 'light'}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
          <View style={s.header}>
            <AnimatedCard 
              animationsEnabled={animationsEnabled} 
              onPress={() => { 
                playClickSound(); 
                if (router.canGoBack()) {
                  router.back(); 
                } else {
                  router.replace('/'); 
                }
              }} 
              style={[s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}
            >
              <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
            </AnimatedCard>
            <View style={s.headerRight}>
              <AnimatedCard animationsEnabled={animationsEnabled} onPress={() => { playClickSound(); router.push({ pathname: '/profile', params: { theme } }); }} style={[s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}><User color={c.textMain} size={24} strokeWidth={2} /></AnimatedCard>
              <AnimatedCard animationsEnabled={animationsEnabled} onPress={() => { playClickSound(); router.push({ pathname: '/settings', params: { theme } }); }} style={[s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}><Settings color={c.textMain} size={24} strokeWidth={2} /></AnimatedCard>
            </View>
          </View>

          <Text style={[Typography.titleXl, s.mainTitle, { color: c.textMain }]}>Квести</Text>

          <ScrollView
            style={s.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
          >
            {!isLoading && gardenQuests.length > 0 && (
              <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 24 }}>
                <LinearGradient colors={isDark ? ['rgba(59, 130, 246, 0.4)', 'rgba(74, 222, 128, 0.4)'] : ['rgba(14, 165, 233, 0.6)', 'rgba(34, 197, 94, 0.6)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.gardenGradientBorder}>
                  <View style={[s.gardenWidget, { backgroundColor: isDark ? 'rgba(30, 40, 50, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
                    <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 12 }]}>Твій Сад Спокою</Text>
                    <View style={s.gardenRow}>
                      {gardenQuests.map(q => <MiniPlant key={q.id} status={q.status} hobbies={q.mini_quest.hobbies} id={q.id} />)}
                    </View>
                    <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 16 }]}>Лікуй рослини, виконуючи квести! ({completedQuestsCount}/{totalQuests})</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {isLoading ? (
              <>
                <SkeletonCard c={c} isDark={isDark} />
                <SkeletonCard c={c} isDark={isDark} />
                <SkeletonCard c={c} isDark={isDark} />
              </>
            ) : quests.length === 0 ? (
              <View style={s.emptyState}>
                <Ghost size={64} color={c.textMuted} strokeWidth={1.5} />
                <Text style={[Typography.titleMd, { color: c.textMain, marginTop: 16, textAlign: 'center' }]}>Поки що порожньо</Text>
                <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 8 }]}>Твої нові квести з'являться тут згодом. Час для відпочинку!</Text>
              </View>
            ) : (
              quests.map((quest, index) => {
                let statusText = ''; let statusBg = ''; let statusColor = ''; let buttonText = '';
                let onPressAction = () => {}; let isCompleted = false;

                switch (quest.status) {
                  case 'AVAILABLE': statusText = 'ДОСТУПНО'; statusBg = isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE'; statusColor = isDark ? '#93C5FD' : '#1D4ED8'; buttonText = 'ПОЧАТИ'; onPressAction = () => handleUpdateStatus(quest.id, 'start'); break;
                  case 'IN_PROGRESS': statusText = 'В ПРОЦЕСІ'; statusBg = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'; statusColor = isDark ? '#CBD5E1' : '#6B7280'; buttonText = 'ЗАВЕРШИТИ'; onPressAction = () => handleUpdateStatus(quest.id, 'complete'); break;
                  case 'COMPLETED': statusText = 'ВИКОНАНО'; statusBg = isDark ? 'rgba(74, 222, 128, 0.2)' : '#DCFCE7'; statusColor = isDark ? '#4ADE80' : '#16A34A'; buttonText = quest.evaluation ? 'ОЦІНЕНО' : 'ОЦІНИТИ СТАН'; onPressAction = quest.evaluation ? () => {} : () => promptEvaluation(quest.id); isCompleted = true; break;
                }

                const isItemLoading = actionLoadingId === quest.id;
                const isButtonDisabled = actionLoadingId !== null || (quest.status === 'COMPLETED' && !!quest.evaluation);

                return (
                  <View key={quest.id} style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, isCompleted && { opacity: 0.85 }]}>
                    <View style={[s.iconBoxInner, { backgroundColor: c.iconBg }]}>
                      {quest.mini_quest.hobbies?.length > 0 ? (
                        getHobbyIcon(quest.mini_quest.hobbies[0].name, c.iconColor, 32)
                      ) : (
                        <Compass color={c.iconColor} size={32} strokeWidth={2} />
                      )}
                    </View>
                    <View style={s.cardContent}>
                      <Pressable onPress={() => toggleExpand(quest.id)}>
                        <Text style={[Typography.titleMd, { color: c.textMain, flexShrink: 1 }]} numberOfLines={expandedIds[quest.id] ? undefined : 2}>
                          {quest.mini_quest.title}
                        </Text>
                        {!expandedIds[quest.id] && (
                          <Text style={[Typography.nav, { color: c.accent, fontWeight: '700', marginTop: 2, marginBottom: 6 }]}>
                            ••• детальніше
                          </Text>
                        )}
                        {expandedIds[quest.id] && (
                          <Text style={[Typography.nav, { color: c.textMuted, fontWeight: '600', marginTop: 2, marginBottom: 6 }]}>
                            ▴ згорнути
                          </Text>
                        )}
                      </Pressable>
                      {quest.mini_quest.hobbies?.length > 0 && (
                        <View style={s.hobbiesRow}>
                          {quest.mini_quest.hobbies.map((h: any) => (
                            <View key={h.id} style={[s.hobbyBadge, { backgroundColor: c.iconBg }]}>{getHobbyIcon(h.name, c.accent, 12)}<Text style={[s.hobbyText, { color: c.textMuted }]} numberOfLines={1}>{h.name}</Text></View>
                          ))}
                        </View>
                      )}
                      <View style={s.statusRow}>
                        {isCompleted ? (
                          <View style={s.completedStatus}><Text style={[s.statusText, { color: statusColor }]}>{statusText}</Text><CheckCircle2 color={statusColor} size={14} strokeWidth={2.5} /></View>
                        ) : (
                          <View style={[s.statusBadge, { backgroundColor: statusBg }]}><Text style={[s.statusText, { color: statusColor }]}>{statusText}</Text></View>
                        )}
                      </View>
                      <Pressable onPress={onPressAction} disabled={isButtonDisabled} style={({ pressed }) => [s.actionButton, { backgroundColor: c.accent }, pressed && animationsEnabled && s.pressedLight, isButtonDisabled && { opacity: 0.5, backgroundColor: c.textMuted }]}>
                        {isItemLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={[Typography.button, { color: '#FFF' }]}>{buttonText}</Text>}
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <Modal visible={shareModalVisible} transparent animationType="fade">
            <View style={s.modalOverlay}>
              <View style={[s.shareModal, { backgroundColor: c.cardBg, borderColor: c.border, paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
                <View style={[s.shareIconBox, { backgroundColor: c.iconBg }]}><Share color={c.iconColor} size={32} /></View>
                <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 8 }]}>Квест виконано! 🎉</Text>
                <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginBottom: 24 }]}>Кожен маленький крок важливий. Поділися цим успіхом у стрічці, щоб надихнути інших.</Text>
                <Pressable onPress={() => { playClickSound(); setIsAnonymous(!isAnonymous); }} style={[s.checkboxRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[s.checkbox, { borderColor: c.textMuted }, isAnonymous && { backgroundColor: c.accent, borderColor: c.accent }]}>{isAnonymous && <Check color="#FFF" size={14} strokeWidth={3} />}</View>
                  <View style={{ flex: 1, marginLeft: 12 }}><Text style={[Typography.body, { color: c.textMain }]}>Опублікувати анонімно</Text><Text style={[Typography.nav, { color: c.textMuted }]}>Твоє ім'я буде приховано</Text></View>
                  <Ghost color={isAnonymous ? c.accent : c.textMuted} size={24} />
                </Pressable>
                <View style={s.modalButtons}>
                  <Pressable onPress={() => { playClickSound(); setShareModalVisible(false); }} style={({ pressed }) => [s.cancelBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }, pressed && animationsEnabled && s.pressedLight]}><Text style={[Typography.button, { color: c.textMain }]}>Ні, дякую</Text></Pressable>
                  <Pressable onPress={handleShareQuest} disabled={isSharing} style={({ pressed }) => [s.confirmBtn, { backgroundColor: c.accent }, pressed && animationsEnabled && s.pressedLight, isSharing && { opacity: 0.7 }]}>{isSharing ? <ActivityIndicator color="#FFF" /> : <Text style={[Typography.button, { color: '#FFF' }]}>Поділитися</Text>}</Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={evalModalVisible} transparent animationType="fade">
            <View style={s.modalOverlay}>
              <View style={[s.shareModal, { backgroundColor: c.cardBg, borderColor: c.border, paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
                <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 8 }]}>Як ти почуваєшся?</Text>
                <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginBottom: 24 }]}>Оціни свій стан після виконання цього квесту</Text>
                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}>
                  <Pressable onPress={() => handleEvaluate('WORSE')} style={({pressed}) => [s.evalBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderColor: '#EF4444' }, pressed && animationsEnabled && s.pressedLight]}><Frown color="#EF4444" size={28} /><Text style={[Typography.nav, { color: '#EF4444', marginTop: 8 }]}>Гірше</Text></Pressable>
                  <Pressable onPress={() => handleEvaluate('SAME')} style={({pressed}) => [s.evalBtn, { backgroundColor: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F3F4F6', borderColor: '#9CA3AF' }, pressed && animationsEnabled && s.pressedLight]}><Meh color={isDark ? '#D1D5DB' : '#6B7280'} size={28} /><Text style={[Typography.nav, { color: isDark ? '#D1D5DB' : '#6B7280', marginTop: 8 }]}>Так само</Text></Pressable>
                  <Pressable onPress={() => handleEvaluate('BETTER')} style={({pressed}) => [s.evalBtn, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7', borderColor: '#22C55E' }, pressed && animationsEnabled && s.pressedLight]}><Smile color="#22C55E" size={28} /><Text style={[Typography.nav, { color: '#22C55E', marginTop: 8 }]}>Краще</Text></Pressable>
                </View>
                <Pressable onPress={() => { playClickSound(); setEvalModalVisible(false); }} style={{ marginTop: 24, alignItems: 'center', paddingVertical: 8 }}><Text style={[Typography.button, { color: c.textMuted }]}>Скасувати</Text></Pressable>
              </View>
            </View>
          </Modal>
          {showConfetti && animationsEnabled && <ConfettiCannon count={100} origin={{x: -10, y: 0}} autoStart={true} fadeOut={true} fallSpeed={2500} />}
        </Animated.View>
      </SafeAreaView>
      <Toast />
    </AnimatedBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.screenX, paddingTop: 12, paddingBottom: 24 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 12, borderRadius: Radii.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { paddingHorizontal: Spacing.screenX, marginBottom: 24 },
  scrollView: { flex: 1, paddingHorizontal: Spacing.screenX },
  card: { borderRadius: Radii.lg, padding: Spacing.cardP, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
  iconBoxInner: { padding: Spacing.iconP, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', width: 64, height: 64, marginRight: 16, flexShrink: 0 },
  cardContent: { flex: 1, overflow: 'hidden' },
  hobbiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  hobbyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  hobbyText: { fontSize: 10, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  completedStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionButton: { paddingVertical: 12, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44 },
  gardenGradientBorder: { padding: 2, borderRadius: Radii.lg + 2 },
  gardenWidget: { padding: 24, borderRadius: Radii.lg, overflow: 'hidden', minHeight: 220 },
  gardenRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, alignItems: 'flex-end', height: 100, width: '100%', paddingHorizontal: 10 },
  miniPlantContainer: { width: 50, height: 100, alignItems: 'center', justifyContent: 'flex-end', marginLeft: -8 },
  miniPot: { width: 36, height: 26, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, zIndex: 5 },
  miniPotRim: { width: 42, height: 5, borderRadius: 3, marginTop: -2, alignSelf: 'center' },
  miniStemWrapper: { position: 'absolute', bottom: 20, width: 20, height: 60, alignItems: 'center', justifyContent: 'flex-end', alignSelf: 'center' },
  miniStem: { width: 4, borderRadius: 2 },
  miniLeaf: { position: 'absolute', width: 14, height: 7, borderTopLeftRadius: 8, borderBottomRightRadius: 8, borderTopRightRadius: 2, borderBottomLeftRadius: 2 },
  miniLeafLeft: { bottom: 25, right: 10, transform: [{ rotate: '-30deg' }] },
  miniLeafRight: { bottom: 35, left: 10, transform: [{ rotate: '30deg' }] },
  miniFlowerHead: { position: 'absolute', bottom: 65, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  miniFlowerCenter: { width: 8, height: 8, borderRadius: 4, zIndex: 2 },
  miniPetal: { position: 'absolute', width: 12, height: 12 },
  miniPetal1: { top: 0 }, miniPetal2: { bottom: 0 }, miniPetal3: { left: 0 }, miniPetal4: { right: 0 },
  pressedLight: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shareModal: { borderTopLeftRadius: Radii.lg, borderTopRightRadius: Radii.lg, padding: 24, borderWidth: 1 },
  shareIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20, marginTop: -8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radii.md, marginBottom: 24 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center' },
  evalBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});