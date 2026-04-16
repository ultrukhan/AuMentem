import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Pressable, SafeAreaView, 
  ActivityIndicator, ScrollView, Animated, PanResponder, Dimensions 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Navigation, Clock, X, 
  MoveLeft, MoveRight, MoveUp, 
  LocateFixed, TreePine, Coffee 
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;

const questLocations = [
  { id: 1, title: 'Стрийський парк', coords: { latitude: 49.8234, longitude: 24.0256 }, icon: TreePine },
  { id: 2, title: 'Площа Ринок', coords: { latitude: 49.8413, longitude: 24.0312 }, icon: Coffee }
];

export default function GeoQuestsScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.75)).current; 
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [selectedQuest, setSelectedQuest] = useState(questLocations[0]);
  const [routeData, setRouteData] = useState<any>(null);
  const [path, setPath] = useState<{latitude: number, longitude: number}[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showHud, setShowHud] = useState(false); // Новий стан для верхньої панелі
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
    })();
  }, []);

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

  const startNavigation = async () => {
    if (!userLocation) return;
    setIsLoading(true);
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedQuest.coords.latitude},${selectedQuest.coords.longitude}&mode=walking&key=${GOOGLE_API_KEY}&language=uk`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === 'OK') {
        const route = json.routes[0].legs[0];
        setRouteData(route);
        setSteps(route.steps);
        const points = polyline.decode(json.routes[0].overview_polyline.points);
        setPath(points.map((p: any) => ({ latitude: p[0], longitude: p[1] })));
        setIsNavigating(true);
        setShowHud(true); // Показуємо інструкцію при старті
        Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.6, useNativeDriver: false }).start();
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  // Тільки ховаємо верхню панель, лінія залишається
  const hideHudOnly = () => {
    setShowHud(false);
  };

  // Повне скасування маршруту (кнопка в нижній панелі)
  const clearFullRoute = () => {
    setIsNavigating(false);
    setShowHud(false);
    setPath([]);
    setSteps([]);
    setRouteData(null);
    Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.75, useNativeDriver: false }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = gestureState.moveY;
        if (newY > SCREEN_HEIGHT * 0.1 && newY < SCREEN_HEIGHT * 0.9) panY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.moveY < SCREEN_HEIGHT * 0.45) {
          Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.15, useNativeDriver: false }).start();
        } else {
          Animated.spring(panY, { toValue: SCREEN_HEIGHT * 0.75, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const getStepIcon = (instr: string) => {
    const t = instr.toLowerCase();
    if (t.includes('ліворуч')) return <MoveLeft color="#FFF" size={24} />;
    if (t.includes('праворуч')) return <MoveRight color="#FFF" size={24} />;
    return <MoveUp color="#FFF" size={24} />;
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFill} showsUserLocation>
        {questLocations.map((loc) => (
          <Marker key={loc.id} coordinate={loc.coords} onPress={() => setSelectedQuest(loc)}>
            <View style={[styles.markerCircle, { backgroundColor: selectedQuest.id === loc.id ? '#F97316' : '#94A3B8' }]}>
              <loc.icon color="#FFF" size={22} />
            </View>
          </Marker>
        ))}
        {path.length > 0 && <Polyline coordinates={path} strokeWidth={6} strokeColor="#F97316" />}
      </MapView>

      {/* ВЕРХНЯ ПАНЕЛЬ: Тільки кнопка назад або Повний HUD */}
      <SafeAreaView style={styles.topHudContainer}>
        {showHud && isNavigating && steps.length > 0 ? (
          <View style={styles.navHud}>
            <Pressable onPress={() => router.back()} style={styles.hudBackBtn}>
              <ArrowLeft color="#FFF" size={24} />
            </Pressable>
            <View style={styles.hudInfo}>
              <Text style={styles.hudText} numberOfLines={2}>
                {steps[0].html_instructions.replace(/<[^>]*>?/gm, '')}
              </Text>
              <Text style={styles.hudDist}>{steps[0].distance.text}</Text>
            </View>
            <Pressable onPress={hideHudOnly} style={styles.hudClose}>
              <X color="#FFF" size={22} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.back()} style={styles.standaloneBack}>
            <ArrowLeft color="#000" size={24} />
          </Pressable>
        )}
      </SafeAreaView>

      {/* КНОПКА ПРИЦІЛУ */}
      <Pressable onPress={centerOnUser} style={styles.locateBtn}>
        <LocateFixed color="#F97316" size={26} />
      </Pressable>

      {/* НИЖНЯ ПАНЕЛЬ */}
      <Animated.View style={[styles.bottomSheet, { top: panY }]}>
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.dragLine} />
        </View>

        <View style={styles.sheetContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{selectedQuest.title}</Text>
            {routeData && (
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>{routeData.duration.text} • {routeData.distance.text}</Text>
                {!showHud && isNavigating && (
                   <Pressable onPress={() => setShowHud(true)}>
                     <Text style={styles.restoreHudText}>Показати інструкцію</Text>
                   </Pressable>
                )}
              </View>
            )}
          </View>

          {!isNavigating ? (
            <Pressable onPress={startNavigation} style={styles.primaryBtn}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Navigation color="#FFF" size={20} />
                  <Text style={styles.btnText}>Прокласти шлях</Text>
                </>
              )}
            </Pressable>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.listLabel}>ПОКРОКОВИЙ МАРШРУТ</Text>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepIconBox}>{getStepIcon(step.html_instructions)}</View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.stepMain}>{step.html_instructions.replace(/<[^>]*>?/gm, '')}</Text>
                    <Text style={styles.stepSub}>{step.distance.text}</Text>
                  </View>
                </View>
              ))}
              <Pressable onPress={clearFullRoute} style={styles.fullCancelBtn}>
                <Text style={styles.fullCancelText}>Скасувати маршрут</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHudContainer: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 100 },
  standaloneBack: { width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  navHud: { 
    backgroundColor: '#059669', borderRadius: 24, padding: 12, 
    flexDirection: 'row', alignItems: 'center', elevation: 10
  },
  hudBackBtn: { padding: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  hudInfo: { flex: 1, marginLeft: 12 },
  hudText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  hudDist: { color: '#D1FAE5', fontSize: 13, marginTop: 2 },
  hudClose: { padding: 8 },
  
  locateBtn: { 
    position: 'absolute', right: 20, bottom: SCREEN_HEIGHT * 0.3, 
    backgroundColor: '#FFF', padding: 14, borderRadius: 28, 
    elevation: 8, zIndex: 10
  },
  markerCircle: { 
    width: 48, height: 48, borderRadius: 24, 
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 3, borderColor: '#FFF', elevation: 6 
  },
  bottomSheet: { 
    position: 'absolute', left: 0, right: 0, bottom: 0, 
    backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, 
    elevation: 25, zIndex: 50
  },
  dragArea: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  dragLine: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  sheetContent: { paddingHorizontal: 24, flex: 1 },
  headerRow: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  statsText: { fontSize: 14, color: '#6B7280' },
  restoreHudText: { fontSize: 13, color: '#F97316', fontWeight: 'bold' },
  primaryBtn: { 
    backgroundColor: '#F97316', padding: 18, borderRadius: 22, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listLabel: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginVertical: 15 },
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepIconBox: { backgroundColor: '#94A3B8', padding: 8, borderRadius: 12 },
  stepMain: { fontSize: 14, color: '#374151', lineHeight: 20 },
  stepSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  fullCancelBtn: { marginTop: 10, marginBottom: 30, padding: 15, alignItems: 'center' },
  fullCancelText: { color: '#EF4444', fontWeight: 'bold' }
});