import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ImageBackground, 
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { 
  ArrowLeft, User, Settings, Activity, Footprints, Palette,
  CheckCircle2, Sparkles, Star, Check, Share, Ghost
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/constants/api';

import { Colors, Typography, Radii, Spacing, IconSizes } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { playClickSound, playSuccessSound } from '@/utils/audio';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedCard = ({ onPress, disabled, style, children, animationsEnabled = true }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { if (!disabled && animationsEnabled) scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }) }}
      onPressOut={() => { if (animationsEnabled) scale.value = withSpring(1, { damping: 15, stiffness: 200 }) }}
      onPress={onPress}
      style={[style, animationsEnabled ? animatedStyle : null]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function QuestsScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  
  const c = Colors[isDark ? 'dark' : 'light'];

  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [questToShare, setQuestToShare] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(c.overlay, { duration: animationsEnabled ? 400 : 0 }),
    };
  }, [c.overlay, animationsEnabled]);

  const loadQuests = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/mini-quests/daily`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        const priority: Record<string, number> = {
          'IN_PROGRESS': 1,
          'AVAILABLE': 2,
          'COMPLETED': 3
        };

        const sortedData = data.sort((a: any, b: any) => 
          (priority[a.status] || 99) - (priority[b.status] || 99)
        );

        setQuests(sortedData);
      }
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchSettings = async () => {
        try {
          const savedSettings = await SecureStore.getItemAsync('userSettings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setAnimationsEnabled(parsed.animations !== false);
          }
        } catch (error) {}
      };

      fetchSettings();
      loadQuests(true);
      return () => {};
    }, [])
  );

  const handleUpdateStatus = async (questId: string, action: 'start' | 'complete') => {
    playClickSound();
    setActionLoadingId(questId);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/mini-quests/my-quests/${questId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await loadQuests(false);
        
        if (action === 'complete') {
          playSuccessSound();
          
          let defaultAnonymous = false;
          const savedSettings = await SecureStore.getItemAsync('userSettings');
          if (savedSettings) {
            try {
              const parsed = JSON.parse(savedSettings);
              defaultAnonymous = !!parsed.anonymousMode;
            } catch (e) {}
          }

          if (animationsEnabled) {
            setShowConfetti(true);
            setTimeout(() => {
              setQuestToShare(questId);
              setIsAnonymous(defaultAnonymous); 
              setShareModalVisible(true);
            }, 1500); 
            
            setTimeout(() => {
              setShowConfetti(false);
            }, 4000);
          } else {
            setQuestToShare(questId);
            setIsAnonymous(defaultAnonymous); 
            setShareModalVisible(true);
          }
        }
      }
    } catch (error) {} finally {
      setActionLoadingId(null);
    }
  };

  const handleShareQuest = async () => {
    playClickSound();
    if (!questToShare) return;
    setIsSharing(true);
    
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_mini_quest_id: questToShare,
          is_anonymous: isAnonymous
        })
      });

      if (response.ok) {
        setShareModalVisible(false);
        setQuestToShare(null);
        Alert.alert("Супер! 🎉", "Твій успіх вже у стрічці підтримки. Це надихне інших!");
      } else {
        Alert.alert("Помилка", "Не вдалося опублікувати пост");
      }
    } catch (error) {
      Alert.alert("Помилка мережі", "Перевір підключення до інтернету");
    } finally {
      setIsSharing(false);
    }
  };

  const handleEvaluate = async (questId: string, evaluation: 'BETTER' | 'SAME' | 'WORSE') => {
    playClickSound();
    setActionLoadingId(questId);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/mini-quests/my-quests/${questId}/evaluate`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ evaluation })
      });

      if (response.ok) {
        await loadQuests(false);
      }
    } catch (error) {} finally {
      setActionLoadingId(null);
    }
  };

  const promptEvaluation = (questId: string) => {
    playClickSound();
    Alert.alert(
      "Як ти почуваєшся?",
      "Оціни свій стан після виконання цього квесту",
      [
        { text: "Гірше", onPress: () => handleEvaluate(questId, 'WORSE') },
        { text: "Так само", onPress: () => handleEvaluate(questId, 'SAME') },
        { text: "Краще", onPress: () => handleEvaluate(questId, 'BETTER') }
      ]
    );
  };

  const getRandomIcon = (index: number) => {
    const icons = [Activity, Sparkles, Footprints, Palette, Star];
    return icons[index % icons.length];
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/background.jpg')} 
      style={s.container}
      resizeMode="cover"
    >
      <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        
        <View style={s.header}>
          <AnimatedCard 
            animationsEnabled={animationsEnabled}
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={[s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}
          >
            <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
          </AnimatedCard>

          <View style={s.headerRight}>
            <AnimatedCard animationsEnabled={animationsEnabled} style={[s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}>
              <User color={c.textMain} size={24} strokeWidth={2} />
            </AnimatedCard>
            <AnimatedCard 
              animationsEnabled={animationsEnabled}
              onPress={() => {
                playClickSound();
                router.push({ pathname: '/profile', params: { theme } });
              }}
              style={[s.iconBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}
            >
              <Settings color={c.textMain} size={24} strokeWidth={2} />
            </AnimatedCard>
          </View>
        </View>

        <Text style={[Typography.titleXl, s.mainTitle, { color: c.textMain }]}>Квести</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={c.iconColor} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView 
            style={s.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }} 
          >
            {quests.map((quest, index) => {
              const IconComponent = getRandomIcon(index);
              
              let statusText = '';
              let statusBg = '';
              let statusColor = '';
              let buttonText = '';
              let onPressAction = () => {};
              let isCompleted = false;

              switch (quest.status) {
                case 'AVAILABLE':
                  statusText = 'ДОСТУПНО';
                  statusBg = isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE';
                  statusColor = isDark ? '#93C5FD' : '#1D4ED8';
                  buttonText = 'ПОЧАТИ';
                  onPressAction = () => handleUpdateStatus(quest.id, 'start');
                  break;
                case 'IN_PROGRESS':
                  statusText = 'В ПРОЦЕСІ';
                  statusBg = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
                  statusColor = isDark ? '#CBD5E1' : '#6B7280';
                  buttonText = 'ЗАВЕРШИТИ';
                  onPressAction = () => handleUpdateStatus(quest.id, 'complete');
                  break;
                case 'COMPLETED':
                  statusText = 'ВИКОНАНО';
                  statusBg = isDark ? 'rgba(74, 222, 128, 0.2)' : '#DCFCE7';
                  statusColor = isDark ? '#4ADE80' : '#16A34A';
                  buttonText = quest.evaluation ? 'ОЦІНЕНО' : 'ОЦІНИТИ СТАН';
                  onPressAction = quest.evaluation ? () => {} : () => promptEvaluation(quest.id);
                  isCompleted = true;
                  break;
              }

              const isItemLoading = actionLoadingId === quest.id;
              const isButtonDisabled = isItemLoading || (quest.status === 'COMPLETED' && !!quest.evaluation);

              return (
                <View key={quest.id} style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, isCompleted && { opacity: 0.85 }]}>
                  
                  <View style={[s.iconBoxInner, { backgroundColor: c.iconBg }]}>
                    <IconComponent color={c.iconColor} size={32} strokeWidth={2} />
                  </View>

                  <View style={s.cardContent}>
                    <Text style={[Typography.titleMd, { color: c.textMain, marginBottom: 4 }]}>
                      {quest.mini_quest.title}
                    </Text>
                    <Text style={[Typography.muted, { color: c.textMuted, marginBottom: 12 }]}>
                      Щоденне завдання
                    </Text>

                    <View style={s.statusRow}>
                      {isCompleted ? (
                        <View style={s.completedStatus}>
                          <Text style={[s.statusText, { color: statusColor }]}>{statusText}</Text>
                          <CheckCircle2 color={statusColor} size={14} strokeWidth={2.5} />
                        </View>
                      ) : (
                        <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
                          <Text style={[s.statusText, { color: statusColor }]}>{statusText}</Text>
                        </View>
                      )}
                    </View>

                    <Pressable 
                      onPress={onPressAction}
                      disabled={isButtonDisabled}
                      style={({ pressed }) => [
                        s.actionButton,
                        { backgroundColor: c.accent },
                        pressed && animationsEnabled && s.pressedLight,
                        isButtonDisabled && { opacity: 0.5, backgroundColor: c.textMuted }
                      ]}
                    >
                      {isItemLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={[Typography.button, { color: '#FFF' }]}>{buttonText}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Modal visible={shareModalVisible} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={[s.shareModal, { backgroundColor: c.cardBg, borderColor: c.border, borderWidth: 1 }]}>
              
              <View style={[s.shareIconBox, { backgroundColor: c.iconBg }]}>
                <Share color={c.iconColor} size={32} />
              </View>

              <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 8 }]}>
                Квест виконано! 🎉
              </Text>
              <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginBottom: 24 }]}>
                Кожен маленький крок важливий. Поділися цим успіхом у стрічці, щоб надихнути інших.
              </Text>

              <Pressable 
                onPress={() => {
                  playClickSound();
                  setIsAnonymous(!isAnonymous);
                }}
                style={[s.checkboxRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}
              >
                <View style={[
                  s.checkbox, 
                  { borderColor: c.textMuted },
                  isAnonymous && { backgroundColor: c.accent, borderColor: c.accent }
                ]}>
                  {isAnonymous && <Check color="#FFF" size={14} strokeWidth={3} />}
                </View>
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.body, { color: c.textMain }]}>Опублікувати анонімно</Text>
                  <Text style={[Typography.nav, { color: c.textMuted }]}>Твоє ім'я буде приховано</Text>
                </View>

                <Ghost color={isAnonymous ? c.accent : c.textMuted} size={24} />
              </Pressable>

              <View style={s.modalButtons}>
                <Pressable 
                  onPress={() => {
                    playClickSound();
                    setShareModalVisible(false);
                  }}
                  style={({ pressed }) => [s.cancelBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }, pressed && animationsEnabled && s.pressedLight]}
                >
                  <Text style={[Typography.button, { color: c.textMain }]}>Ні, дякую</Text>
                </Pressable>

                <Pressable 
                  onPress={handleShareQuest}
                  disabled={isSharing}
                  style={({ pressed }) => [s.confirmBtn, { backgroundColor: c.accent }, pressed && animationsEnabled && s.pressedLight, isSharing && { opacity: 0.7 }]}
                >
                  {isSharing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[Typography.button, { color: '#FFF' }]}>Поділитися</Text>
                  )}
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>

        {showConfetti && animationsEnabled && (
          <ConfettiCannon
            count={100}
            origin={{x: -10, y: 0}}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
          />
        )}

      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 12, borderRadius: Radii.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: {
    paddingHorizontal: Spacing.screenX, marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  scrollView: { flex: 1, paddingHorizontal: Spacing.screenX },
  card: {
    borderRadius: Radii.lg, padding: Spacing.cardP, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1,
  },
  iconBoxInner: { padding: Spacing.iconP, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', width: 64, height: 64, marginRight: 16 },
  cardContent: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  completedStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionButton: { paddingVertical: 12, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44 },
  pressedLight: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shareModal: { borderTopLeftRadius: Radii.lg, borderTopRightRadius: Radii.lg, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  shareIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20, marginTop: -8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radii.md, marginBottom: 24 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center' },
});