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
  ArrowLeft, 
  User, 
  Settings, 
  Activity, 
  Footprints, 
  Palette,
  CheckCircle2,
  Sparkles,
  Star,
  Check,
  Share,
  Ghost
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/constants/api';

interface MiniQuest {
  id: string;
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  evaluation: string | null;
  mini_quest: {
    id: string;
    title: string;
  };
}

export default function QuestsScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';

  const [quests, setQuests] = useState<MiniQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [questToShare, setQuestToShare] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const colors = {
    overlay: isDark ? 'rgba(15, 20, 30, 0.75)' : 'rgba(0, 0, 0, 0.2)', 
    cardBg: isDark ? 'rgba(26, 32, 53, 0.85)' : 'rgba(255, 255, 255, 0.92)',
    textMain: isDark ? '#EFF6FF' : '#2D1B08',
    textMuted: isDark ? '#94A3B8' : 'rgba(45, 27, 8, 0.7)',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.85)',
    iconBg: isDark ? 'rgba(45, 212, 191, 0.15)' : '#FEF3C7',
    iconColor: isDark ? '#2DD4BF' : '#F97316', 
    modalBg: isDark ? '#1E293B' : '#FFFFFF', // Суцільний колір для модалки
    inputBg: isDark ? '#0F172A' : '#F3F4F6',
  };

  const fetchQuests = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/mini-quests/daily`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuests(data);
      }
    } catch (error) {
      console.error("Помилка завантаження:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuests();
    }, [])
  );

  const handleUpdateStatus = async (questId: string, action: 'start' | 'complete') => {
    setActionLoadingId(questId);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/mini-quests/my-quests/${questId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchQuests(); 
        
        if (action === 'complete') {
          setQuestToShare(questId);
          setIsAnonymous(false); 
          setShareModalVisible(true);
        }
      }
    } catch (error) {
      console.error(`Помилка ${action}:`, error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleShareQuest = async () => {
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
        await fetchQuests();
      }
    } catch (error) {
      console.error("Помилка оцінки:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const promptEvaluation = (questId: string) => {
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
      source={require('@/assets/images/rain-window.png')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        
        <View style={s.header}>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [s.iconBtn, { backgroundColor: colors.headerBtnBg }, pressed && s.pressed]}
          >
            <ArrowLeft color={colors.textMain} size={24} strokeWidth={2} />
          </Pressable>

          <View style={s.headerRight}>
            <Pressable style={({ pressed }) => [s.iconBtn, { backgroundColor: colors.headerBtnBg }, pressed && s.pressed]}>
              <User color={colors.textMain} size={24} strokeWidth={2} />
            </Pressable>
            <Pressable 
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [s.iconBtn, { backgroundColor: colors.headerBtnBg }, pressed && s.pressed]}
            >
              <Settings color={colors.textMain} size={24} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <Text style={s.mainTitle}>Квести</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.iconColor} style={{ marginTop: 50 }} />
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

              return (
                <View key={quest.id} style={[s.card, { backgroundColor: colors.cardBg }]}>
                  <View style={[s.iconBox, { backgroundColor: colors.iconBg }]}>
                    <IconComponent color={colors.iconColor} size={32} strokeWidth={2} />
                  </View>

                  <View style={s.cardContent}>
                    <Text style={[s.questTitle, { color: colors.textMain }]}>
                      {quest.mini_quest.title}
                    </Text>
                    <Text style={[s.questSubtitle, { color: colors.textMuted }]}>
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
                      disabled={isItemLoading || (quest.status === 'COMPLETED' && !!quest.evaluation)}
                      style={({ pressed }) => [
                        s.actionButton,
                        isDark ? s.actionButtonDark : s.actionButtonLight,
                        pressed && s.pressedButtonBase,
                        pressed && isDark && s.pressedButtonDark, 
                        pressed && !isDark && s.pressedButtonLight,
                        (quest.status === 'COMPLETED' && !!quest.evaluation) && { opacity: 0.5 }
                      ]}
                    >
                      {isItemLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={s.actionButtonText}>{buttonText}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Modal visible={shareModalVisible} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.shareModal, { backgroundColor: colors.modalBg }]}>
              
              <View style={[s.shareIconBox, { backgroundColor: colors.iconBg }]}>
                <Share color={colors.iconColor} size={32} />
              </View>

              <Text style={[s.shareTitle, { color: colors.textMain }]}>Квест виконано! 🎉</Text>
              <Text style={[s.shareDesc, { color: colors.textMuted }]}>
                Кожен маленький крок важливий. Поділися цим успіхом у стрічці, щоб надихнути інших користувачів на відновлення.
              </Text>

              <Pressable 
                onPress={() => setIsAnonymous(!isAnonymous)}
                style={[s.checkboxRow, { backgroundColor: colors.inputBg }]}
              >
                <View style={[
                  s.checkbox, 
                  { borderColor: colors.textMuted },
                  isAnonymous && { backgroundColor: colors.iconColor, borderColor: colors.iconColor }
                ]}>
                  {isAnonymous && <Check color="#FFF" size={14} strokeWidth={3} />}
                </View>
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.checkboxTitle, { color: colors.textMain }]}>Опублікувати анонімно</Text>
                  <Text style={[s.checkboxSubtitle, { color: colors.textMuted }]}>Твоє ім'я буде приховано</Text>
                </View>

                <Ghost color={isAnonymous ? colors.iconColor : colors.textMuted} size={24} />
              </Pressable>

              <View style={s.modalButtons}>
                <Pressable 
                  onPress={() => setShareModalVisible(false)}
                  style={({ pressed }) => [s.cancelBtn, { backgroundColor: colors.inputBg }, pressed && s.pressed]}
                >
                  <Text style={[s.cancelBtnText, { color: colors.textMain }]}>Ні, дякую</Text>
                </Pressable>

                <Pressable 
                  onPress={handleShareQuest}
                  disabled={isSharing}
                  style={({ pressed }) => [
                    s.confirmBtn, 
                    { backgroundColor: colors.iconColor }, 
                    pressed && s.pressed,
                    isSharing && { opacity: 0.7 }
                  ]}
                >
                  {isSharing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={s.confirmBtnText}>Поділитися</Text>
                  )}
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>

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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 12, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainTitle: {
    fontSize: 32, fontWeight: 'bold', color: '#FFFFFF',
    paddingHorizontal: 24, marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  card: {
    borderRadius: 24, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start',
  },
  iconBox: { padding: 12, borderRadius: 16, marginRight: 16, alignItems: 'center', justifyContent: 'center', width: 64, height: 64 },
  cardContent: { flex: 1 },
  questTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  questSubtitle: { fontSize: 14, fontWeight: '500', marginBottom: 12, lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  completedStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionButton: { paddingVertical: 12, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44 },
  actionButtonLight: { backgroundColor: '#F97316', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  actionButtonDark: { backgroundColor: '#0F766E', shadowColor: '#2DD4BF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  pressedButtonBase: { transform: [{ scale: 0.95 }] },
  pressedButtonLight: { backgroundColor: '#EA580C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  pressedButtonDark: { backgroundColor: '#115E59', shadowColor: '#2DD4BF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },

  // СТИЛІ МОДАЛКИ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  shareIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -8,
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  shareDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});