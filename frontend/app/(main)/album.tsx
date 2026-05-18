import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Pressable, 
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Ghost, MapPin } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';

import { Colors, Typography, Radii, Spacing, Shadows } from '@/constants/theme';
import { playClickSound } from '@/utils/audio';
import { BASE_URL } from '@/constants/api';
import BottomNav from '@/components/BottomNav';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const IMAGE_SIZE = (width - Spacing.screenX * 2 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

export default function GalleryScreen() {
  const router = useRouter();
  const { theme } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  const fetchAlbum = async (currentOffset: number, isInitial: boolean = false) => {
    try {
      if (isInitial) setIsLoading(true);
      else setIsFetchingMore(true);

      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/geo-quests/album?limit=${LIMIT}&offset=${currentOffset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isInitial) {
          setPhotos(data.items);
        } else {
          setPhotos(prev => [...prev, ...data.items]);
        }
        
        setHasMore(currentOffset + LIMIT < data.total_count);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setHasMore(true);
      fetchAlbum(0, true);
    }, [])
  );

  const handleLoadMore = () => {
    if (!isLoading && !isFetchingMore && hasMore) {
      const nextOffset = offset + LIMIT;
      setOffset(nextOffset);
      fetchAlbum(nextOffset);
    }
  };

  const handleGoBack = () => {
    playClickSound();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const renderPhoto = ({ item, index }: any) => {
    const date = new Date(item.completed_at).toLocaleDateString('uk-UA', { 
      day: 'numeric', month: 'short' 
    });

    return (
      <Animated.View entering={FadeInDown.delay((index % LIMIT) * 50)} style={[s.imageWrapper, { borderColor: c.border }]}>
        <Image 
          source={{ uri: item.photo_url }} 
          style={s.image} 
          resizeMode="cover"
        />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.85)']} 
          style={s.gradientOverlay}
        >
          <Text style={[Typography.titleMd, { color: '#FFF', fontSize: 14 }]} numberOfLines={1}>
            {item.quest_title}
          </Text>
          <View style={s.metaRow}>
            <MapPin color="#D1D5DB" size={10} />
            <Text style={s.metaText} numberOfLines={1}>
              {item.location_name} • {date}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <ImageBackground 
      source={isDark ? require('@/assets/images/background_dark.png') : require('@/assets/images/background.png')} 
      style={s.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <View style={s.header}>
            <Pressable 
              onPress={handleGoBack}
              style={({ pressed }) => [
                s.iconBtn, 
                { backgroundColor: c.cardBg, borderColor: c.border },
                Platform.OS === 'ios' ? sh.soft : { elevation: 0 },
                pressed && { opacity: 0.7 }
              ]}
            >
              <ArrowLeft color={c.textMain} size={24} strokeWidth={2} />
            </Pressable>
            <View style={s.headerTitleBox}>
              <Text style={[Typography.titleLg, { color: c.textMain }]}>Фотоальбом</Text>
              <Text style={[Typography.nav, { color: c.textMuted }]}>Твої досягнення</Text>
            </View>
            <View style={{ width: 48 }} />
          </View>

          {isLoading ? (
            <View style={s.centerContainer}>
              <ActivityIndicator color={c.accent} size="large" />
            </View>
          ) : photos.length === 0 ? (
            <View style={s.centerContainer}>
              <Ghost size={64} color={c.textMuted} strokeWidth={1.5} />
              <Text style={[Typography.titleMd, { color: c.textMain, marginTop: 16, textAlign: 'center' }]}>Альбом порожній</Text>
              <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }]}>
                Тут з'являться фотографії, які ти збережеш після виконання гео-квестів.
              </Text>
            </View>
          ) : (
            <FlatList
              data={photos}
              keyExtractor={(item) => item.id}
              numColumns={COLUMN_COUNT}
              renderItem={renderPhoto}
              contentContainerStyle={[s.gridList, { paddingBottom: Math.max(insets.bottom + 20, 100) }]}
              columnWrapperStyle={{ gap: GAP }}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingMore ? (
                  <ActivityIndicator color={c.accent} style={{ marginVertical: 20 }} />
                ) : null
              }
            />
          )}
        </Animated.View>
        <BottomNav isDark={isDark} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    paddingHorizontal: Spacing.screenX, 
    paddingTop: 12, 
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleBox: { alignItems: 'center' },
  iconBtn: { 
    width: 48,
    height: 48,
    borderRadius: Radii.md, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100
  },
  gridList: { paddingHorizontal: Spacing.screenX, gap: GAP },
  imageWrapper: { 
    width: IMAGE_SIZE, 
    height: IMAGE_SIZE * 1.4, 
    position: 'relative', 
    borderRadius: Radii.md, 
    overflow: 'hidden', 
    borderWidth: 1 
  },
  image: { width: '100%', height: '100%' },
  gradientOverlay: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    padding: 10, 
    paddingTop: 24 
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 4 
  },
  metaText: { 
    color: '#D1D5DB', 
    fontSize: 10, 
    fontFamily: 'Nunito_600SemiBold',
    flexShrink: 1
  }
});