import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Heart, Sparkles, MapPin, Ghost } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

interface Post {
  id: string;
  is_anonymous: boolean;
  created_at: string;
  user: { nickname: string };
  user_mini_quest?: { mini_quest: { title: string } };
  user_geo_quest?: { geo_quest: { title: string } };
  reactions: any[]; 
}

export default function FeedScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: Post, b: Post) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPosts(sortedData);
      }
    } catch (error) {
      console.error("Помилка завантаження стрічки:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPosts();
  };

  const handleReact = async (postId: string) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reaction_type: "SUPPORT" })
      });

      if (response.ok) {
        fetchPosts(); 
      }
    } catch (error) {
      console.error("Помилка реакції:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const renderPost = ({ item }: { item: Post }) => {
    const questTitle = item.user_mini_quest?.mini_quest?.title 
                    || item.user_geo_quest?.geo_quest?.title 
                    || "Невідоме завдання";
                    
    const isGeo = !!item.user_geo_quest;
    
    const authorName = item.is_anonymous ? "Таємний мандрівник" : item.user.nickname;
    
    const reactionsCount = item.reactions?.length || 0;
    const hasMyReaction = reactionsCount > 0; 

    return (
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }, sh.soft]}>
        
        <View style={s.cardHeader}>
          <View style={s.authorInfo}>
            <View style={[s.avatar, { backgroundColor: item.is_anonymous ? c.border : c.accent + '20' }]}>
              {item.is_anonymous ? (
                <Ghost color={c.textMuted} size={18} />
              ) : (
                <Text style={{ color: c.accent, fontWeight: 'bold' }}>
                  {authorName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={[Typography.titleMd, { color: c.text, fontSize: 15 }]}>
                {authorName}
              </Text>
              <Text style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[s.questBadge, { backgroundColor: isGeo ? '#3B82F615' : c.accent + '15' }]}>
          {isGeo ? <MapPin color="#3B82F6" size={16} /> : <Sparkles color={c.accent} size={16} />}
          <Text style={[Typography.body, { color: c.text, marginLeft: 8, flex: 1 }]}>
            Виконано: <Text style={{ fontWeight: '600' }}>{questTitle}</Text>
          </Text>
        </View>

        <View style={[s.cardFooter, { borderTopColor: c.border }]}>
          <Pressable 
            onPress={() => handleReact(item.id)}
            style={({ pressed }) => [
              s.reactBtn, 
              pressed && s.pressed,
              hasMyReaction && { backgroundColor: '#FF3B3015' }
            ]}
          >
            <Heart 
              color={hasMyReaction ? "#FF3B30" : c.textMuted} 
              size={20} 
              fill={hasMyReaction ? "#FF3B30" : "transparent"} 
            />
            <Text style={[
              Typography.body, 
              { color: hasMyReaction ? "#FF3B30" : c.textMuted, marginLeft: 6, fontWeight: hasMyReaction ? '600' : '400' }
            ]}>
              {reactionsCount > 0 ? reactionsCount : 'Підтримати'}
            </Text>
          </Pressable>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      
      <View style={s.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
        >
          <ArrowLeft color={c.text} size={24} />
        </Pressable>
        <Text style={[Typography.titleLg, { color: c.text, flex: 1, textAlign: 'center', marginRight: 40 }]}>
          Анонімна стрічка
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
          ListEmptyComponent={
            <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 40 }]}>
              Стрічка поки порожня. Будь першим, хто виконає квест! 🌟
            </Text>
          }
        />
      )}
      
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: Radii.md,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
  },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});