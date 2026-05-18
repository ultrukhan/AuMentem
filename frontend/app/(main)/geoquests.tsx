import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView,
  ActivityIndicator, ScrollView, Animated, PanResponder,
  Dimensions, Platform, Alert, Modal
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import polyline from '@mapbox/polyline';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Navigation, X,
  MoveLeft, MoveRight, MoveUp,
  LocateFixed, MapPin, Camera, Share, Ghost, Check, Image as ImageIcon
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { Colors, Typography, Radii, Spacing, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_PAN_Y = SCREEN_HEIGHT - 160;

export default function GeoQuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const mapRef = useRef<MapView>(null);
  const panY = useRef(new Animated.Value(INITIAL_PAN_Y)).current;

  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [nearestQuests, setNearestQuests] = useState<any[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [activeUserQuestId, setActiveUserQuestId] = useState<string | null>(null);

  const [routeData, setRouteData] = useState<any>(null);
  const [path, setPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [saveToAlbum, setSaveToAlbum] = useState(true);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [completedQuestId, setCompletedQuestId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const isNavigatingRef = useRef(isNavigating);
  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  useEffect(() => {
    (async () => {
      const savedSettings = await SecureStore.getItemAsync('userSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setAnimationsEnabled(parsed.animations !== false);
        } catch {}
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Помилка', 'Потрібен доступ до геопозиції');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      fetchNearestQuests(loc.coords.latitude, loc.coords.longitude);

      const saved = await SecureStore.getItemAsync('activeQuest');
      if (saved) {
        const { userQuestId, quest } = JSON.parse(saved);
        setActiveUserQuestId(userQuestId);
        setSelectedQuest(quest);
        setIsNavigating(true);
        Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.55, useNativeDriver: false }).start();
      }
    })();
  }, []);

  const fetchNearestQuests = async (lat: number, lng: number) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${BASE_URL}/geo-quests/nearest?lat=${lat}&lng=${lng}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let fetchedQuests = [];
      if (res.ok) fetchedQuests = await res.json();
      setNearestQuests(fetchedQuests);
      if (fetchedQuests.length > 0) setSelectedQuest(fetchedQuests[0].geo_quest);
    } catch (e) {}
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 600);
    }
  };

  const buildRoute = async (quest: any) => {
    if (!userLocation) return;
    const destLat = quest.place.coordinates?.lat;
    const destLng = quest.place.coordinates?.lng;
    if (!destLat || !destLng) {
      Alert.alert('Помилка', 'Немає координат цілі.');
      return;
    }

    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${userLocation.longitude},${userLocation.latitude};${destLng},${destLat}?overview=full&geometries=polyline&steps=true`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.code === 'Ok' && json.routes.length > 0) {
      const route = json.routes[0];
      const leg = route.legs[0];
      const durationMins = Math.round(route.duration / 60);
      const distKm = (route.distance / 1000).toFixed(1);

      setRouteData({
        duration: { text: durationMins < 1 ? 'Менше хвилини' : `${durationMins} хв` },
        distance: { text: `${distKm} км` },
      });

      const adaptedSteps = leg.steps.map((step: any) => {
        let instr = 'Рухайтесь прямо';
        if (step.maneuver.modifier?.includes('left')) instr = 'Поверніть ліворуч';
        if (step.maneuver.modifier?.includes('right')) instr = 'Поверніть праворуч';
        return {
          html_instructions: step.name ? `${instr} на ${step.name}` : instr,
          distance: { text: Math.round(step.distance) + ' м' },
        };
      });

      setSteps(adaptedSteps.filter((s: any) => parseInt(s.distance.text) > 0));
      const points = polyline.decode(route.geometry);
      setPath(points.map((p: any) => ({ latitude: p[0], longitude: p[1] })));

      setIsNavigating(true);
      setShowHud(true);
      Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.55, useNativeDriver: false }).start();
    } else {
      Alert.alert('Помилка маршруту', 'Не вдалося прокласти пішохідний шлях.');
    }
  };

  const startNavigationAndQuest = async () => {
    if (!userLocation || !selectedQuest) return;
    setIsLoading(true);

    try {
      const saved = await SecureStore.getItemAsync('activeQuest');
      if (saved) {
        const { userQuestId, quest } = JSON.parse(saved);
        if (quest.id === selectedQuest.id) {
          setActiveUserQuestId(userQuestId);
          await buildRoute(selectedQuest);
          setIsLoading(false);
          return;
        }
      }

      const token = await SecureStore.getItemAsync('userToken');
      const startRes = await fetch(`${BASE_URL}/geo-quests/${selectedQuest.id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        Alert.alert('Увага', err.detail || 'Не вдалося почати квест');
        setIsLoading(false);
        return;
      }

      const activeQuestData = await startRes.json();
      setActiveUserQuestId(activeQuestData.id);
      await SecureStore.setItemAsync('activeQuest', JSON.stringify({
        userQuestId: activeQuestData.id,
        quest: selectedQuest,
      }));

      await buildRoute(selectedQuest);
    } catch (e) {
      Alert.alert('Помилка', 'Мережевий збій при прокладанні маршруту');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletePress = () => {
    setFinishModalVisible(true);
  };

  const handleConfirmFinish = () => {
    setFinishModalVisible(false);
    setTimeout(() => {
      processQuestCompletion();
    }, 400);
  };

  const processQuestCompletion = async () => {
    if (!activeUserQuestId) return;
    setIsCompleting(true);

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const token = await SecureStore.getItemAsync('userToken');
      let finalPhotoUrl = null;

      if (saveToAlbum) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Помилка', 'Додаток потребує дозволу для роботи з камерою.');
          setIsCompleting(false);
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        });

        if (result.canceled || !result.assets?.length) {
          setIsCompleting(false);
          return;
        }

        const imageUri = result.assets[0].uri;

        const sigRes = await fetch(`${BASE_URL}/geo-quests/generate-upload-signature`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_geo_quest_id: activeUserQuestId,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }),
        });

        if (!sigRes.ok) {
          const errorText = await sigRes.text();
          Alert.alert('Помилка Сервера', `Бекенд відмовив у підписі: ${errorText}`);
          setIsCompleting(false);
          return;
        }

        const sigData = await sigRes.json();
        const formData = new FormData();
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'proof.jpg' } as any);
        formData.append('api_key', sigData.api_key);
        formData.append('timestamp', sigData.timestamp.toString());
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`,
          { method: 'POST', body: formData, headers: { Accept: 'application/json' } }
        );
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) {
          finalPhotoUrl = cloudData.secure_url;
        }
      }

      const res = await fetch(`${BASE_URL}/geo-quests/my-quests/${activeUserQuestId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          photo_url: finalPhotoUrl,
        }),
      });

      if (res.ok) {
        const savedQuestId = activeUserQuestId;
        clearFullRoute();

        if (animationsEnabled) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }

        let defaultAnonymous = false;
        const savedSettings = await SecureStore.getItemAsync('userSettings');
        if (savedSettings) {
          try { defaultAnonymous = !!JSON.parse(savedSettings).anonymousMode; } catch {}
        }

        setCompletedQuestId(savedQuestId);
        setIsAnonymous(defaultAnonymous);
        setTimeout(() => setShareModalVisible(true), animationsEnabled ? 1500 : 0);
      } else {
        const err = await res.json();
        Alert.alert('Не вийшло', err.detail || 'Підійдіть ближче до цілі!');
      }
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося завантажити фото або підтвердити координати');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSharePost = async () => {
    if (!completedQuestId) return;
    setIsSharing(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_geo_quest_id: completedQuestId, is_anonymous: isAnonymous }),
      });

      if (response.ok) {
        setShareModalVisible(false);
        setCompletedQuestId(null);
        Alert.alert('Супер! 🎉', 'Твій успіх вже у стрічці підтримки.');
      } else {
        Alert.alert('Помилка', 'Не вдалося опублікувати пост');
      }
    } catch {
      Alert.alert('Помилка мережі', 'Перевір підключення до інтернету');
    } finally {
      setIsSharing(false);
    }
  };

  const clearFullRoute = () => {
    SecureStore.deleteItemAsync('activeQuest');
    setIsNavigating(false);
    setShowHud(false);
    setPath([]);
    setSteps([]);
    setRouteData(null);
    setActiveUserQuestId(null);
    Animated.spring(panY, { toValue: INITIAL_PAN_Y, useNativeDriver: false }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = gestureState.moveY;
        if (!isNavigatingRef.current && newY < INITIAL_PAN_Y) return;
        if (newY > SCREEN_HEIGHT * 0.1 && newY < SCREEN_HEIGHT * 0.95) panY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isNavigatingRef.current) {
          Animated.spring(panY, { toValue: INITIAL_PAN_Y, useNativeDriver: false }).start();
          return;
        }
        if (gestureState.moveY < SCREEN_HEIGHT * 0.45) {
          Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.15, useNativeDriver: false }).start();
        } else {
          Animated.spring(panY, { toValue: INITIAL_PAN_Y, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const getStepIcon = (instr: string) => {
    const t = instr.toLowerCase();
    if (t.includes('ліворуч')) return <MoveLeft color={c.iconColor} size={24} />;
    if (t.includes('праворуч')) return <MoveRight color={c.iconColor} size={24} />;
    return <MoveUp color={c.iconColor} size={24} />;
  };

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearestQuests.map((item) => {
          const quest = item.geo_quest;
          const lat = quest?.place?.coordinates?.lat;
          const lng = quest?.place?.coordinates?.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;
          const isSelected = selectedQuest?.id === quest.id;
          return (
            <Marker
              key={quest.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => !isNavigating && setSelectedQuest(quest)}
            >
              <View style={s.markerWrapper}>
                <View style={[
                  s.markerCircle,
                  { backgroundColor: isSelected ? c.accent : c.background, borderColor: isSelected ? '#FFF' : c.border },
                  !isSelected && (Platform.OS === 'ios' ? sh.soft : { elevation: 4 }),
                ]}>
                  <MapPin color={isSelected ? '#FFF' : c.textMain} size={22} />
                </View>
              </View>
            </Marker>
          );
        })}
        {path.length > 0 && <Polyline coordinates={path} strokeWidth={5} strokeColor={c.accent} />}
      </MapView>

      <SafeAreaView style={s.topHudContainer}>
        {showHud && isNavigating && steps.length > 0 ? (
          <View style={[s.navHud, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, Platform.OS === 'ios' ? sh.soft : { elevation: 8 }]}>
            <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} style={[s.hudBackBtn, { backgroundColor: c.iconBg }]}>
              <ArrowLeft color={c.iconColor} size={24} />
            </Pressable>
            <View style={s.hudInfo}>
              <Text style={[Typography.titleMd, { color: c.textMain }]} numberOfLines={2}>
                {steps[0].html_instructions.replace(/<[^>]*>?/gm, '')}
              </Text>
              <Text style={[Typography.nav, { color: c.accent, marginTop: 2 }]}>{steps[0].distance.text}</Text>
            </View>
            <Pressable onPress={() => setShowHud(false)} style={s.hudClose}>
              <X color={c.textMuted} size={22} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}
            style={[s.standaloneBack, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, Platform.OS === 'ios' ? sh.soft : { elevation: 5 }]}
          >
            <ArrowLeft color={c.textMain} size={24} />
          </Pressable>
        )}
      </SafeAreaView>

      <Animated.View style={[s.bottomSheet, { top: panY, backgroundColor: c.background, borderColor: c.border, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable
          onPress={centerOnUser}
          style={[s.locateBtn, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, Platform.OS === 'ios' ? sh.soft : { elevation: 5 }]}
        >
          <LocateFixed color={c.accent} size={24} />
        </Pressable>

        <View {...panResponder.panHandlers} style={s.dragArea}>
          <View style={[s.dragLine, { backgroundColor: c.border }]} />
        </View>

        <View style={s.sheetContent}>
          {selectedQuest && (
            <View style={s.headerRow}>
              <Text style={[Typography.titleLg, { color: c.textMain }]}>{selectedQuest.title}</Text>
              <Text style={[Typography.muted, { color: c.textMuted }]}>{selectedQuest.description}</Text>
              {routeData && (
                <View style={s.statsRow}>
                  <Text style={[Typography.nav, { color: c.textMuted }]}>{routeData.duration.text} • {routeData.distance.text}</Text>
                  {!showHud && isNavigating && (
                    <Pressable onPress={() => setShowHud(true)}>
                      <Text style={[Typography.nav, { color: c.accent }]}>Показати інструкцію</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

          {!isNavigating ? (
            <Pressable
              onPress={startNavigationAndQuest}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Navigation color="#FFF" size={20} />
                  <Text style={[Typography.button, { color: '#FFF' }]}>Прокласти шлях</Text>
                </>
              )}
            </Pressable>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={s.activeActionRow}>
                <Pressable
                  onPress={handleCompletePress}
                  style={({ pressed }) => [s.completeBtn, { backgroundColor: '#10B981' }, pressed && { opacity: 0.8 }]}
                >
                  {isCompleting ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <Camera color="#FFF" size={20} />
                      <Text style={[Typography.button, { color: '#FFF' }]}>Я на місці!</Text>
                    </>
                  )}
                </Pressable>
                <Pressable onPress={clearFullRoute} style={[s.cancelIconBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2' }]}>
                  <X color="#EF4444" size={24} />
                </Pressable>
              </View>

              {steps.length > 0 && (
                <>
                  <Text style={[Typography.nav, { color: c.textMuted, marginVertical: 15, letterSpacing: 1 }]}>МАРШРУТ</Text>
                  {steps.map((step, i) => (
                    <View key={i} style={s.stepRow}>
                      <View style={[s.stepIconBox, { backgroundColor: c.iconBg }]}>{getStepIcon(step.html_instructions)}</View>
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={[Typography.body, { color: c.textMain }]}>{step.html_instructions.replace(/<[^>]*>?/gm, '')}</Text>
                        <Text style={[Typography.muted, { color: c.textMuted, marginTop: 2, fontSize: 12 }]}>{step.distance.text}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </Animated.View>

      <Modal visible={finishModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.shareModal, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }]}>
            <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 16 }]}>
              Ти на місці! 🎯
            </Text>
            
            <Pressable 
              onPress={() => setSaveToAlbum(!saveToAlbum)} 
              style={[s.checkboxRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', marginBottom: 24 }]}
            >
              <View style={[s.checkbox, { borderColor: c.textMuted }, saveToAlbum && { backgroundColor: c.accent, borderColor: c.accent }]}>
                {saveToAlbum && <Check color="#FFF" size={14} strokeWidth={3} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.body, { color: c.textMain }]}>Зберегти в альбом</Text>
                <Text style={[Typography.nav, { color: c.textMuted }]}>Зробити фото на пам'ять</Text>
              </View>
              <ImageIcon color={saveToAlbum ? c.accent : c.textMuted} size={24} />
            </Pressable>

            <View style={s.modalButtons}>
              <Pressable
                onPress={() => setFinishModalVisible(false)}
                style={({ pressed }) => [s.cancelBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[Typography.button, { color: c.textMain }]}>Скасувати</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmFinish}
                style={({ pressed }) => [s.confirmBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[Typography.button, { color: '#FFF' }]}>Завершити</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={shareModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.shareModal, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }]}>
            <View style={[s.shareIconBox, { backgroundColor: c.iconBg }]}>
              <Share color={c.iconColor} size={32} />
            </View>
            <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 8 }]}>
              Квест виконано! 🎉
            </Text>
            <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginBottom: 24 }]}>
              Поділися цим досягненням у стрічці, щоб надихнути інших.
            </Text>

            <Pressable
              onPress={() => setIsAnonymous(!isAnonymous)}
              style={[s.checkboxRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}
            >
              <View style={[s.checkbox, { borderColor: c.textMuted }, isAnonymous && { backgroundColor: c.accent, borderColor: c.accent }]}>
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
                onPress={() => { setShareModalVisible(false); setCompletedQuestId(null); }}
                style={({ pressed }) => [s.cancelBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[Typography.button, { color: c.textMain }]}>Ні, дякую</Text>
              </Pressable>
              <Pressable
                onPress={handleSharePost}
                disabled={isSharing}
                style={({ pressed }) => [s.confirmBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }, isSharing && { opacity: 0.7 }]}
              >
                {isSharing ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[Typography.button, { color: '#FFF' }]}>Поділитися</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {showConfetti && (
        <ConfettiCannon
          count={120}
          origin={{ x: -10, y: 0 }}
          autoStart
          fadeOut
          fallSpeed={2500}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topHudContainer: { position: 'absolute', top: Spacing.screenTop, left: Spacing.screenX, right: Spacing.screenX, zIndex: 100 },
  standaloneBack: { width: 48, height: 48, borderRadius: Radii.full, justifyContent: 'center', alignItems: 'center' },
  navHud: { borderRadius: Radii.lg, padding: 12, flexDirection: 'row', alignItems: 'center' },
  hudBackBtn: { padding: 10, borderRadius: Radii.md },
  hudInfo: { flex: 1, marginLeft: 12 },
  hudClose: { padding: 8 },
  markerWrapper: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  markerCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  bottomSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, borderWidth: 1, borderBottomWidth: 0 },
  locateBtn: { position: 'absolute', right: Spacing.screenX, top: -70, padding: 12, borderRadius: Radii.full, zIndex: 10 },
  dragArea: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  dragLine: { width: 40, height: 4, borderRadius: 2 },
  sheetContent: { paddingHorizontal: Spacing.screenX, flex: 1 },
  headerRow: { marginBottom: Spacing.gap },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  primaryBtn: { padding: 18, borderRadius: Radii.full, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  activeActionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  completeBtn: { flex: 1, padding: 16, borderRadius: Radii.full, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  cancelIconBtn: { width: 56, height: 56, borderRadius: Radii.full, justifyContent: 'center', alignItems: 'center' },
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepIconBox: { padding: 10, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shareModal: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: 24 },
  shareIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radii.md, marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
});