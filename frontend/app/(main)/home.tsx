import React, { useState } from 'react';
import { ImageBackground, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { Cat, Dog, Map, MessageCircleHeart, Moon, Settings, Sparkles, Sun, User } from 'lucide-react-native';
import AnimatedPet from '@/components/AnimatedPet';
import BottomNav from '@/components/BottomNav';
import { Colors, Shadows, Typography, IconSizes } from '@/constants/theme';
import { styles } from './home.styles';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [petType, setPetType] = useState<'cat' | 'dog'>('cat');
  const isDark = theme === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const sh = Shadows[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const getCardStyle = (pressed: boolean, isFeed = false) => [
    isFeed ? styles.feedCard : styles.card,
    { 
      backgroundColor: c.cardBg, 
      borderTopColor: c.borderTopLeft, 
      borderLeftColor: c.borderTopLeft,
      borderBottomColor: c.borderBotRight,
      borderRightColor: c.borderBotRight,
    },
    sh.soft,
    pressed && styles.pressed
  ];

  return (
    <View style={styles.root}>
      <ImageBackground source={require('@/assets/images/background.jpg')} style={styles.background} resizeMode="cover">
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: c.overlay }]} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.content}>
            
            {/* ХЕДЕР */}
            <View style={styles.header}>
              <Pressable style={({pressed}) => getCardStyle(pressed, false)}><User color={c.textMain} size={IconSizes.sm} strokeWidth={2} /></Pressable>
              <View style={styles.headerActions}>
                <Pressable onPress={() => setPetType(p => p === 'cat' ? 'dog' : 'cat')} style={({pressed}) => getCardStyle(pressed, false)}>
                  {petType === 'cat' ? <Cat color={c.textMain} size={IconSizes.sm} /> : <Dog color={c.textMain} size={IconSizes.sm} />}
                </Pressable>
                <Pressable onPress={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={({pressed}) => getCardStyle(pressed, false)}>
                  {isDark ? <Sun color={c.textMain} size={IconSizes.sm} /> : <Moon color={c.textMain} size={IconSizes.sm} />}
                </Pressable>
                <Pressable style={({pressed}) => getCardStyle(pressed, false)}><Settings color={c.textMain} size={IconSizes.sm} /></Pressable>
              </View>
            </View>

            {/* БЛОК КАРТОК */}
            <View style={styles.cardsContainer}>
              <View style={styles.cardsRow}>
                
                {/* Кнопка "Квести" */}
                <Pressable 
                  onPress={() => router.push(`/(main)/quests?theme=${isDark ? 'dark' : 'light'}` as any)}
                  style={({pressed}) => getCardStyle(pressed, false)}
                >
                   <View style={[styles.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                     <Sparkles color={c.iconColor} size={IconSizes.lg} />
                   </View>
                   <Text style={[Typography.titleMd, { color: c.textMain }]}>Квести</Text>
                </Pressable>
                
                {/* Кнопка "Геоквести" */}
                <Pressable 
                  onPress={() => router.push(`/(main)/geoquests?theme=${isDark ? 'dark' : 'light'}` as any)}
                  style={({pressed}) => getCardStyle(pressed, false)}
                >
                   <View style={[styles.iconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                     <Map color={c.iconColor} size={IconSizes.lg} />
                   </View>
                   <Text style={[Typography.titleMd, { color: c.textMain }]}>Геоквести</Text>
                </Pressable>
              </View>

              {/* Анонімна стрічка */}
              <Pressable style={({pressed}) => getCardStyle(pressed, true)}>
                <View style={[styles.feedIconBox, { backgroundColor: c.iconBg }, sh.glow]}>
                  <MessageCircleHeart color={c.iconColor} size={IconSizes.md} />
                </View>
                <View style={styles.feedText}>
                  <Text style={[Typography.titleLg, styles.feedTitle, { color: c.textMain }]}>Анонімна стрічка</Text>
                  <Text style={[Typography.muted, { color: c.textMuted }]}>Ділись почуттями безпечно</Text>
                </View>
              </Pressable>
            </View>

          </View>
          <AnimatedPet isDark={isDark} type={petType} />
          <BottomNav isDark={isDark} />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}