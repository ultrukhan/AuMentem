import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AnimatedCard from '@/components/AnimatedCard';
import { hasLoadedData, markDataLoaded } from "@/utils/sessionCache";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Ghost,
  Trash2,
  Flag,
  X,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

import { Colors, Typography, Radii, Spacing } from "@/constants/theme";
import { BASE_URL } from "@/constants/api";
import { playClickSound } from "@/utils/audio";
import { parseApiError } from "@/utils/apiErrors";
import { cardShadow } from "@/utils/shadowStyle";
import { useAppSettings } from "@/hooks/useAppSettings";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { Toast } from "@/utils/toast";
import { fetchWithCache } from '@/utils/apiWithCache';
import { SyncManager } from '@/utils/SyncManager';

interface Reaction {
  reaction_type: "SUPPORT" | "HUG" | "PROUD" | "HEART";
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  is_anonymous: boolean;
  created_at: string;
  user: { nickname: string } | null;
  user_mini_quest?: {
    mini_quest: { title: string };
  } | null;
  user_geo_quest?: {
    geo_quest: { title: string };
    photo_proof_url?: string;
  } | null;
  reactions: Reaction[];
}

const REACTION_OPTIONS = [
  { type: "HEART", emoji: "❤️‍🔥" },
  { type: "HUG", emoji: "🏆" },
  { type: "SUPPORT", emoji: "✨" },
  { type: "PROUD", emoji: "🔥" },
] as const;

const REPORT_REASONS = [
  { id: "SPAM", label: "Спам або реклама" },
  { id: "OFFENSIVE", label: "Образливий контент або цькування" },
  { id: "SCAM", label: "Шахрайство" },
  { id: "NUDITY", label: "Неприйнятний контент (18+)" },
  { id: "VIOLENCE", label: "Насильство або загрози" },
  { id: "ILLEGAL_CONTENT", label: "Заборонений контент" },
  { id: "COPYRIGHT", label: "Порушення прав" },
  { id: "OTHER", label: "Інше" },
];

const Particle = ({ emoji }: { emoji: string }) => {
  const randomX = (Math.random() - 0.5) * 160;
  const randomY = -100 - Math.random() * 80;

  const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.parallel([
        Animated.timing(moveAnim, {
          toValue: { x: randomX, y: randomY },
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1200,
          delay: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.4,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }, []),
  );

  return (
    <Animated.Text
      style={[
        s.particle,
        {
          transform: [
            { translateX: moveAnim.x },
            { translateY: moveAnim.y },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};

const ReactionButton = ({
  reaction,
  count,
  isActive,
  onPress,
  c,
}: {
  reaction: (typeof REACTION_OPTIONS)[number];
  count: number;
  isActive: boolean;
  onPress: () => void;
  c: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [particles, setParticles] = useState<{ id: number }[]>([]);
  const particleIdCounter = useRef(0);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isActive) {
      const newParticles = Array.from({ length: 6 }).map(() => ({
        id: particleIdCounter.current++,
      }));

      setParticles((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.find((np) => np.id === p.id)),
        );
      }, 1500);
    }

    onPress();
  };

  return (
    <View style={s.buttonWrapper}>
      {particles.map((p) => (
        <Particle key={p.id} emoji={reaction.emoji} />
      ))}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          style={[
            s.reactionChip,
            {
              backgroundColor: isActive
                ? c.accent + "25"
                : count > 0
                  ? c.cardBg
                  : "transparent",
              borderColor: isActive
                ? c.accent
                : count > 0
                  ? c.border
                  : "transparent",
              borderWidth: isActive || count > 0 ? 1 : 0,
              shadowColor: isActive ? c.accent : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isActive ? 0.4 : 0,
              shadowRadius: 6,
              opacity: isActive ? 1 : 0.85,
            },
          ]}
        >
          <Text style={s.reactionEmoji}>{reaction.emoji}</Text>
          {count > 0 && (
            <Text
              style={[
                Typography.titleMd,
                {
                  color: isActive ? c.accent : c.textMuted,
                  fontSize: 13,
                  marginLeft: 6,
                  fontWeight: isActive ? "700" : "500",
                },
              ]}
            >
              {count}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const FeedSkeleton = ({ isDark }: { isDark: boolean }) => {
  const c = Colors[isDark ? "dark" : "light"];
  return (
    <View style={{ gap: 16, paddingTop: 8 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton
          key={i}
          colorMode={isDark ? "dark" : "light"}
          width="100%"
          height={180}
          radius={24}
        />
      ))}
    </View>
  );
};

export default function FeedScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === "dark";
  const { animationsEnabled } = useAppSettings();
  const themeKey = isDark ? "dark" : "light";

  const c = Colors[themeKey];

  const [posts, setPosts] = useState<Post[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!hasLoadedData('feed'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listRefreshEpoch, setListRefreshEpoch] = useState(0);
  
  const [offset, setOffset] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyUserId(data.id);
      }
    } catch (error) {
      console.error("Помилка завантаження профілю:", error);
    }
  };

  const fetchPosts = async (reset = false, options?: { refresh?: boolean }) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const currentOffset = reset ? 0 : offset;
      
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const limit = 15;
      const response = await fetchWithCache(`${BASE_URL}/posts/?limit=${limit}&offset=${currentOffset}`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheKey: `feed_posts_${currentOffset}_${token}`,
      });

      if (response.ok && response.data) {
        // Backend returns PaginatedPostResponse { items, total_count, limit, offset }
        const responseData = response.data.items ? response.data.items : [];
        const sortedData = responseData.sort(
          (a: Post, b: Post) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        
        if (reset) {
          setPosts(sortedData);
        } else {
          setPosts((prev) => [...prev, ...sortedData]);
        }
        
        setOffset(currentOffset + limit);
        setHasMore(responseData.length === limit);
      }
    } catch (error) {
      console.error("Помилка завантаження стрічки:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      markDataLoaded('feed');
      if (options?.refresh) setListRefreshEpoch(n => n + 1);
    }
  };

  const loadMorePosts = () => {
    if (!isLoadingMore && hasMore) {
      fetchPosts(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCurrentUser();
      fetchPosts(true);
    }, []),
  );

  const handleReact = async (postId: string, reactionType: string) => {
    playClickSound();

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isRemoving = post.reactions?.some(
      (r) =>
        (r.user_id === myUserId || r.user_id === "me") &&
        r.reaction_type === reactionType,
    );

    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === postId) {
          let updatedReactions = [...(p.reactions || [])];
          if (isRemoving) {
            const indexToRemove = updatedReactions.findIndex(
              (r) =>
                (r.user_id === myUserId || r.user_id === "me") &&
                r.reaction_type === reactionType,
            );
            if (indexToRemove > -1) updatedReactions.splice(indexToRemove, 1);
          } else {
            updatedReactions.push({
              reaction_type: reactionType as any,
              user_id: myUserId || "me",
            });
          }
          return { ...p, reactions: updatedReactions };
        }
        return p;
      }),
    );

    try {
      const token = await SecureStore.getItemAsync("userToken");
      try {
        await fetch(`${BASE_URL}/posts/${postId}/react`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reaction_type: reactionType }),
        });
      } catch (e) {
        await SyncManager.enqueueAction(`${BASE_URL}/posts/${postId}/react`, 'POST', { reaction_type: reactionType });
        Toast.show({ title: 'Офлайн', message: 'Реакцію збережено' });
      }
    } catch (error) {
      fetchPosts();
    }
  };

  const handleDeletePost = (postId: string) => {
    playClickSound();
    Alert.alert(
      "Видалити пост?",
      "Ви дійсно хочете видалити цей пост? Цю дію неможливо буде скасувати.",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("userToken");
              const response = await fetch(`${BASE_URL}/posts/${postId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                setPosts((prev) => prev.filter((p) => p.id !== postId));
              } else {
                Toast.show({
                  title: "Помилка",
                  message: "Не вдалося видалити пост.",
                });
              }
            } catch (error) {
              Toast.show({
                title: "Помилка",
                message: "Перевірте з'єднання з інтернетом.",
              });
            }
          },
        },
      ],
    );
  };

  const submitReport = async () => {
    if (!reportReason || !reportingPostId) return;

    playClickSound();
    setIsSubmittingReport(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(`${BASE_URL}/posts/post_report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: reportingPostId,
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      });

      if (response.ok) {
        Toast.show({
          title: "Дякуємо!",
          message:
            "Скаргу успішно надіслано. Наші модератори перевірять цей пост.",
        });
        closeReportModal();
      } else {
        Toast.show({
          title: "Увага",
          message: await parseApiError(
            response,
            "Не вдалося надіслати скаргу.",
          ),
        });
      }
    } catch (error) {
      Toast.show({
        title: "Помилка",
        message: "Перевірте з'єднання з інтернетом.",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const closeReportModal = () => {
    setReportingPostId(null);
    setReportReason(null);
    setReportDetails("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    const authorName =
      item.is_anonymous || !item.user
        ? "Таємний мандрівник"
        : item.user.nickname;

    const questTitle =
      item.user_mini_quest?.mini_quest?.title ||
      item.user_geo_quest?.geo_quest?.title ||
      "Завдання виконано";

    const isGeo = !!item.user_geo_quest;
    const photoUrl = item.user_geo_quest?.photo_proof_url;

    const isMyPost = item.user_id === myUserId;

    const card = (
      <View
        style={[
          s.card,
          { backgroundColor: c.cardBg, borderColor: c.border },
          cardShadow(themeKey, "soft"),
        ]}
      >
        <View style={s.cardHeader}>
          <View style={s.authorInfo}>
            <View
              style={[
                s.avatar,
                {
                  backgroundColor:
                    item.is_anonymous || !item.user
                      ? c.border
                      : c.accent + "20",
                },
              ]}
            >
              {item.is_anonymous || !item.user ? (
                <Ghost color={c.textMuted} size={20} />
              ) : (
                <Text
                  style={{ color: c.accent, fontWeight: "bold", fontSize: 16 }}
                >
                  {authorName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  Typography.titleMd,
                  { color: c.textMain, fontSize: 15 },
                ]}
                numberOfLines={1}
              >
                {authorName}
              </Text>
              <Text
                style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}
                numberOfLines={1}
              >
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>

          {isMyPost ? (
            <Pressable
              onPress={() => handleDeletePost(item.id)}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: isDark ? "#FF3B3015" : "#FF3B3010" },
                pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Trash2 color="#FF3B30" size={18} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                playClickSound();
                setReportingPostId(item.id);
              }}
              style={({ pressed }) => [
                s.actionBtn,
                { backgroundColor: c.border },
                pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Flag color={c.textMuted} size={18} />
            </Pressable>
          )}
        </View>

        <View
          style={[
            s.questBadge,
            { backgroundColor: isGeo ? "#3B82F615" : c.accent + "15" },
          ]}
        >
          {isGeo ? (
            <MapPin color="#3B82F6" size={16} />
          ) : (
            <Sparkles color={c.accent} size={16} />
          )}
          <Text
            style={[
              Typography.body,
              { color: c.textMain, marginLeft: 8, flex: 1 },
            ]}
          >
            Досягнення: <Text style={{ fontWeight: "600" }}>{questTitle}</Text>
          </Text>
        </View>

        {photoUrl && (
          <Image
            source={{ uri: photoUrl }}
            style={s.postImage}
            contentFit="cover"
            transition={200}
          />
        )}

        <View style={[s.cardFooter, { borderTopColor: c.border }]}>
          <View style={s.reactionsRow}>
            {REACTION_OPTIONS.map((reaction) => {
              const count =
                item.reactions?.filter((r) => r.reaction_type === reaction.type)
                  .length || 0;
              const isActive =
                item.reactions?.some(
                  (r) =>
                    (r.user_id === myUserId || r.user_id === "me") &&
                    r.reaction_type === reaction.type,
                ) || false;

              return (
                <ReactionButton
                  key={reaction.type}
                  reaction={reaction}
                  count={count}
                  isActive={isActive}
                  c={c}
                  onPress={() => handleReact(item.id, reaction.type)}
                />
              );
            })}
          </View>
        </View>
      </View>
    );

    if (!animationsEnabled) return card;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "timing",
          duration: 400,
          delay: Math.min(index * 60, 300),
        }}
      >
        {card}
      </MotiView>
    );
  };

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: c.background }]}
      edges={["top"]}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color={c.textMain} size={24} />
        </Pressable>
        <Text
          style={[
            Typography.titleLg,
            {
              color: c.textMain,
              flex: 1,
              textAlign: "center",
              marginRight: 40,
            },
          ]}
        >
          Стрічка підтримки
        </Text>
      </View>

      {isLoading ? (
        <View style={s.listContent}>
          <FeedSkeleton isDark={isDark} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchPosts(true);
              }}
              tintColor={c.accent}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : !hasMore && posts.length > 0 ? (
              <Text style={{ textAlign: 'center', color: c.textMuted, marginVertical: 16 }}>
                Це всі пости на даний момент 🎉
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text
              style={[
                Typography.body,
                { color: c.textMuted, textAlign: "center", marginTop: 40 },
              ]}
            >
              Стрічка поки порожня. Створи перший привід для гордості в цій
              стрічці! 🌟
            </Text>
          }
        />
      )}

      <Modal visible={!!reportingPostId} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%", justifyContent: "flex-end" }}
          >
            <View style={[s.modalContent, { backgroundColor: c.cardBg }]}>
              <View style={s.modalHeader}>
                <Text style={[Typography.titleLg, { color: c.textMain }]}>
                  Поскаржитися на пост
                </Text>
                <Pressable onPress={closeReportModal} style={s.closeBtn}>
                  <X color={c.textMain} size={24} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.modalScroll}
              >
                <Text
                  style={[
                    Typography.body,
                    { color: c.textMuted, marginBottom: 16 },
                  ]}
                >
                  Виберіть причину, чому цей пост порушує правила спільноти:
                </Text>

                <View style={s.reasonsContainer}>
                  {REPORT_REASONS.map((item) => {
                    const isSelected = reportReason === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          s.reasonRow,
                          {
                            borderColor: isSelected ? c.accent : c.border,
                            backgroundColor: isSelected
                              ? `${c.accent}10`
                              : c.cardBg,
                          },
                        ]}
                        onPress={() => {
                          playClickSound();
                          setReportReason(item.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckCircle2 color={c.accent} size={20} />
                        ) : (
                          <Circle color={c.textMuted} size={20} />
                        )}
                        <Text
                          style={[
                            Typography.body,
                            {
                              color: isSelected ? c.accent : c.textMain,
                              marginLeft: 12,
                              fontWeight: isSelected ? "600" : "400",
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text
                  style={[
                    Typography.titleMd,
                    { color: c.textMain, marginTop: 24, marginBottom: 8 },
                  ]}
                >
                  Додаткові деталі (необов'язково)
                </Text>
                <TextInput
                  style={[
                    s.textInput,
                    {
                      backgroundColor: c.background,
                      color: c.textMain,
                      borderColor: c.border,
                    },
                  ]}
                  placeholder="Опишіть проблему детальніше..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  maxLength={500}
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  textAlignVertical="top"
                />
                <Text
                  style={[
                    Typography.muted,
                    {
                      color: c.textMuted,
                      textAlign: "right",
                      marginTop: 4,
                      fontSize: 12,
                    },
                  ]}
                >
                  {reportDetails.length}/500
                </Text>
              </ScrollView>

              <View style={[s.modalFooter, { borderTopColor: c.border }]}>
                <Pressable
                  style={[
                    s.submitReportBtn,
                    { backgroundColor: c.accent },
                    (!reportReason || isSubmittingReport) && { opacity: 0.5 },
                  ]}
                  onPress={submitReport}
                  disabled={!reportReason || isSubmittingReport}
                >
                  {isSubmittingReport ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={s.submitReportBtnText}>Надіслати скаргу</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 16,
  },
  backBtn: { padding: 8 },
  listContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 40 },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionBtn: {
    padding: 8,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  questBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: Radii.md,
    marginBottom: 16,
  },
  postImage: { width: "100%", height: 250 },
  cardFooter: { padding: 12, borderTopWidth: 1 },
  reactionsRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  buttonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    fontSize: 16,
    zIndex: 99,
    pointerEvents: "none",
  },

  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  reactionEmoji: { fontSize: 18, lineHeight: 22 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reasonsContainer: {
    gap: 10,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  textInput: {
    ...Typography.body,
    height: 100,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 12,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
  },
  submitReportBtn: {
    height: 52,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  submitReportBtnText: {
    ...Typography.titleMd,
    color: "#FFF",
    fontSize: 16,
  },
});
