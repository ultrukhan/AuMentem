import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Pressable, 
  ActivityIndicator, Linking, Modal, ScrollView, Alert, Image, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { 
  Calendar, MapPin, Clock, ExternalLink, 
  Heart, Bookmark, ChevronLeft, ArrowLeft, Sparkles
} from 'lucide-react-native';

import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { playClickSound } from '@/utils/audio';

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

const CITIES = ['Всі міста', 'Львів', 'Київ', 'Одеса', 'Дніпро', 'Харків'];

export default function LocalEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];

  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'SAVED'>('EXPLORE');
  
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
  const [attendeesCount, setAttendeesCount] = useState<number | null>(null);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const [currentCity, setCurrentCity] = useState('Львів');

  const fetchEventsAndFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      let url = `${BASE_URL}/local-events/`;
      if (currentCity !== 'Всі міста') {
        url += `?city=${encodeURIComponent(currentCity)}`;
      }

      const [eventsRes, favRes] = await Promise.all([
        fetch(url, { headers }),
        fetch(`${BASE_URL}/local-events/my/favorites`, { headers })
      ]);

      if (eventsRes.ok) {
        const eventsData: LocalEvent[] = await eventsRes.json();
        setEvents(eventsData);
      }

      if (favRes.ok) {
        const favData: LocalEvent[] = await favRes.json();
        setSavedEvents(favData);
        setFavoriteIds(new Set(favData.map(e => e.id)));
      }
    } catch (error) {
      console.error('Помилка завантаження подій:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCity]);

  useFocusEffect(
    useCallback(() => {
      fetchEventsAndFavorites();
    }, [fetchEventsAndFavorites])
  );

  const handleToggleFavorite = async (event: LocalEvent) => {
    setIsTogglingFav(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/local-events/${event.id}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          data.is_favorited ? newSet.add(event.id) : newSet.delete(event.id);
          return newSet;
        });

        setSavedEvents(prev => {
          if (data.is_favorited) {
            return [event, ...prev]; 
          } else {
            return prev.filter(e => e.id !== event.id); 
          }
        });

        if (selectedEvent && selectedEvent.id === event.id) {
          setAttendeesCount(prev => (prev !== null ? (data.is_favorited ? prev + 1 : prev - 1) : null));
        }
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося оновити статус події');
    } finally {
      setIsTogglingFav(false);
    }
  };

  const openEventDetails = async (event: LocalEvent) => {
    setSelectedEvent(event);
    setAttendeesCount(null);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/local-events/${event.id}/attendees-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendeesCount(data.attendees_count);
      }
    } catch (error) {}
  };

  const openExternalLink = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }),
      time: date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderEventCard = ({ item }: { item: LocalEvent }) => {
    const isFav = favoriteIds.has(item.id);
    const { day, time } = formatDate(item.start_time);
    const isFree = !item.price || item.price === '0' || item.price.toLowerCase().includes('безкоштовно');

    return (
      <Pressable 
        style={({ pressed }) => [
          s.cardContainer, 
          { backgroundColor: c.cardBg }, // Рятує тіні на Android від сірого контуру
          s.beautifulShadow,
          pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }
        ]} 
        onPress={() => { playClickSound(); openEventDetails(item); }}
      >
        <View style={[s.cardInner, { backgroundColor: c.cardBg }]}>
          <View style={s.imageContainer}>
            <Image 
              source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30' }} 
              style={s.cardImage} 
              resizeMode="cover" 
            />
            <View style={s.imageOverlay} />
            <View style={[s.categoryBadgeTop, s.badgeShadow, { backgroundColor: c.cardBg }]}>
              <Text style={[s.categoryTextTop, { color: c.textMain }]}>{item.category}</Text>
            </View>
            <Pressable 
              style={[
                s.favButtonFloating, 
                s.badgeShadow, 
                { backgroundColor: c.cardBg }, 
                isFav && { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2' }
              ]} 
              onPress={() => { playClickSound(); handleToggleFavorite(item); }}
              disabled={isTogglingFav}
            >
              <Heart color={isFav ? '#EF4444' : c.textMuted} fill={isFav ? '#EF4444' : 'transparent'} size={20} />
            </Pressable>
          </View>

          <View style={s.cardContent}>
            <Text style={[s.eventTitle, { color: c.textMain }]} numberOfLines={2}>{item.name}</Text>
            
            <View style={s.infoGrid}>
              <View style={s.infoRow}>
                <Calendar color={c.accent} size={16} />
                <Text style={[s.infoText, { color: c.textMuted }]}>{day} • {time}</Text>
              </View>
              <View style={s.infoRow}>
                <MapPin color={c.textMuted} size={16} />
                <Text style={[s.infoText, { color: c.textMuted }]} numberOfLines={1}>{item.address}, {item.city}</Text>
              </View>
            </View>

            <View style={[s.cardFooterDivider, { backgroundColor: c.border }]} />
            
            <View style={s.cardFooter}>
              <Text style={[s.priceText, { color: c.textMain }, isFree && { color: '#10B981' }]}>
                {isFree ? 'Безкоштовно' : item.price}
              </Text>
              <View style={[s.detailsLinkBox, { backgroundColor: `${c.accent}15` }]}>
                <Text style={[s.detailsLink, { color: c.accent }]}>Детальніше</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      
      <View style={s.screenHeader}>
        <Pressable 
          onPress={() => { playClickSound(); router.replace('/'); }} 
          style={({ pressed }) => [
            s.roundBackBtn, 
            { backgroundColor: c.cardBg, borderColor: c.border },
            s.badgeShadow,
            pressed && { opacity: 0.7 }
          ]}
        >
          <ArrowLeft color={c.textMain} size={24} strokeWidth={2.5} />
        </Pressable>
        <Text style={[s.screenTitle, { color: c.textMain }]}>Афіша 📍</Text>
      </View>

      <View style={s.tabsContainer}>
        <Pressable 
          style={({ pressed }) => [
            s.tab, 
            { backgroundColor: c.border }, 
            activeTab === 'EXPLORE' && { backgroundColor: c.textMain, ...s.badgeShadow },
            pressed && { opacity: 0.8 }
          ]} 
          onPress={() => { playClickSound(); setActiveTab('EXPLORE'); }}
        >
          <Text style={[s.tabText, { color: c.textMuted }, activeTab === 'EXPLORE' && { color: c.background }]}>Усі події</Text>
        </Pressable>
        <Pressable 
          style={({ pressed }) => [
            s.tab, 
            { backgroundColor: c.border }, 
            activeTab === 'SAVED' && { backgroundColor: c.textMain, ...s.badgeShadow },
            pressed && { opacity: 0.8 }
          ]} 
          onPress={() => { playClickSound(); setActiveTab('SAVED'); }}
        >
          <Text style={[s.tabText, { color: c.textMuted }, activeTab === 'SAVED' && { color: c.background }]}>Збережене</Text>
          {savedEvents.length > 0 && (
            <View style={[s.badgeCounter, { backgroundColor: c.accent }]}>
              <Text style={s.badgeCounterText}>{savedEvents.length}</Text>
            </View>
          )}
        </Pressable>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 80 }} />
      ) : activeTab === 'EXPLORE' ? (
        <>
          <View style={s.cityFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityFilterScroll}>
              {CITIES.map(city => {
                const isActive = currentCity === city;
                return (
                  <Pressable
                    key={city}
                    style={[
                      s.cityChip, 
                      { backgroundColor: c.cardBg, borderColor: c.border },
                      isActive && { backgroundColor: c.accent, borderColor: c.accent, ...s.badgeShadow }
                    ]}
                    onPress={() => { playClickSound(); setCurrentCity(city); }}
                  >
                    <Text style={[s.cityChipText, { color: c.textMuted }, isActive && { color: '#FFF' }]}>{city}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={renderEventCard}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyStateBox}>
                <Sparkles color={c.textMuted} size={48} style={{ marginBottom: 16 }} opacity={0.5} />
                <Text style={[s.emptyTitle, { color: c.textMain }]}>Тут поки тихо</Text>
                <Text style={[s.emptyText, { color: c.textMuted }]}>
                  {currentCity === 'Всі міста' ? 'В Україні' : `У місті ${currentCity}`} наразі немає запланованих подій. Зазирни сюди трохи згодом! 🌱
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={savedEvents}
          keyExtractor={item => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyStateBox}>
              <Bookmark color={c.textMuted} size={56} style={{ marginBottom: 16 }} strokeWidth={1.5} opacity={0.5} />
              <Text style={[s.emptyTitle, { color: c.textMain }]}>Збереженого немає</Text>
              <Text style={[s.emptyText, { color: c.textMuted }]}>Ви ще не додали жодної події до своїх планів. Знайдіть щось цікаве в афіші!</Text>
              <Pressable 
                style={({ pressed }) => [s.findEventsBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }, s.beautifulShadow]} 
                onPress={() => { playClickSound(); setActiveTab('EXPLORE'); }}
              >
                <Text style={s.findEventsBtnText}>Шукати події 🔎</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedEvent} animationType="slide" transparent={false}>
        {selectedEvent && (() => {
          const { day, time } = formatDate(selectedEvent.start_time);
          const isFav = favoriteIds.has(selectedEvent.id);

          return (
            <View style={[s.modalFullScreen, { backgroundColor: c.background }]}>
              
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 140 }}>
                
                <View style={s.modalImageContainer}>
                  <Image 
                    source={{ uri: selectedEvent.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30' }} 
                    style={s.modalImage} 
                  />
                  <Pressable 
                    style={({ pressed }) => [
                      s.floatingModalBackBtn, 
                      { top: Math.max(insets.top + 10, 20) }, 
                      pressed && { opacity: 0.7 }
                    ]} 
                    onPress={() => setSelectedEvent(null)}
                  >
                    <ChevronLeft color="#333" size={28} strokeWidth={2.5} />
                  </Pressable>
                </View>

                <View style={[s.modalBody, { backgroundColor: c.background }]}>
                  <View style={[s.modalCategoryBadge, { backgroundColor: c.border }]}>
                    <Text style={[s.modalCategoryText, { color: c.textMuted }]}>{selectedEvent.category}</Text>
                  </View>

                  <Text style={[s.modalTitle, { color: c.textMain }]}>{selectedEvent.name}</Text>

                  <View style={[s.modalInfoGrid, { backgroundColor: c.cardBg }, s.lightShadow]}>
                    <View style={s.modalInfoItem}>
                      <View style={[s.modalIconBg, { backgroundColor: `${c.accent}15` }]}><Calendar color={c.accent} size={20} /></View>
                      <Text style={[s.modalInfoLabel, { color: c.textMain }]}>{day}</Text>
                    </View>
                    <View style={s.modalInfoItem}>
                      <View style={[s.modalIconBg, { backgroundColor: `${c.accent}15` }]}><Clock color={c.accent} size={20} /></View>
                      <Text style={[s.modalInfoLabel, { color: c.textMain }]}>{time}</Text>
                    </View>
                    <View style={s.modalInfoItem}>
                      <View style={[s.modalIconBg, { backgroundColor: `${c.accent}15` }]}><MapPin color={c.accent} size={20} /></View>
                      <Text style={[s.modalInfoLabel, { color: c.textMain }]}>{selectedEvent.address}, {selectedEvent.city}</Text>
                    </View>
                  </View>

                  {attendeesCount !== null && attendeesCount > 0 && (
                    <View style={[s.attendeesBox, { backgroundColor: `${c.accent}10`, borderColor: `${c.accent}30` }]}>
                      <Sparkles color={c.accent} size={24} />
                      <Text style={[s.attendeesText, { color: c.textMain }]}>
                        Супер! Вже <Text style={{ fontWeight: 'bold', color: c.accent }}>{attendeesCount}</Text> Alter-івців додали цю подію до планів 🔥
                      </Text>
                    </View>
                  )}

                  <Text style={[s.modalDescTitle, { color: c.textMain }]}>Про подію</Text>
                  <Text style={[s.modalDescText, { color: c.textMuted }]}>{selectedEvent.description}</Text>
                </View>
              </ScrollView>

              <View style={[s.stickyFooter, { backgroundColor: c.cardBg, borderTopColor: c.border }, s.stickyFooterShadow]}>
                <Pressable 
                  style={({ pressed }) => [
                    s.mainBtn, 
                    { borderColor: c.border, backgroundColor: c.background }, 
                    isFav && { borderColor: '#FCA5A5', backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEF2F2' },
                    pressed && { opacity: 0.7 }
                  ]} 
                  onPress={() => { playClickSound(); handleToggleFavorite(selectedEvent); }}
                  disabled={isTogglingFav}
                >
                  <Heart color={isFav ? "#EF4444" : c.textMain} fill={isFav ? "#EF4444" : "transparent"} size={24} />
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    s.registerBtn, 
                    { backgroundColor: c.accent }, 
                    !selectedEvent.external_link && { opacity: 0.5 },
                    pressed && selectedEvent.external_link && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    s.lightShadow
                  ]} 
                  onPress={() => selectedEvent.external_link && openExternalLink(selectedEvent.external_link)}
                  disabled={!selectedEvent.external_link}
                >
                  <Text style={s.registerBtnText}>
                    {selectedEvent.external_link ? 'Перейти до реєстрації' : 'Без реєстрації'}
                  </Text>
                  {selectedEvent.external_link && <ExternalLink color="#FFF" size={18} style={{ marginLeft: 8 }} />}
                </Pressable>
              </View>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, marginTop: 8, marginBottom: 16 },
  roundBackBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  screenTitle: { ...Typography.titleXl, fontSize: 26 },
  
  beautifulShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  badgeShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  lightShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  stickyFooterShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16 },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: Spacing.screenX, marginBottom: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radii.full, flexDirection: 'row', justifyContent: 'center' },
  tabText: { ...Typography.titleMd, fontSize: 15 },
  badgeCounter: { borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  badgeCounterText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  cityFilterContainer: { marginBottom: 16 },
  cityFilterScroll: { paddingHorizontal: Spacing.screenX, gap: 10 },
  cityChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radii.full, borderWidth: 1, overflow: 'hidden' }, 
  cityChipText: { ...Typography.body, fontSize: 14, fontWeight: '600' },

  listContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 120 },
  emptyStateBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyTitle: { ...Typography.titleLg, marginBottom: 12 },
  emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  findEventsBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: Radii.full },
  findEventsBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  cardContainer: { marginBottom: 20, borderRadius: Radii.xl }, 
  cardInner: { borderRadius: Radii.xl, overflow: 'hidden' }, 
  imageContainer: { width: '100%', height: 180, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  categoryBadgeTop: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.full, overflow: 'hidden' },
  categoryTextTop: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  favButtonFloating: { position: 'absolute', top: 12, right: 12, padding: 8, borderRadius: Radii.full, overflow: 'hidden' },
  
  cardContent: { padding: 18 },
  eventTitle: { ...Typography.titleLg, fontSize: 20, marginBottom: 12, lineHeight: 26 },
  infoGrid: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { ...Typography.body, marginLeft: 8, flex: 1 },
  
  cardFooterDivider: { height: 1, marginBottom: 12, opacity: 0.6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 16, fontWeight: '700' },
  detailsLinkBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.md },
  detailsLink: { fontSize: 13, fontWeight: '700' },

  modalFullScreen: { flex: 1 },
  modalImageContainer: { position: 'relative', width: '100%', height: 320 },
  modalImage: { width: '100%', height: '100%' },
  
  floatingModalBackBtn: { 
    position: 'absolute', 
    left: 16, 
    zIndex: 10, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 
  },

  modalBody: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -30 }, 
  modalCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.md, marginBottom: 16, overflow: 'hidden' },
  modalCategoryText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  modalTitle: { ...Typography.titleXl, fontSize: 28, marginBottom: 24, lineHeight: 34 },
  
  modalInfoGrid: { gap: 16, marginBottom: 32, padding: 16, borderRadius: Radii.xl, overflow: 'hidden' },
  modalInfoItem: { flexDirection: 'row', alignItems: 'center' },
  modalIconBg: { padding: 10, borderRadius: Radii.full },
  modalInfoLabel: { ...Typography.titleMd, fontSize: 16, marginLeft: 16, flex: 1 },
  
  attendeesBox: { flexDirection: 'row', padding: 16, borderRadius: Radii.lg, marginBottom: 32, alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  attendeesText: { flex: 1, fontSize: 15, marginLeft: 12, lineHeight: 22 },
  
  modalDescTitle: { ...Typography.titleLg, fontSize: 20, marginBottom: 12 },
  modalDescText: { ...Typography.body, lineHeight: 26, fontSize: 16 },
  
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, borderTopWidth: 1, gap: 12 },
  mainBtn: { width: 60, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full, borderWidth: 2 },
  registerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: Radii.full, overflow: 'hidden' },
  registerBtnText: { ...Typography.titleMd, color: '#FFF', fontSize: 16 },
});