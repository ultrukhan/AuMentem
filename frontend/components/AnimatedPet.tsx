import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSequence, Easing, interpolate,
} from 'react-native-reanimated';
import Svg, { G, Rect, Circle, Path, Polygon, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

export type PetType = 'cat' | 'dog';

interface Props {
  isDark: boolean;
  type: PetType;
}

const PET_SIZE = 100;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AnimatedPet({ isDark, type }: Props) {
  const c = Colors[isDark ? 'dark' : 'light'];
  const walkProgress = useSharedValue(0); 
  const actionY = useSharedValue(0);
  const actionRotate = useSharedValue(0);
  const tailWag = useSharedValue(0);
  const legFront = useSharedValue(0); 
  const legBack = useSharedValue(0); 

  useEffect(() => {
    walkProgress.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
    legFront.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 600 })), -1, false);
    legBack.value = withRepeat(withSequence(withTiming(0, { duration: 600 }), withTiming(1, { duration: 600 })), -1, false);

    const wagDuration = type === 'cat' ? 1000 : 125;
    tailWag.value = withRepeat(withSequence(
        withTiming(1, { duration: wagDuration }),
        withTiming(-0.5, { duration: wagDuration }),
        withTiming(0, { duration: wagDuration })
      ), -1, true);

    let isAlive = true;
    const randomAction = () => {
      if (!isAlive) return;
      const rand = Math.random();
      if (rand > 0.66) {
        actionY.value = withSequence(withTiming(-15, { duration: 250 }), withTiming(0, { duration: 250 }));
      } else if (rand > 0.33) {
        actionRotate.value = withSequence(withTiming(10, { duration: 250 }), withTiming(-10, { duration: 250 }), withTiming(0, { duration: 250 }));
      }
      setTimeout(randomAction, 3000 + Math.random() * 4000);
    };
    randomAction();
    return () => { isAlive = false; };
  }, [type]);

  const containerStyle = useAnimatedStyle(() => {
    const p = walkProgress.value;
    const travel = SCREEN_WIDTH - PET_SIZE - 24; 
    const x = p <= 0.45 ? interpolate(p, [0, 0.45], [0, travel]) : p <= 0.5 ? travel : p <= 0.95 ? interpolate(p, [0.5, 0.95], [travel, 0]) : 0;
    const scaleX = (p > 0.45 && p <= 0.95) ? -1 : 1;
    return { transform: [{ translateX: x }, { translateY: actionY.value }, { scaleX }, { rotate: `${actionRotate.value}deg` }] };
  });

  const tailStyle = useAnimatedStyle(() => {
    const angle = interpolate(tailWag.value, [-0.5, 0, 1], [-10, 0, type === 'cat' ? 15 : 20]);
    const ox = 25, oy = type === 'cat' ? 70 : 55;
    return { transform: [{ translateX: ox }, { translateY: oy }, { rotate: `${angle}deg` }, { translateX: -ox }, { translateY: -oy }] };
  });

  const frontLegProps = useAnimatedProps(() => ({ y2: `${interpolate(legFront.value, [0, 1], [80, 90])}` as any }));
  const backLegProps = useAnimatedProps(() => ({ y2: `${interpolate(legBack.value, [0, 1], [80, 90])}` as any }));

  return (
    <Animated.View style={[styles.wrap, containerStyle]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, tailStyle]}>
        <Svg viewBox="0 0 100 100">
          <Path d={type === 'cat' ? 'M 25 70 Q 5 70 5 40' : 'M 25 55 Q 5 45 15 30'} fill="none" stroke={c.petOutline} strokeWidth="5" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Svg viewBox="0 0 100 100">
        <G stroke={c.petOutline} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <AnimatedLine x1="35" y1="70" x2="35" y2="85" strokeWidth="5" stroke={c.petOutline} animatedProps={backLegProps} />
          <AnimatedLine x1="75" y1="70" x2="75" y2="85" strokeWidth="5" stroke={c.petOutline} animatedProps={backLegProps} />
          
          <Rect x="25" y="45" width="55" height="30" rx="15" fill={c.petFill} />
          
          {type === 'cat' ? (
            <G>
              <Circle cx="80" cy="40" r="16" fill={c.petFill} />
              <Polygon points="68,30 72,12 82,28" fill={c.petFill} />
              <Polygon points="78,28 88,12 92,30" fill={c.petFill} />
              <Circle cx="85" cy="38" r="2" fill={c.petOutline} stroke="none" />
              <Circle cx="93" cy="38" r="2" fill={c.petOutline} stroke="none" />
              <Path d="M 87 45 Q 89 47 91 45" fill="none" strokeWidth="2" />
            </G>
          ) : (
            <G>
              <Path d="M 85 28 Q 95 35 92 48 Q 85 45 82 30" fill={c.petFill} />
              <Circle cx="78" cy="38" r="14" fill={c.petFill} />
              <Path d="M 80 32 L 96 34 C 100 35 102 42 96 46 L 75 46 Z" fill={c.petFill} />
              <Path d="M 72 26 Q 58 38 65 52 Q 76 48 78 30" fill={c.petFill} />
              <Circle cx="82" cy="35" r="2" fill={c.petOutline} stroke="none" />
              <Circle cx="99" cy="38" r="2.5" fill={c.petFill} stroke="none" />
              <Path d="M 90 44 Q 94 46 96 43" fill="none" strokeWidth="2" />
            </G>
          )}

          <AnimatedLine x1="45" y1="75" x2="45" y2="90" strokeWidth="5" stroke={c.petOutline} animatedProps={frontLegProps} />
          <AnimatedLine x1="85" y1="75" x2="85" y2="90" strokeWidth="5" stroke={c.petOutline} animatedProps={frontLegProps} />
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ wrap: { position: 'absolute', left: 24, bottom: 100, zIndex: 20, width: PET_SIZE, height: PET_SIZE } });