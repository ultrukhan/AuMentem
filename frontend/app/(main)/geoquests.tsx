import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView,
  ActivityIndicator, ScrollView, Animated, PanResponder,
  Dimensions, Platform, Alert, Modal, Linking
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Circle, Path, G } from 'react-native-svg';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import polyline from '@mapbox/polyline';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, Navigation, X,
  MoveLeft, MoveRight, MoveUp,
  LocateFixed, MapPin, Camera, Share, Ghost, Check, Image as ImageIcon,
  Compass
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import { useAppSettings } from '@/hooks/useAppSettings';
import { cardShadow } from '@/utils/shadowStyle';
import { parseApiError } from '@/utils/apiErrors';
import { playClickSound } from '@/utils/audio';
import { Toast } from '@/utils/toast';
import { fetchWithCache } from '@/utils/apiWithCache';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_REGION = {
  latitude: 48.3794,
  longitude: 31.1656,
  latitudeDelta: 12.0,
  longitudeDelta: 12.0,
};

const MAP_STYLE_DARK = [
  { "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#93C5FD" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#EFF6FF" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#1e3a8a" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1d4ed8" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] }
];

const MAP_STYLE_LIGHT = [
  { "elementType": "geometry", "stylers": [{ "color": "#FFFDF7" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#FFFDF7" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#7C2D12" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#EA580C" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#FEF08A" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#FED7AA" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#FDBA74" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#7C2D12" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#FFEDD5" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#FED7AA" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#BAE6FD" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#0369A1" }] }
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function GeoQuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const themeKey = isDark ? 'dark' : 'light';
  const c = Colors[themeKey];
  const { animationsEnabled } = useAppSettings();

  const mapRef = useRef<MapView>(null);
  const sheetVisibleHeight = 220 + Math.max(insets.bottom, 20);
  const initialPanYRef = useRef(SCREEN_HEIGHT - sheetVisibleHeight);
  initialPanYRef.current = SCREEN_HEIGHT - sheetVisibleHeight;
  const panY = useRef(new Animated.Value(initialPanYRef.current)).current;

  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [pendingRouteRestore, setPendingRouteRestore] = useState(false);
  const [nearestQuests, setNearestQuests] = useState<any[]>([]);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
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
  const isNavigatingRef = useRef(isNavigating);
  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  const [completedTodayIds, setCompletedTodayIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          if (!token) return;
          const res = await fetch(`${BASE_URL}/geo-quests/my-history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const history = await res.json();
            const todayLocal = new Date().toDateString();
            const completedToday = history
              .filter((item: any) => item.completed_at && new Date(item.completed_at).toDateString() === todayLocal)
              .map((item: any) => item.geo_quest?.id || item.geo_quest_id);
            setCompletedTodayIds(completedToday);
          }
        } catch (e) {
          console.log('Failed to fetch history', e);
        }
      };
      fetchHistory();
    }, [])
  );

  useEffect(() => {
    if (nearestQuests.length > 0) {
      setTracksViewChanges(true);
      const timer = setTimeout(() => {
        setTracksViewChanges(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [nearestQuests, selectedQuest?.id]);

  const animateToCoords = useCallback((coords: { latitude: number; longitude: number }) => {
    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 600);
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationDenied(true);
          return;
        }

        const initialLoc = await Location.getCurrentPositionAsync({});
        setUserLocation(initialLoc.coords);
        await fetchNearestQuests(initialLoc.coords.latitude, initialLoc.coords.longitude);

        mapRef.current?.animateToRegion({
          latitude: initialLoc.coords.latitude,
          longitude: initialLoc.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }, 1000);

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
          (newLoc) => {
            setUserLocation(newLoc.coords);
          }
        );

        const saved = await SecureStore.getItemAsync('activeQuest');
        if (saved) {
          const { userQuestId, quest } = JSON.parse(saved);
          setActiveUserQuestId(userQuestId);
          setSelectedQuest(quest);
          setIsNavigating(true);
          setPendingRouteRestore(true);
          Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.55, useNativeDriver: false }).start();
        }
      } catch {
        setLocationDenied(true);
      } finally {
        setLocationReady(true);
      }
    })();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const fetchNearestQuests = async (lat: number, lng: number) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetchWithCache(`${BASE_URL}/geo-quests/nearest?lat=${lat}&lng=${lng}`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheKey: `nearest_quests_${token}`,
      });
      let fetchedQuests = [];
      if (res.ok && res.data) fetchedQuests = res.data;
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

  const resetCompass = () => {
    playClickSound();
    mapRef.current?.animateCamera({
      heading: 0,
      pitch: 0,
    });
  };

  const buildRoute = async (quest: any, coordsOverride?: Location.LocationObjectCoords) => {
    const origin = coordsOverride ?? userLocation;
    if (!origin) {
      Toast.show({ title: 'Геолокація', message: 'Увімкніть доступ до геопозиції, щоб прокласти маршрут.' });
      return;
    }
    const destLat = quest.place.coordinates?.lat;
    const destLng = quest.place.coordinates?.lng;
    if (!destLat || !destLng) {
      Toast.show({ title: 'Помилка', message: 'Немає координат цілі.' });
      return;
    }

    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${origin.longitude},${origin.latitude};${destLng},${destLat}?overview=full&geometries=polyline&steps=true`;
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
      Toast.show({ title: 'Помилка маршруту', message: 'Не вдалося прокласти пішохідний шлях.' });
    }
  };

  useEffect(() => {
    if (pendingRouteRestore && userLocation && selectedQuest && isNavigating) {
      buildRoute(selectedQuest);
      setPendingRouteRestore(false);
    }
  }, [pendingRouteRestore, userLocation, selectedQuest, isNavigating]);

  const startNavigationAndQuest = async () => {
    if (!selectedQuest) return;
    if (!userLocation) {
      Alert.alert(
        'Геолокація', 
        'Для прокладання маршруту потрібен доступ до вашої позиції.',
        locationDenied
          ? [
              { text: 'Скасувати', style: 'cancel' },
              { text: 'Налаштування', onPress: () => Linking.openSettings() },
            ]
          : [{ text: 'OK' }]
       );
      return;
    }
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
        Toast.show({ title: 'Увага', message: await parseApiError(startRes, 'Не вдалося почати квест') });
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
      Toast.show({ title: 'Помилка', message: 'Мережевий збій при прокладанні маршруту' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletePress = () => {
    setFinishModalVisible(true);
  };

  const handleConfirmFinish = () => {
    processQuestCompletion();
  };

  const processQuestCompletion = async () => {
    if (!activeUserQuestId) return;
    setIsCompleting(true);

    try {
      let currentLat = userLocation?.latitude;
      let currentLng = userLocation?.longitude;
      if (!currentLat || !currentLng) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        currentLat = loc.coords.latitude;
        currentLng = loc.coords.longitude;
      }

      const token = await SecureStore.getItemAsync('userToken');
      let finalPhotoUrl = null;

      if (saveToAlbum) {
        const sigRes = await fetch(`${BASE_URL}/geo-quests/generate-upload-signature`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_geo_quest_id: activeUserQuestId,
            lat: currentLat,
            lng: currentLng,
          }),
        });

        if (!sigRes.ok) {
          const errorMsg = await parseApiError(sigRes, "Підійдіть ближче до цілі.");
          Toast.show({ title: 'Задалеко', message: errorMsg });
          setIsCompleting(false);
          return;
        }

        const sigData = await sigRes.json();

        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Toast.show({ title: 'Помилка', message: 'Додаток потребує дозволу для роботи з камерою.' });
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
          lat: currentLat,
          lng: currentLng,
          photo_url: finalPhotoUrl,
        }),
      });

      if (res.ok) {
        const savedQuestId = activeUserQuestId;
        const lat = selectedQuest?.place?.coordinates?.lat;
        const lng = selectedQuest?.place?.coordinates?.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          animateToCoords({ latitude: lat, longitude: lng });
        }
        clearFullRoute();

        if (selectedQuest) {
          setCompletedTodayIds((prev) => [...prev, selectedQuest.id]);
        }

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
        Toast.show({ title: 'Не вийшло', message: await parseApiError(res, 'Підійдіть ближче до цілі!') });
      }
    } catch (e) {
      Toast.show({ title: 'Помилка', message: 'Не вдалося завантажити фото або підтвердити координати' });
    } finally {
      setFinishModalVisible(false);
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
        Toast.show({ title: 'Супер! 🎉', message: 'Твій успіх вже у стрічці підтримки.' });
      } else {
        Toast.show({ title: 'Помилка', message: await parseApiError(response, 'Не вдалося опублікувати пост') });
      }
    } catch {
      Toast.show({ title: 'Помилка мережі', message: 'Перевір підключення до інтернету' });
    } finally {
      setIsSharing(false);
    }
  };

  const cancelActiveQuest = async () => {
    if (activeUserQuestId) {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        await fetch(`${BASE_URL}/geo-quests/my-quests/${activeUserQuestId}/cancel`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Failed to cancel quest on backend', e);
      }
    }
    clearFullRoute();
  };

  const clearFullRoute = () => {
    SecureStore.deleteItemAsync('activeQuest');
    setIsNavigating(false);
    setShowHud(false);
    setPath([]);
    setSteps([]);
    setRouteData(null);
    setActiveUserQuestId(null);
    Animated.spring(panY, { toValue: initialPanYRef.current, useNativeDriver: false }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = gestureState.moveY;
        if (!isNavigatingRef.current && newY < initialPanYRef.current) return;
        if (newY > SCREEN_HEIGHT * 0.1 && newY < SCREEN_HEIGHT * 0.95) panY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isNavigatingRef.current) {
          Animated.spring(panY, { toValue: initialPanYRef.current, useNativeDriver: false }).start();
          return;
        }
        if (gestureState.moveY < SCREEN_HEIGHT * 0.45) {
          Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.15, useNativeDriver: false }).start();
        } else {
          Animated.spring(panY, { toValue: initialPanYRef.current, useNativeDriver: false }).start();
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
        initialRegion={DEFAULT_REGION}
        showsUserLocation={!locationDenied}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
      >
        {nearestQuests.map((item) => {
          const quest = item.geo_quest;
          const isCompleted = completedTodayIds.includes(quest.id);
          const lat = quest?.place?.coordinates?.lat;
          const lng = quest?.place?.coordinates?.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;
          const isSelected = selectedQuest?.id === quest.id;
          return (
            <Marker
              key={`${quest.id}-${isSelected}`}
              coordinate={{ latitude: lat, longitude: lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: 0 }}
              tracksViewChanges={tracksViewChanges}
              onPress={() => {
                if (isCompleted) {
                  Toast.show({ title: 'Виконано', message: 'Ти вже виконав цей квест сьогодні! Спробуй інший.' });
                } else if (!isNavigating) {
                  setSelectedQuest(quest);
                }
              }}
            >
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isSelected ? c.accent : (isCompleted ? c.border : c.background),
                borderColor: isSelected ? '#FFF' : c.border,
                borderWidth: isSelected ? 3 : 1.5,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
                elevation: 4,
                opacity: 1
              }}>
                <MapPin color={isSelected ? '#FFF' : (isCompleted ? c.textMuted : c.textMain)} size={18} />
              </View>
            </Marker>
          );
        })}
        {path.length > 0 && <Polyline coordinates={path} strokeWidth={5} strokeColor={c.accent} />}
      </MapView>

      <SafeAreaView style={s.topHudContainer}>
        {showHud && isNavigating && steps.length > 0 ? (
          <View style={[s.navHud, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, cardShadow(themeKey, 'soft')]}>
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
            style={[s.standaloneBack, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, cardShadow(themeKey, 'soft')]}
          >
            <ArrowLeft color={c.textMain} size={24} />
          </Pressable>
        )}
      </SafeAreaView>

      <Animated.View style={[s.bottomSheet, { top: panY, bottom: -50, backgroundColor: c.background, borderColor: c.border, paddingBottom: Math.max(insets.bottom, 24) + 50 }]}>
        <Pressable
          onPress={centerOnUser}
          style={[s.locateBtn, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, cardShadow(themeKey, 'soft')]}
        >
          <LocateFixed color={c.accent} size={24} />
        </Pressable>

        <Pressable
          onPress={resetCompass}
          style={[s.compassBtn, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, cardShadow(themeKey, 'soft')]}
        >
          <Compass color={c.accent} size={24} />
        </Pressable>

        <View {...panResponder.panHandlers} style={s.dragArea}>
          <View style={[s.dragLine, { backgroundColor: c.border }]} />
        </View>

        <View style={s.sheetContent}>
          {locationDenied && locationReady && (
            <View style={[s.permissionBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA' }]}>
              <Text style={[Typography.body, { color: c.textMain, marginBottom: 8 }]}>
                Увімкніть геолокацію, щоб бачити маршрут і відстань до квесту.
              </Text>
              <Pressable
                onPress={() => Linking.openSettings()}
                style={[s.permissionBtn, { backgroundColor: c.accent }]}
              >
                <Text style={[Typography.button, { color: '#FFF' }]}>Відкрити налаштування</Text>
              </Pressable>
            </View>
          )}

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
              disabled={!userLocation && locationReady}
              style={({ pressed }) => [
                s.primaryBtn,
                { backgroundColor: c.accent },
                pressed && { opacity: 0.8 },
                !userLocation && locationReady && { opacity: 0.5 },
              ]}
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
                <Pressable onPress={cancelActiveQuest} style={[s.cancelIconBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2' }]}>
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
          count={60}
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
  markerWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  markerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  bottomSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, borderWidth: 1, borderBottomWidth: 0 },
  locateBtn: { position: 'absolute', right: Spacing.screenX, top: -70, padding: 12, borderRadius: Radii.full, zIndex: 10 },
  compassBtn: { position: 'absolute', right: Spacing.screenX + 56, top: -70, padding: 12, borderRadius: Radii.full, zIndex: 10 },
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
  stepIconBox: { padding: 10, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shareModal: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: 24 },
  shareIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radii.md, marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  permissionBanner: { padding: 14, borderRadius: Radii.md, borderWidth: 1, marginBottom: 16 },
  permissionBtn: { paddingVertical: 10, borderRadius: Radii.full, alignItems: 'center' },
});