import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AnimatedCardProps = PressableProps & {
  animationsEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export default function AnimatedCard({
  onPress,
  onPressIn,
  onPressOut,
  style,
  children,
  animationsEnabled = true,
  disabled,
  ...rest
}: AnimatedCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled && animationsEnabled) {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (animationsEnabled) {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }
        onPressOut?.(e);
      }}
      onPress={onPress}
      style={[style, animationsEnabled ? animatedStyle : null]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
