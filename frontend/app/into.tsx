import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Dimensions, 
  SafeAreaView, Pressable, Animated 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Map, MessageCircleHeart, ArrowRight } from 'lucide-react-native';
import { Colors, Typography, Radii, Spacing } from '@/constants/theme';
import { playClickSound } from '@/utils/audio';

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
    description: 'Виконуй Геоквести у реальному світі, відвідуй цікаві локації та отримуй нагороди.',
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
  const [currentIndex, setCurrentIndex] = useState(0);
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
      // Після завершення йдемо на головну (там спрацює логіка показу хобі)
      router.replace('/(main)/home');
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={[s.slide, { backgroundColor: item.color }]}>
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

      <View style={s.footer}>
        {/* Індикатори (крапочки) */}
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

        <Pressable style={s.button} onPress={handleNext}>
          <Text style={s.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Почати' : 'Далі'}
          </Text>
          <ArrowRight color="#FFF" size={20} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  slide: { width, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconContainer: { marginBottom: 40 },
  textContainer: { alignItems: 'center' },
  title: { ...Typography.titleXl, textAlign: 'center', marginBottom: 20, color: '#1F2937' },
  description: { ...Typography.body, textAlign: 'center', color: '#4B5563', lineHeight: 24 },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 30,
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