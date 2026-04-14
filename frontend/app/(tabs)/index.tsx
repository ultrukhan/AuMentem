import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import * as ImagePicker from 'expo-image-picker'; 

type Quest = {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  coordinate: { latitude: number; longitude: number; };
};

const cozyMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'water', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'park', stylers: [{ color: '#dcf0d9' }] },
  { featureType: 'road', stylers: [{ color: '#ffffff' }] },
];

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GeoQuestsScreen() {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const [quests, setQuests] = useState<Quest[]>([
    { 
      id: '1', 
      title: '🌳 Дотик природи', 
      description: 'Знайди лавочку в парку і посидь 5 хвилин без телефону. Зроби фото місця!', 
      isCompleted: false,
      coordinate: { latitude: 49.8405, longitude: 24.0225 } // Парк Франка
    },
    { 
      id: '2', 
      title: '☕ Мій дім', 
      description: 'Тестовий квест прямо в тебе вдома. Зроби фото!', 
      isCompleted: false,
      // ТУТ БУДУТЬ ТВОЇ КООРДИНАТИ (дивись крок 3)
      coordinate: { latitude: 49.79530402744085, longitude: 24.046719590804464} 
    },
  ]);

  useEffect(() => {
    (async () => {
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Помилка', 'Нам потрібен доступ до геолокації!');
        return;
      }

      let { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Помилка', 'Нам потрібен доступ до камери!');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      Location.watchPositionAsync({ distanceInterval: 5 }, (newLocation) => {
        setUserLocation(newLocation);
      });
    })();
  }, []);

  const handleCompleteQuest = async () => {
    if (!userLocation || !selectedQuest) return;

    const distance = getDistanceInMeters(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      selectedQuest.coordinate.latitude,
      selectedQuest.coordinate.longitude
    );

    if (distance <= 50) {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        });

        if (!result.canceled) {
          setQuests(quests.map(q => q.id === selectedQuest.id ? { ...q, isCompleted: true } : q));
          setSelectedQuest(null); 
          Alert.alert('Ура! 🎉', 'Квест виконано! Твій момент зафіксовано.');
        }
      } catch (error) {
        Alert.alert('Помилка', 'Не вдалося відкрити камеру.');
      }
    } else {
      Alert.alert('Занадто далеко 🚶', `Ти знаходишся за ${Math.round(distance)} метрів від цілі.`);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 49.8413,
          longitude: 24.0228,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={cozyMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {quests.map((quest) => (
          <Marker key={quest.id} coordinate={quest.coordinate} onPress={() => setSelectedQuest(quest)}>
            <View style={[styles.customMarker, quest.isCompleted && styles.completedMarker]}>
              <Text style={styles.markerText}>{quest.isCompleted ? '✅' : '✨'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedQuest && !selectedQuest.isCompleted && (
        <View style={styles.questCard}>
          <Text style={styles.questTitle}>{selectedQuest.title}</Text>
          <Text style={styles.questDesc}>{selectedQuest.description}</Text>
          <TouchableOpacity style={styles.acceptButton} onPress={handleCompleteQuest}>
            <Text style={styles.buttonText}>Я на місці (Зробити фото)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedQuest(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Закрити</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  customMarker: { backgroundColor: '#FFE9A6', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  completedMarker: { backgroundColor: '#D1E6D3', opacity: 0.7 },
  markerText: { fontSize: 16 },
  questCard: { position: 'absolute', bottom: 50, left: 20, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  questTitle: { fontSize: 18, fontWeight: '600', color: '#4A3B32', marginBottom: 8 },
  questDesc: { fontSize: 14, color: '#7A6B62', lineHeight: 20, marginBottom: 16 },
  acceptButton: { backgroundColor: '#FFE9A6', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#4A3B32', fontWeight: '600', fontSize: 16 },
  closeButton: { marginTop: 12, alignItems: 'center' },
  closeButtonText: { color: '#A0968E', fontSize: 14 }
});