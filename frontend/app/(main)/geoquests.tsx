import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Pressable, SafeAreaView, 
  ActivityIndicator, ScrollView, Animated, PanResponder, Dimensions, Platform, Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker'; // ДОДАЛИ ІМПОРТ
import polyline from '@mapbox/polyline';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, Navigation, X, 
  MoveLeft, MoveRight, MoveUp, 
  LocateFixed, MapPin, Camera
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Spacing, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_PAN_Y = SCREEN_HEIGHT * 0.82; 

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export default function GeoQuestsScreen() {
  const router = useRouter();
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
  const [path, setPath] = useState<{latitude: number, longitude: number}[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isNavigatingRef = useRef(isNavigating);
  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Помилка", "Потрібен доступ до геопозиції");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      fetchNearestQuests(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const fetchNearestQuests = async (lat: number, lng: number) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${BASE_URL}/geo-quests/nearest?lat=${lat}&lng=${lng}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let fetchedQuests = [];
      if (res.ok) {
        fetchedQuests = await res.json();
      }

      const mockTestQuest = {
        geo_quest: {
          id: "test-mock-quest-id",
          title: "🧪 Тестовий квест",
          description: "Перевір роботу камери та завантаження фотографії.",
          place: {
            coordinates: { 
              lat: lat + 0.00015,
              lng: lng + 0.00015 
            }
          }
        }
      };

      const combinedQuests = [mockTestQuest, ...fetchedQuests];
      setNearestQuests(combinedQuests);
      
      if (combinedQuests.length > 0) {
        setSelectedQuest(combinedQuests[0].geo_quest);
      }

    } catch (e) {
      console.error("Помилка завантаження:", e);
    }
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

  const startNavigationAndQuest = async () => {
    if (!userLocation || !selectedQuest) return;
    setIsLoading(true);

    try {
      if (selectedQuest.id === "test-mock-quest-id") {
        setActiveUserQuestId("fake-active-id");
      } else {
        const token = await SecureStore.getItemAsync('userToken');
        const startRes = await fetch(`${BASE_URL}/geo-quests/${selectedQuest.id}/start`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!startRes.ok) {
          const err = await startRes.json();
          Alert.alert('Увага', err.detail || 'Не вдалося почати квест');
          setIsLoading(false);
          return;
        }

        const activeQuestData = await startRes.json();
        setActiveUserQuestId(activeQuestData.id);
      }

      const destLat = selectedQuest.place.coordinates?.lat; 
      const destLng = selectedQuest.place.coordinates?.lng;

      if (!destLat || !destLng) {
        Alert.alert("Помилка", "Немає координат цілі.");
        setIsLoading(false);
        return;
      }

      const url = `https://router.project-osrm.org/route/v1/foot/${userLocation.longitude},${userLocation.latitude};${destLng},${destLat}?overview=full&geometries=polyline&steps=true`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.code === 'Ok' && json.routes.length > 0) {
        const route = json.routes[0];
        const leg = route.legs[0];

        const durationMins = Math.round(route.duration / 60);
        const distKm = (route.distance / 1000).toFixed(1);

        setRouteData({ 
          duration: { text: durationMins < 1 ? "Менше хвилини" : `${durationMins} хв` }, 
          distance: { text: `${distKm} км` } 
        });

        const adaptedSteps = leg.steps.map((step: any) => {
          let instr = 'Рухайтесь прямо';
          if (step.maneuver.modifier?.includes('left')) instr = 'Поверніть ліворуч';
          if (step.maneuver.modifier?.includes('right')) instr = 'Поверніть праворуч';
          
          return {
            html_instructions: step.name ? `${instr} на ${step.name}` : instr,
            distance: { text: Math.round(step.distance) + " м" }
          };
        });
        
        setSteps(adaptedSteps.filter((s: any) => parseInt(s.distance.text) > 0));

        const points = polyline.decode(route.geometry);
        setPath(points.map((p: any) => ({ latitude: p[0], longitude: p[1] })));
        
        setIsNavigating(true);
        setShowHud(true);
        Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.6, useNativeDriver: false }).start();
      } else {
        Alert.alert("Помилка маршруту", "Не вдалося прокласти шлях.");
      }
    } catch (e) { 
      Alert.alert('Помилка', 'Мережевий збій при прокладанні маршруту');
    } finally { 
      setIsLoading(false); 
    }
  };

  // --- НОВА ЛОГІКА: КАМЕРА ТА ЗАВАНТАЖЕННЯ ---

  const handleCompletePress = async () => {
    Alert.alert(
      "Доказ виконання",
      "Зробіть фото місця, щоб підтвердити виконання квесту!",
      [
        { text: "Камера", onPress: () => pickImage('camera') },
        { text: "Галерея", onPress: () => pickImage('gallery') },
        { text: "Скасувати", style: "cancel" }
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.granted === false) {
        Alert.alert("Помилка", "Додаток потребує дозволу для роботи з фото.");
        return;
      }

      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Стискаємо фото для швидкого завантаження
      };

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processQuestCompletion(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося відкрити камеру/галерею.");
    }
  };

  const processQuestCompletion = async (imageUri: string) => {
    if (!activeUserQuestId) return;
    setIsCompleting(true);

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const token = await SecureStore.getItemAsync('userToken');

      // 1. ОТРИМУЄМО ПІДПИС ВІД БЕКЕНДА
      const sigRes = await fetch(`${BASE_URL}/geo-quests/generate-upload-signature`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!sigRes.ok) throw new Error("Не вдалося отримати підпис Cloudinary");
      const sigData = await sigRes.json();

      // 2. ВІДПРАВЛЯЄМО ФОТО НА CLOUDINARY
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'proof_photo.jpg'
      } as any);
      formData.append('api_key', sigData.api_key);
      formData.append('timestamp', sigData.timestamp.toString());
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) throw new Error("Cloudinary не повернув URL фотографії");
      
      const uploadedPhotoUrl = cloudData.secure_url;

      // 3. ЯКЩО ЦЕ ТЕСТОВИЙ КВЕСТ
      if (selectedQuest.id === "test-mock-quest-id") {
        const targetLat = selectedQuest.place.coordinates.lat;
        const targetLng = selectedQuest.place.coordinates.lng;
        const dist = getDistanceFromLatLonInM(loc.coords.latitude, loc.coords.longitude, targetLat, targetLng);
        
        if (dist > 15.0) {
          Alert.alert("Ти ще далеко!", `Поточна відстань: ${dist.toFixed(1)} м.`);
        } else {
          Alert.alert("Успіх! 🎉", `Ти на місці! Фото успішно завантажено. (Тестовий квест)`);
          clearFullRoute();
        }
        setIsCompleting(false);
        return;
      }

      // 4. ВІДПРАВЛЯЄМО РЕАЛЬНИЙ ЗАПИТ НА БЕКЕНД
      const res = await fetch(`${BASE_URL}/geo-quests/my-quests/${activeUserQuestId}/complete`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          photo_url: uploadedPhotoUrl // Передаємо реальне посилання!
        })
      });

      if (res.ok) {
        Alert.alert("Квест виконано! 🎉", "Фото збережено, квест успішно зараховано!");
        clearFullRoute();
      } else {
        const err = await res.json();
        Alert.alert("Не вийшло", err.detail || "Підійдіть ближче до цілі!");
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Помилка', 'Не вдалося завантажити фото або підтвердити координати');
    } finally {
      setIsCompleting(false);
    }
  };

  const clearFullRoute = () => {
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
              onPress={() => setSelectedQuest(quest)}
            >
              <View style={[
                s.markerCircle, 
                { backgroundColor: isSelected ? c.accent : c.background, borderColor: isSelected ? '#FFF' : c.border },
                !isSelected && (Platform.OS === 'ios' ? sh.soft : { elevation: 4 })
              ]}>
                <MapPin color={isSelected ? "#FFF" : c.textMain} size={22} />
              </View>
            </Marker>
          );
        })}
        {path.length > 0 && <Polyline coordinates={path} strokeWidth={5} strokeColor={c.accent} />}
      </MapView>

      <SafeAreaView style={s.topHudContainer}>
        {showHud && isNavigating && steps.length > 0 ? (
          <View style={[s.navHud, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, Platform.OS === 'ios' ? sh.soft : { elevation: 8 }]}>
            <Pressable onPress={() => router.back()} style={[s.hudBackBtn, { backgroundColor: c.iconBg }]}>
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
            onPress={() => router.back()} 
            style={[s.standaloneBack, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }, Platform.OS === 'ios' ? sh.soft : { elevation: 5 }]}
          >
            <ArrowLeft color={c.textMain} size={24} />
          </Pressable>
        )}
      </SafeAreaView>

      <Animated.View style={[s.bottomSheet, { top: panY, backgroundColor: c.background, borderColor: c.border }]}>
        
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.activeActionRow}>
                {/* ЗМІНИЛИ ТУТ: Викликаємо handleCompletePress замість completeQuest напрямую */}
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
            </ScrollView>
          )}
        </View>
      </Animated.View>
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
});