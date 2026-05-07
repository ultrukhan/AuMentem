import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Pressable, Image, FlatList, 
  Dimensions, Modal, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Image as ImageIcon, X, Send } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Spacing, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';
import BottomNav from '@/components/BottomNav';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const COLUMN_GAP = 8;
const IMAGE_SIZE = (SCREEN_WIDTH - (Spacing.screenX * 2) - (COLUMN_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

type PhotoItem = {
  id: string;
  uri: string;
};

export default function GalleryScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    loadLocalPhotos();
  }, []);

  const loadLocalPhotos = async () => {
    setIsLoading(true);
    try {
      const savedPhotos = await SecureStore.getItemAsync('local_gallery');
      if (savedPhotos) {
        setPhotos(JSON.parse(savedPhotos));
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const savePhotosLocally = async (newPhotos: PhotoItem[]) => {
    try {
      await SecureStore.setItemAsync('local_gallery', JSON.stringify(newPhotos));
    } catch (error) {
    }
  };

  const pickLocalImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      if (source === 'camera') {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto: PhotoItem = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
        };
        
        const updatedPhotos = [newPhoto, ...photos];
        setPhotos(updatedPhotos);
        await savePhotosLocally(updatedPhotos);
      }
    } catch (error) {
    }
  };


  const shareToAnonymousFeed = async () => {
    if (!selectedPhoto) return;
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
          is_anonymous: true,
          photo_url: selectedPhoto.uri,
        })
      });

      if (response.ok) {
        Alert.alert("Успіх! 🎉", "Твоє фото опубліковано в загальній анонімній стрічці!");
        setSelectedPhoto(null);
      } else {
        const err = await response.json();
        Alert.alert("Помилка", err.detail || "Не вдалося опублікувати");
      }
    } catch (error) {
      Alert.alert("Помилка мережі", "Не вдалося підключитися до сервера");
    } finally {
      setIsSharing(false);
    }
  };

  const renderPhotoItem = ({ item }: { item: PhotoItem }) => (
    <Pressable 
      onPress={() => setSelectedPhoto(item)}
      style={({ pressed }) => [
        s.photoWrapper,
        { opacity: pressed ? 0.8 : 1 }
      ]}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={[s.thumbnail, { borderColor: c.border }]} 
        resizeMode="cover" 
      />
    </Pressable>
  );

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <SafeAreaView style={s.safe} edges={['top']}>
        
        <View style={s.header}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/home');
              }
            }}
            style={({ pressed }) => [
              s.iconBtn, 
              { backgroundColor: c.cardBg, borderColor: c.border }, 
              pressed && { opacity: 0.7 }
            ]}
          >
            <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
          </Pressable>
          <Text style={[Typography.titleLg, { color: c.textMain, marginLeft: Spacing.gap }]}>Галерея</Text>
        </View>

        <View style={s.actionRow}>
          <Pressable 
            onPress={() => pickLocalImage('camera')}
            style={({ pressed }) => [
              s.actionBtn, 
              { backgroundColor: c.iconBg, borderColor: c.border },
              pressed && { opacity: 0.8 }
            ]}
          >
            <Camera color={c.iconColor} size={20} />
            <Text style={[Typography.nav, { color: c.textMain, marginLeft: 8 }]}>Зробити фото</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => pickLocalImage('gallery')}
            style={({ pressed }) => [
              s.actionBtn, 
              { backgroundColor: c.iconBg, borderColor: c.border },
              pressed && { opacity: 0.8 }
            ]}
          >
            <ImageIcon color={c.iconColor} size={20} />
            <Text style={[Typography.nav, { color: c.textMain, marginLeft: 8 }]}>З пристрою</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={s.centerContent}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : photos.length === 0 ? (
          <View style={s.centerContent}>
            <ImageIcon color={c.textMuted} size={48} opacity={0.5} />
            <Text style={[Typography.body, { color: c.textMuted, marginTop: 16 }]}>Галерея поки порожня</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={s.gridContainer}
            columnWrapperStyle={s.columnWrapper}
            renderItem={renderPhotoItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <Pressable 
            style={[s.closeModalBtn, { backgroundColor: c.cardBg }]} 
            onPress={() => setSelectedPhoto(null)}
          >
            <X color={c.textMain} size={24} />
          </Pressable>
          
          {selectedPhoto && (
            <View style={s.modalContentWrapper}>
              <Image 
                source={{ uri: selectedPhoto.uri }} 
                style={s.fullImage} 
                resizeMode="contain" 
              />
              
              {/* Кнопка анонімної публікації */}
              <Pressable 
                onPress={shareToAnonymousFeed}
                disabled={isSharing}
                style={({ pressed }) => [
                  s.shareBtn,
                  { backgroundColor: c.accent },
                  pressed && { opacity: 0.8 },
                  isSharing && { opacity: 0.5 }
                ]}
              >
                {isSharing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Send color="#FFF" size={20} />
                    <Text style={[Typography.button, { color: '#FFF', marginLeft: 8 }]}>
                      Опублікувати анонімно
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      <BottomNav isDark={isDark} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.screenX, 
    paddingTop: 12, 
    paddingBottom: 20 
  },
  iconBtn: { 
    padding: 12, 
    borderRadius: Radii.md, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenX,
    marginBottom: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridContainer: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 140, 
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  photoWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderRadius: Radii.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 60,
    right: Spacing.screenX,
    padding: 12,
    borderRadius: Radii.full,
    zIndex: 10,
  },
  modalContentWrapper: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullImage: {
    width: '100%',
    height: '85%',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radii.full,
    marginTop: 20,
    width: '80%'
  }
});