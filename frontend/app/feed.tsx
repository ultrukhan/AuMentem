import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Sparkles, MapPin, Ghost } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, Typography, Radii, Shadows, Spacing, IconSizes } from '@/constants/theme';
import { BASE_URL } from '@/constants/api';

interface Reaction {
  reaction_type: 'SUPPORT' | 'HUG' | 'PROUD' | 'HEART';
  user_id: string;
}

interface Post {
  id: string;
  is_anonymous: boolean;
  created_at: string;
  user: { nickname: string } | null; 
  user_mini_quest?: { 
    mini_quest: { title: string } 
  } | null;
  user_geo_quest?: { 
    geo_quest: { title: string },
    photo_proof_url?: string 
  } | null;
  reactions: Reaction[]; 
}

const REACTION_OPTIONS = [
  { type: 'HEART', emoji: '🧡' },
  { type: 'HUG', emoji: '🫂' },
  { type: 'SUPPORT', emoji: '🙌' },
  { type: 'PROUD', emoji: '🔥' },
] as const;

export default function FeedScreen() {
  const router = useRouter();
  const { theme: themeParam } = useLocalSearchParams();
  const isDark = themeParam === 'dark';
  
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});

  const fetchPosts = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Сортування за датою (свіжі зверху)
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

  const handleReact = async (postId: string, reactionType: string) => {
    const currentMyReaction = myReactions[postId];
    const isRemoving = currentMyReaction === reactionType;
    const newReaction = isRemoving ? null : reactionType;

    setMyReactions(prev => ({ ...prev, [postId]: newReaction }));

    // Оптимістичне оновлення лічильників
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          let updatedReactions = [...(post.reactions || [])];
          if (currentMyReaction) {
            const indexToRemove = updatedReactions.findIndex(r => r.reaction_type === currentMyReaction);
            if (indexToRemove > -1) updatedReactions.splice(indexToRemove, 1);
          }
          if (!isRemoving) {
            updatedReactions.push({ reaction_type: reactionType as any, user_id: 'me' });
          }
          return { ...post, reactions: updatedReactions };
        }
        return post;
      })
    );

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reaction_type: reactionType })
      });
      if (!response.ok) fetchPosts(); 
    } catch (error) {
      fetchPosts();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const renderPost = ({ item }: { item: Post }) => {
    // Якщо анонімно — бекенд затирає юзера
    const authorName = (item.is_anonymous || !item.user) ? "Таємний мандрівник" : item.user.nickname;
    
    // Пошук тайтлу квесту у вкладених об'єктах
    const questTitle = item.user_mini_quest?.mini_quest?.title 
                     || item.user_geo_quest?.geo_quest?.title 
                     || "Завдання виконано";
    
    const isGeo = !!item.user_geo_quest;
    const photoUrl = item.user_geo_quest?.photo_proof_url;

    return (
      <View style={[s.card, { backgroundColor: c.cardBg, borderColor: c.border }, sh.soft]}>
        <View style={s.cardHeader}>
          <View style={s.authorInfo}>
            <View style={[s.avatar, { backgroundColor: (item.is_anonymous || !item.user) ? c.border : c.accent + '20' }]}>
              {(item.is_anonymous || !item.user) ? (
                <Ghost color={c.textMuted} size={20} />
              ) : (
                <Text style={{ color: c.accent, fontWeight: 'bold', fontSize: 16 }}>
                  {authorName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={[Typography.titleMd, { color: c.textMain, fontSize: 15 }]}>{authorName}</Text>
              <Text style={[Typography.muted, { color: c.textMuted, fontSize: 12 }]}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={[s.questBadge, { backgroundColor: isGeo ? '#3B82F615' : c.accent + '15' }]}>
          {isGeo ? <MapPin color="#3B82F6" size={16} /> : <Sparkles color={c.accent} size={16} />}
          <Text style={[Typography.body, { color: c.textMain, marginLeft: 8, flex: 1 }]}>
            Досягнення: <Text style={{ fontWeight: '600' }}>{questTitle}</Text>
          </Text>
        </View>

        {photoUrl && (
          <Image source={{ uri: photoUrl }} style={s.postImage} resizeMode="cover" />
        )}

        <View style={[s.cardFooter, { borderTopColor: c.border }]}>
          <View style={s.reactionsRow}>
            {REACTION_OPTIONS.map((reaction) => {
              const count = item.reactions?.filter(r => r.reaction_type === reaction.type).length || 0;
              const isActive = myReactions[item.id] === reaction.type;
              return (
                <Pressable 
                  key={reaction.type}
                  onPress={() => handleReact(item.id, reaction.type)}
                  style={({ pressed }) => [
                    s.reactionChip,
                    { 
                      backgroundColor: isActive ? c.accent + '25' : (count > 0 ? c.cardBg : 'transparent'),
                      borderColor: isActive ? c.accent : (count > 0 ? c.border : 'transparent'),
                      borderWidth: isActive || count > 0 ? 1 : 0
                    },
                    pressed && s.pressed
                  ]}
                >
                  <Text style={[s.reactionEmoji, isActive && { transform: [{ scale: 1.1 }] }]}>{reaction.emoji}</Text>
                  {count > 0 && (
                    <Text style={[Typography.titleMd, { color: isActive ? c.accent : c.textMuted, fontSize: 13, marginLeft: 6 }]}>
                      {count}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}><ArrowLeft color={c.textMain} size={24} /></Pressable>
        <Text style={[Typography.titleLg, { color: c.textMain, flex: 1, textAlign: 'center', marginRight: 40 }]}>Стрічка підтримки</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchPosts} tintColor={c.accent} />}
          ListEmptyComponent={
            <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginTop: 40 }]}>
              Стрічка поки порожня. Поділися успіхом першою! 🌟
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenX, paddingVertical: 16 },
  backBtn: { padding: 8 },
  listContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 40 },
  card: { borderRadius: Radii.lg, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { padding: 16, paddingBottom: 12 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  questBadge: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 12, borderRadius: Radii.md, marginBottom: 16 },
  postImage: { width: '100%', height: 250 },
  cardFooter: { padding: 10, borderTopWidth: 1 },
  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.full },
  reactionEmoji: { fontSize: 18 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.9 }] },
});