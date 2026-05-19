import React from 'react';
import { ViewProps } from 'react-native';
import { MotiView } from 'moti';

type FadeInViewProps = ViewProps & {
  animationsEnabled?: boolean;
  delay?: number;
  children: React.ReactNode;
};

export default function FadeInView({
  animationsEnabled = true,
  delay = 0,
  children,
  style,
  ...rest
}: FadeInViewProps) {
  if (!animationsEnabled) {
    return (
      <MotiView style={style} {...rest}>
        {children}
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay }}
      style={style}
      {...rest}
    >
      {children}
    </MotiView>
  );
}
