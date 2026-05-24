import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Dimensions, 
  Pressable, Animated 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Map, MessageCircleHeart, ArrowRight } from 'lucide-react-native';
import { Typography, Radii } from '@/constants/theme';
import { playClickSound } from '@/utils/audio';
import { useAppSettings } from '@/hooks/useAppSettings';
import AnimatedCard from '@/components/AnimatedCard';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Твій ментальний простір',
    description: 'AuMentem допоможе тобі знайти спокій та відновити сили через прості квести.',
    icon: <Sparkles size={80} color="#8B5CF6" />,
    color: '#F5F3FF'
  },
  {
    id: '2',
    title: 'Досліджуй світ',
    description: 'Відвідуй цікаві локації та локальні події, проходь геоквести, відкривай нові враження й зберігай фото у персональному альбомі досягнень.',
    icon: <Map size={80} color="#10B981" />,
    color: '#ECFDF5'
  },
  {
    id: '3',
    title: 'Ти не один',
    description: 'Ділись своїми думками в анонімній стрічці та отримуй підтримку від спільноти.',
    icon: <MessageCircleHeart size={80} color="#EF4444" />,
    color: '#FEF2F2'
  }
];

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { animationsEnabled } = useAppSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const footerBottom = Math.max(insets.bottom + 16, 32);
  const slidePaddingBottom = footerBottom + 100;
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      (slidesRef.current as any).scrollToIndex({ index: currentIndex + 1 });
    } else {
      playClickSound();
      router.replace('/(main)/home');
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={[s.slide, { backgroundColor: item.color, paddingBottom: slidePaddingBottom }]}>
      <View style={s.iconContainer}>{item.icon}</View>
      <View style={s.textContainer}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        ref={slidesRef}
      />

      <View style={[s.footer, { bottom: footerBottom }]}>
        <View style={s.indicatorContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            return <Animated.View style={[s.dot, { width: dotWidth }]} key={i} />;
          })}
        </View>

        <AnimatedCard animationsEnabled={animationsEnabled} style={s.button} onPress={handleNext}>
          <Text style={s.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Почати' : 'Далі'}
          </Text>
          <ArrowRight color="#FFF" size={20} />
        </AnimatedCard>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  slide: { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 24 },
  iconContainer: { marginBottom: height < 700 ? 24 : 40 },
  textContainer: { alignItems: 'center', maxWidth: 320 },
  title: { ...Typography.titleXl, textAlign: 'center', marginBottom: 16, color: '#1F2937', fontSize: height < 700 ? 26 : 32 },
  description: { ...Typography.body, textAlign: 'center', color: '#4B5563', lineHeight: 24, fontSize: height < 700 ? 14 : 16 },
  footer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorContainer: { flexDirection: 'row', gap: 8 },
  dot: { height: 10, borderRadius: 5, backgroundColor: '#8B5CF6' },
  button: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: Radii.full,
    alignItems: 'center',
    gap: 10,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});