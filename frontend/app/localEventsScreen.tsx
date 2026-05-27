import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Heart,
  Bookmark,
  ChevronLeft,
  ArrowLeft,
  Sparkles,
  Bell,
  Check,
} from "lucide-react-native";
import { Colors, Typography, Radii, Spacing } from "@/constants/theme";
import { BASE_URL } from "@/constants/api";
import { playClickSound } from "@/utils/audio";
import { parseApiError } from "@/utils/apiErrors";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useSinglePress } from "@/hooks/useSinglePress";
import { cardShadow } from "@/utils/shadowStyle";
import { MotiView } from "moti";
import { BlurView } from 'expo-blur';
import EventCover from "@/components/EventCover";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import BottomNav from "@/components/BottomNav";
import { Toast } from '@/utils/toast';
import { fetchWithCache } from '@/utils/apiWithCache';
import { SyncManager } from '@/utils/SyncManager';
import { hasLoadedData, markDataLoaded } from "@/utils/sessionCache";

interface LocalEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  address: string;
  start_time: string;
  end_time?: string | null;
  price?: string | null;
  external_link?: string | null;
  image_url?: string | null;
}

const CITIES = ["Всі міста", "Львів", "Київ", "Одеса", "Дніпро", "Харків"];

type DateFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "ALL", label: "Усі дати" },
  { id: "TODAY", label: "Сьогодні" },
  { id: "WEEK", label: "Цей тиждень" },
  { id: "MONTH", label: "Цей місяць" },
];

function matchesDateFilter(startTime: string, filter: DateFilter): boolean {
  const start = new Date(startTime);
  const now = new Date();
  if (filter === "ALL") return true;
  if (filter === "TODAY") {
    return start.toDateString() === now.toDateString();
  }
  if (filter === "WEEK") {
    const weekStart = new Date(now);
    const day = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - day + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return start >= weekStart && start < weekEnd;
  }
  if (filter === "MONTH") {
    return (
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear()
    );
  }
  return true;
}

export default function LocalEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { theme } = useLocalSearchParams();
  const isDark = theme === "dark";
  const themeKey = isDark ? "dark" : "light";
  const c = Colors[themeKey];
  const { animationsEnabled } = useAppSettings();
  const runOnce = useSinglePress();
  const [showPast, setShowPast] = useState(false);
  const [activeTab, setActiveTab] = useState<"EXPLORE" | "SAVED">("EXPLORE");
  const exploreListRef = useRef<FlatList>(null);
  const savedListRef = useRef<FlatList>(null);

  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(!hasLoadedData('events'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listRefreshEpoch, setListRefreshEpoch] = useState(0);
  const hasLoadedOnceRef = useRef(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
  const [attendeesCount, setAttendeesCount] = useState<number | null>(null);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const [currentCity, setCurrentCity] = useState("Львів");
  const [freeOnly, setFreeOnly] = useState(false);

  const fetchEventsAndFavorites = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else if (options?.refresh) {
        setIsRefreshing(true);
      }
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const headers = { Authorization: `Bearer ${token}` };

        let url = `${BASE_URL}/local-events/`;
        const params = [];
        if (currentCity !== "Всі міста") {
          params.push(`city=${encodeURIComponent(currentCity)}`);
        }
        if (freeOnly) {
          params.push(`only_free=true`);
        }
        if (params.length > 0) {
          url += `?${params.join("&")}`;
        }

        const favUrl = `${BASE_URL}/local-events/my/favorites?show_past=${showPast}`;

        const [eventsRes, favRes] = await Promise.all([
          fetchWithCache(url, { headers, cacheKey: `events_${currentCity}_free${freeOnly}_${token}` }),
          fetchWithCache(favUrl, { headers, cacheKey: `events_fav_${showPast}_${token}` }),
        ]);

        if (eventsRes.ok && eventsRes.data) {
          const eventsData: LocalEvent[] = eventsRes.data;
          setEvents(eventsData);
        }

        if (favRes.ok && favRes.data) {
          const favData: LocalEvent[] = favRes.data;
          setSavedEvents(favData);
          setFavoriteIds(new Set(favData.map((e) => e.id)));
        }
      } catch (error) {
        console.error("Помилка завантаження подій:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        markDataLoaded('events');
        hasLoadedOnceRef.current = true;
        if (options?.refresh) {
          setListRefreshEpoch((n) => n + 1);
        }
      }
    },
    [currentCity, showPast, freeOnly],
  );

  const filteredEvents = useMemo(
    () => events.filter((e) => matchesDateFilter(e.start_time, dateFilter)),
    [events, dateFilter],
  );

  const handleRefresh = () => {
    fetchEventsAndFavorites({ refresh: true });
  };

  useFocusEffect(
    useCallback(() => {
      fetchEventsAndFavorites();
    }, [fetchEventsAndFavorites]),
  );

  useEffect(() => {
    if (activeTab === "SAVED") {
      fetchEventsAndFavorites({ refresh: true });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!hasLoadedOnceRef.current) return;
    fetchEventsAndFavorites({ refresh: true });
  }, [currentCity, freeOnly]);

  const handleToggleFavorite = async (event: LocalEvent) => {
    setIsTogglingFav(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      let success = false;
      let data = { is_favorited: !favoriteIds.has(event.id) };

      try {
        const response = await fetch(
          `${BASE_URL}/local-events/${event.id}/favorite`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          data = await response.json();
          success = true;
        } else {
          Toast.show({ title: "Помилка", message: await parseApiError(response, "Не вдалося оновити статус події") });
        }
      } catch (e) {
        await SyncManager.enqueueAction(`${BASE_URL}/local-events/${event.id}/favorite`, 'POST');
        success = true;
        Toast.show({ title: "Офлайн", message: "Дію збережено. Буде відправлено пізніше." });
      }

      if (success) {
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          data.is_favorited ? newSet.add(event.id) : newSet.delete(event.id);
          return newSet;
        });

        setSavedEvents((prev) => {
          if (data.is_favorited) {
            return [event, ...prev];
          } else {
            return prev.filter((e) => e.id !== event.id);
          }
        });

        if (selectedEvent && selectedEvent.id === event.id) {
          setAttendeesCount((prev) =>
            prev !== null ? (data.is_favorited ? prev + 1 : prev - 1) : null,
          );
        }
      }
    } catch (error) {
      Toast.show({ title: "Помилка", message: "Не вдалося оновити статус події" });
    } finally {
      setIsTogglingFav(false);
    }
  };

  const openEventDetails = async (event: LocalEvent) => {
    setSelectedEvent(event);
    setAttendeesCount(null);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(
        `${BASE_URL}/local-events/${event.id}/attendees-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setAttendeesCount(data.attendees_count);
      }
    } catch (error) {}
  };

  const openExternalLink = (url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }),
      time: date.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const listBottomPadding = Math.max(insets.bottom + 88, 108);

  const renderExploreFilters = () => (
    <View style={s.filtersPanel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScroll}
      >
        {CITIES.map((city) => {
          const isActive = currentCity === city;
          return (
            <Pressable
              key={city}
              style={[
                s.filterChip,
                { backgroundColor: c.cardBg, borderColor: c.border },
                isActive && {
                  backgroundColor: c.accent,
                  borderColor: c.accent,
                  ...s.badgeShadow,
                },
              ]}
              onPress={() => {
                playClickSound();
                setCurrentCity(city);
              }}
            >
              <Text
                style={[
                  s.filterChipText,
                  { color: c.textMuted },
                  isActive && { color: "#FFF" },
                ]}
              >
                {city}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScroll}
      >
        <Pressable
          style={[
            s.filterChip,
            { backgroundColor: c.cardBg, borderColor: c.border },
            freeOnly && {
              backgroundColor: c.textMain,
              borderColor: c.textMain,
              ...s.badgeShadow,
            },
          ]}
          onPress={() => {
            playClickSound();
            setFreeOnly(!freeOnly);
          }}
        >
          <Text
            style={[
              s.filterChipText,
              { color: c.textMuted },
              freeOnly && { color: c.background },
            ]}
          >
            Безкоштовно
          </Text>
        </Pressable>
        {DATE_FILTERS.map((df) => {
          const isActive = dateFilter === df.id;
          return (
            <Pressable
              key={df.id}
              style={[
                s.filterChip,
                { backgroundColor: c.cardBg, borderColor: c.border },
                isActive && {
                  backgroundColor: c.textMain,
                  borderColor: c.textMain,
                  ...s.badgeShadow,
                },
              ]}
              onPress={() => {
                playClickSound();
                setDateFilter(df.id);
              }}
            >
              <Text
                style={[
                  s.filterChipText,
                  { color: c.textMuted },
                  isActive && { color: c.background },
                ]}
              >
                {df.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEventCard = ({
    item,
    index = 0,
  }: {
    item: LocalEvent;
    index?: number;
  }) => {
    const isFav = favoriteIds.has(item.id);
    const { day, time } = formatDate(item.start_time);
    const isFree =
      !item.price ||
      item.price === "0" ||
      item.price.toLowerCase().includes("безкоштовно");

    const card = (
      <Pressable
        style={({ pressed }) => [
          s.cardContainer,
          { backgroundColor: c.cardBg, borderColor: c.border },
          cardShadow(themeKey, "soft"),
          pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() =>
          runOnce(() => {
            playClickSound();
            openEventDetails(item);
          })
        }
      >
        <View
          style={[
            s.cardInner,
            { backgroundColor: c.cardBg, borderColor: c.border },
          ]}
        >
          <View style={s.imageContainer}>
            <EventCover
              imageUrl={item.image_url}
              theme={themeKey}
              style={s.cardImage}
              category={item.category}
            />
            <View
              style={[
                s.categoryBadgeTop,
                s.badgeShadow,
                { backgroundColor: c.cardBg },
              ]}
            >
              <Text style={[s.categoryTextTop, { color: c.textMain }]}>
                {item.category}
              </Text>
            </View>
            <Pressable
              style={[
                s.favButtonFloating,
                s.badgeShadow,
                { backgroundColor: c.cardBg },
                isFav && {
                  backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2",
                },
              ]}
              onPress={() => {
                playClickSound();
                handleToggleFavorite(item);
              }}
              disabled={isTogglingFav}
            >
              <Heart
                color={isFav ? "#EF4444" : c.textMuted}
                fill={isFav ? "#EF4444" : "transparent"}
                size={20}
              />
            </Pressable>
          </View>

          <View style={s.cardContent}>
            <Text
              style={[s.eventTitle, { color: c.textMain }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            <View style={s.infoGrid}>
              <View style={s.infoRow}>
                <Calendar color={c.accent} size={16} />
                <Text style={[s.infoText, { color: c.textMuted }]}>
                  {day} • {time}
                </Text>
              </View>
              <View style={s.infoRow}>
                <MapPin color={c.textMuted} size={16} />
                <Text
                  style={[s.infoText, { color: c.textMuted }]}
                  numberOfLines={1}
                >
                  {item.address}, {item.city}
                </Text>
              </View>
            </View>

            <View
              style={[s.cardFooterDivider, { backgroundColor: c.border }]}
            />

            <View style={s.cardFooter}>
              <Text
                style={[
                  s.priceText,
                  { color: c.textMain },
                  isFree && { color: "#10B981" },
                ]}
              >
                {isFree ? "Безкоштовно" : item.price}
              </Text>
              <View
                style={[s.detailsLinkBox, { backgroundColor: `${c.accent}15` }]}
              >
                <Text style={[s.detailsLink, { color: c.accent }]}>
                  Детальніше
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );

    if (!animationsEnabled) return card;

    return (
      <MotiView
        key={`${item.id}-${listRefreshEpoch}`}
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "timing",
          duration: 380,
          delay: Math.min(index * 45, 220),
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
      <View style={s.screenHeader}>
        <Text style={[s.screenTitle, { color: c.textMain }]}>Афіша 📍</Text>
      </View>

      <View style={s.tabsContainer}>
        <Pressable
          style={({ pressed }) => [
            s.tab,
            { backgroundColor: c.border },
            activeTab === "EXPLORE" && {
              backgroundColor: c.textMain,
              ...s.badgeShadow,
            },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            playClickSound();
            if (activeTab === "EXPLORE") {
              exploreListRef.current?.scrollToOffset({ offset: 0, animated: true });
            } else {
              setActiveTab("EXPLORE");
            }
          }}
        >
          <Text
            style={[
              s.tabText,
              { color: c.textMuted },
              activeTab === "EXPLORE" && { color: c.background },
            ]}
          >
            Усі події
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            s.tab,
            { backgroundColor: c.border },
            activeTab === "SAVED" && {
              backgroundColor: c.textMain,
              ...s.badgeShadow,
            },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            playClickSound();
            if (activeTab === "SAVED") {
              savedListRef.current?.scrollToOffset({ offset: 0, animated: true });
            } else {
              setActiveTab("SAVED");
            }
          }}
        >
          <Text
            style={[
              s.tabText,
              { color: c.textMuted },
              activeTab === "SAVED" && { color: c.background },
            ]}
          >
            Збережене
          </Text>
          {savedEvents.length > 0 && (
            <View style={[s.badgeCounter, { backgroundColor: c.accent }]}>
              <Text style={s.badgeCounterText}>{savedEvents.length}</Text>
            </View>
          )}
        </Pressable>
      </View>
      {activeTab === "SAVED" && (
       <View style={s.savedFilters}>
  {/* Кнопка "Майбутні" */}
  <Pressable
    onPress={() => { playClickSound(); setShowPast(false); }}
    style={({ pressed }) => [
      s.miniFilter,
      {
        backgroundColor: !showPast 
          ? (isDark ? "#FFFFFF" : c.accent) 
          : (isDark ? "#333333" : "#E5E7EB"),
        borderColor: c.border,
      },
      pressed && animationsEnabled && { opacity: 0.7 }
    ]}
  >
    <Text style={[
      s.miniFilterText,
      {
        color: !showPast 
          ? (isDark ? "#000000" : "#FFFFFF") 
          : (isDark ? "#FFFFFF" : c.textMuted)
      }
    ]}>
      Майбутні
    </Text>
  </Pressable>

  {/* Кнопка "Історія" */}
  <Pressable
    onPress={() => { playClickSound(); setShowPast(true); }}
    style={({ pressed }) => [
      s.miniFilter,
      {
        backgroundColor: showPast 
          ? (isDark ? "#FFFFFF" : c.accent) 
          : (isDark ? "#333333" : "#E5E7EB"),
        borderColor: c.border,
      },
      pressed && animationsEnabled && { opacity: 0.7 }
    ]}
  >
    <Text style={[
      s.miniFilterText,
      {
        color: showPast 
          ? (isDark ? "#000000" : "#FFFFFF") 
          : (isDark ? "#FFFFFF" : c.textMuted)
      }
    ]}>
      Історія
    </Text>
  </Pressable>
</View>
      )}

      {activeTab === "EXPLORE" ? renderExploreFilters() : null}

      <View style={s.listArea}>
        {activeTab === "EXPLORE" ? (
          <FlatList
            ref={exploreListRef}
            style={s.list}
            data={isLoading ? [] : filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventCard}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={7}
            removeClippedSubviews={true}
            contentContainerStyle={[
              s.listContent,
              (isLoading || filteredEvents.length === 0) && s.listContentGrow,
              { paddingBottom: listBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={c.accent}
              />
            }
            ListEmptyComponent={
              isLoading ? (
                <EventCardSkeleton isDark={isDark} count={2} />
              ) : (
                <View style={s.emptyStateBox}>
                  <Sparkles
                    color={c.textMuted}
                    size={48}
                    style={{ marginBottom: 16 }}
                    opacity={0.5}
                  />
                  <Text style={[s.emptyTitle, { color: c.textMain }]}>
                    Тут поки тихо
                  </Text>
                  <Text style={[s.emptyText, { color: c.textMuted }]}>
                    {dateFilter !== "ALL"
                      ? "За обраним періодом подій немає. Спробуй інший фільтр."
                      : `${currentCity === "Всі міста" ? "В Україні" : `У місті ${currentCity}`} наразі немає запланованих подій. Зазирни сюди трохи згодом! 🌱`}
                  </Text>
                </View>
              )
            }
          />
        ) : (
          <FlatList
            ref={savedListRef}
            style={s.list}
            data={isLoading ? [] : savedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventCard}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={7}
            removeClippedSubviews={true}
            contentContainerStyle={[
              s.listContent,
              (isLoading || savedEvents.length === 0) && s.listContentGrow,
              { paddingBottom: listBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={c.accent}
              />
            }

            ListEmptyComponent={
              isLoading ? (
                <EventCardSkeleton isDark={isDark} count={2} />
              ) : (
                <View style={s.emptyStateBox}>
                  {/* Змінюємо іконку/текст залежно від того, чи це історія, чи майбутні */}
                  {showPast ? (
                    <>
                      <Clock
                        color={c.textMuted}
                        size={48}
                        style={{ marginBottom: 16 }}
                        opacity={0.5}
                      />
                      <Text style={[s.emptyTitle, { color: c.textMain }]}>
                        Історія порожня
                      </Text>
                      <Text style={[s.emptyText, { color: c.textMuted }]}>
                        Тут будуть події, які ви вже відвідали. Час наповнювати
                        життя спогадами! 🌱
                      </Text>
                    </>
                  ) : (
                    <>
                      <Bookmark
                        color={c.textMuted}
                        size={48}
                        style={{ marginBottom: 16 }}
                        opacity={0.5}
                      />
                      <Text style={[s.emptyTitle, { color: c.textMain }]}>
                        Планів поки немає
                      </Text>
                      <Text style={[s.emptyText, { color: c.textMuted }]}>
                        Ви ще не додали жодної події. Знайдіть щось цікаве в
                        афіші, щоб почати свій шлях! 🚀
                      </Text>
                      <Pressable
                        style={[s.findEventsBtn, { backgroundColor: c.accent }]}
                        onPress={() => {
                          playClickSound();
                          setActiveTab("EXPLORE");
                        }}
                      >
                        <Text style={s.findEventsBtnText}>Шукати події 🔎</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )
            }
          />
        )}
      </View>

      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        transparent={true}
      >
        {selectedEvent &&
          (() => {
            const { day, time } = formatDate(selectedEvent.start_time);
            const isFav = favoriteIds.has(selectedEvent.id);

            return (
              <View
                style={[s.modalFullScreen, { backgroundColor: 'transparent' }]}
              >
                <BlurView intensity={isDark ? 80 : 100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={{ paddingBottom: 0 }}
                >
                  <View style={s.modalImageContainer}>
                    <EventCover
                      imageUrl={selectedEvent.image_url}
                      theme={themeKey}
                      style={s.modalImage}
                      large
                      category={selectedEvent.category}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        s.floatingModalBackBtn,
                        {
                          top: Math.max(insets.top + 10, 20),
                          backgroundColor: c.cardBg,
                          borderColor: c.border,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        playClickSound();
                        setSelectedEvent(null);
                      }}
                    >
                      <ChevronLeft
                        color={c.textMain}
                        size={28}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>

                  <View
                    style={[s.modalBody, { backgroundColor: c.background, paddingBottom: 120 }]}
                  >
                    <View
                      style={[
                        s.modalCategoryBadge,
                        { backgroundColor: c.border },
                      ]}
                    >
                      <Text
                        style={[s.modalCategoryText, { color: c.textMuted }]}
                      >
                        {selectedEvent.category}
                      </Text>
                    </View>

                    <Text style={[s.modalTitle, { color: c.textMain }]}>
                      {selectedEvent.name}
                    </Text>

                    <View
                      style={[
                        s.modalInfoGrid,
                        { backgroundColor: c.cardBg },
                        s.lightShadow,
                      ]}
                    >
                      <View style={s.modalInfoItem}>
                        <View
                          style={[
                            s.modalIconBg,
                            { backgroundColor: `${c.accent}15` },
                          ]}
                        >
                          <Calendar color={c.accent} size={20} />
                        </View>
                        <Text style={[s.modalInfoLabel, { color: c.textMain }]}>
                          {day}
                        </Text>
                      </View>
                      <View style={s.modalInfoItem}>
                        <View
                          style={[
                            s.modalIconBg,
                            { backgroundColor: `${c.accent}15` },
                          ]}
                        >
                          <Clock color={c.accent} size={20} />
                        </View>
                        <Text style={[s.modalInfoLabel, { color: c.textMain }]}>
                          {time}
                        </Text>
                      </View>
                      {selectedEvent.end_time && (
                        <View style={s.modalInfoItem}>
                          <View
                            style={[
                              s.modalIconBg,
                              { backgroundColor: `${c.accent}15` },
                            ]}
                          >
                            <Clock color={c.accent} size={20} />
                          </View>
                          <Text style={[s.modalInfoLabel, { color: c.textMain }]}>
                            До {formatDate(selectedEvent.end_time).time}
                          </Text>
                        </View>
                      )}
                      <View style={s.modalInfoItem}>
                        <View
                          style={[
                            s.modalIconBg,
                            { backgroundColor: `${c.accent}15` },
                          ]}
                        >
                          <MapPin color={c.accent} size={20} />
                        </View>
                        <Text style={[s.modalInfoLabel, { color: c.textMain }]}>
                          {selectedEvent.address}, {selectedEvent.city}
                        </Text>
                      </View>
                    </View>

                    {attendeesCount !== null && attendeesCount > 0 && (
                      <View
                        style={[
                          s.attendeesBox,
                          {
                            backgroundColor: `${c.accent}10`,
                            borderColor: `${c.accent}30`,
                          },
                        ]}
                      >
                        <Sparkles color={c.accent} size={24} />
                        <Text style={[s.attendeesText, { color: c.textMain }]}>
                          Супер! Вже{" "}
                          <Text style={{ fontWeight: "bold", color: c.accent }}>
                            {attendeesCount}
                          </Text>{" "}
                          Alter-івців додали цю подію до планів 🔥
                        </Text>
                      </View>
                    )}



                    <Text style={[s.modalDescTitle, { color: c.textMain }]}>
                      Про подію
                    </Text>
                    <Text style={[s.modalDescText, { color: c.textMuted }]}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                </ScrollView>

                <View
                  style={[
                    s.stickyFooter,
                    { backgroundColor: c.cardBg, borderTopColor: c.border },
                    s.stickyFooterShadow,
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      s.mainBtn,
                      { borderColor: c.border, backgroundColor: c.background },
                      isFav && {
                        borderColor: "#FCA5A5",
                        backgroundColor: isDark
                          ? "rgba(239,68,68,0.2)"
                          : "#FEF2F2",
                      },
                      pressed && animationsEnabled && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      playClickSound();
                      handleToggleFavorite(selectedEvent);
                    }}
                    disabled={isTogglingFav}
                  >
                    <Heart
                      color={isFav ? "#EF4444" : c.textMain}
                      fill={isFav ? "#EF4444" : "transparent"}
                      size={24}
                    />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      s.registerBtn,
                      { backgroundColor: c.accent },
                      !selectedEvent.external_link && { opacity: 0.5 },
                      pressed &&
                        selectedEvent.external_link && {
                          opacity: 0.85,
                          transform: [{ scale: 0.98 }],
                        },
                      s.lightShadow,
                    ]}
                    onPress={() => {
                      if (selectedEvent.external_link) {
                        openExternalLink(selectedEvent.external_link);
                      }
                    }}
                    disabled={!selectedEvent.external_link}
                  >
                    <Text style={s.registerBtnText}>
                      {selectedEvent.external_link
                        ? "Перейти до реєстрації"
                        : "Без реєстрації"}
                    </Text>
                    {selectedEvent.external_link && (
                      <ExternalLink
                        color="#FFF"
                        size={18}
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })()}
      </Modal>

      <BottomNav isDark={isDark} theme={themeKey} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenX,
    marginTop: 4,
    marginBottom: 10,
  },
  roundBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  screenTitle: { ...Typography.titleXl, fontSize: 26 },

  beautifulShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  badgeShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  lightShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  stickyFooterShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },

  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screenX,
    marginBottom: 8,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radii.full,
    flexDirection: "row",
    justifyContent: "center",
  },
  tabText: { ...Typography.titleMd, fontSize: 15 },
  badgeCounter: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeCounterText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },

  listArea: { flex: 1 },
  list: { flex: 1 },
  filtersPanel: { paddingHorizontal: Spacing.screenX, gap: 6, marginBottom: 6 },
  filterScroll: { gap: 8, paddingRight: Spacing.screenX },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  filterChipText: { ...Typography.body, fontSize: 13, fontWeight: "600" },

  listContent: { paddingHorizontal: Spacing.screenX },
  listContentGrow: { flexGrow: 1 },
  emptyStateBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: { ...Typography.titleLg, marginBottom: 12 },
  emptySubtitle: {
    ...Typography.body,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  findEventsBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.full,
  },
  findEventsBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },

  cardContainer: { marginBottom: 14, borderRadius: Radii.xl, borderWidth: 1 },
  cardInner: { borderRadius: Radii.xl, overflow: "hidden", borderWidth: 1 },
  imageContainer: { width: "100%", height: 180, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  categoryBadgeTop: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    overflow: "hidden",
  },
  categoryTextTop: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  favButtonFloating: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: Radii.full,
    overflow: "hidden",
  },

  cardContent: { padding: 18 },
  eventTitle: {
    ...Typography.titleLg,
    fontSize: 20,
    marginBottom: 12,
    lineHeight: 26,
  },
  infoGrid: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoText: { ...Typography.body, marginLeft: 8, flex: 1 },

  cardFooterDivider: { height: 1, marginBottom: 12, opacity: 0.6 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: { fontSize: 16, fontWeight: "700" },
  detailsLinkBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  detailsLink: { fontSize: 13, fontWeight: "700" },

  modalFullScreen: { flex: 1 },
  modalImageContainer: { position: "relative", width: "100%", height: 320 },
  modalImage: { width: "100%", height: "100%" },

  floatingModalBackBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  modalBody: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
  },
  modalCategoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
    marginBottom: 16,
    overflow: "hidden",
  },
  modalCategoryText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  modalTitle: {
    ...Typography.titleXl,
    fontSize: 28,
    marginBottom: 24,
    lineHeight: 34,
  },

  modalInfoGrid: {
    gap: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: Radii.xl,
    overflow: "hidden",
  },
  modalInfoItem: { flexDirection: "row", alignItems: "center" },
  modalIconBg: { padding: 10, borderRadius: Radii.full },
  modalInfoLabel: {
    ...Typography.titleMd,
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },

  attendeesBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: Radii.lg,
    marginBottom: 32,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  attendeesText: { flex: 1, fontSize: 15, marginLeft: 12, lineHeight: 22 },

  modalDescTitle: { ...Typography.titleLg, fontSize: 20, marginBottom: 12 },
  modalDescText: { ...Typography.body, lineHeight: 26, fontSize: 16 },

  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
    gap: 12,
  },
  mainBtn: {
    width: 60,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.full,
    borderWidth: 2,
  },
  registerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: Radii.full,
    overflow: "hidden",
  },
  registerBtnText: { ...Typography.titleMd, color: "#FFF", fontSize: 16 },
  savedFilters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screenX,
    gap: 10,
    marginBottom: 10,
  },
  miniFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  miniFilterText: {
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
