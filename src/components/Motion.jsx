import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Fade + slide-up entrance wrapper. Driven by the built-in Animated API
 * (Reanimated is not installed in this project).
 */
export const AnimatedIn = ({
  children,
  delay = 0,
  distance = 26,
  duration = 520,
  style,
  direction = 'up',
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    animation.start();
    // `delay` is implemented with a setTimeout inside TimingAnimation, so the
    // animation must be stopped on unmount or it resumes against a dead view.
    return () => animation.stop();
  }, [progress, duration, delay]);

  const translateY = direction === 'up' ? progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) : 0;
  const translateX = direction === 'left' ? progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) : 0;

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [{ translateX }, { translateY }],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
};

/**
 * Slowly drifting decorative blob. Used for the purple/pink background glow.
 */
const Blob = ({ size, color, opacity, x, y, drift = 16, duration = 4200, delay = 0 }) => {
  const tick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tick, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(tick, {
          toValue: 0,
          duration,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tick, duration, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          left: x,
          top: y,
          transform: [
            { translateX: tick.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
            { translateY: tick.interpolate({ inputRange: [0, 1], outputRange: [0, -drift * 0.7] }) },
            { scale: tick.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        },
      ]}
    />
  );
};

/**
 * Floating brand glow behind every authentication screen.
 * Purely decorative and marked pointerEvents="none".
 */
export const FloatingBlobs = ({ variant = 'default' }) => {
  const layout =
    variant === 'hero'
      ? [
          { size: 260, color: '#7C3AED', opacity: 0.16, x: SCREEN_WIDTH * 0.55, y: SCREEN_HEIGHT * 0.06, drift: 22, duration: 5200 },
          { size: 190, color: '#EC4899', opacity: 0.16, x: -50, y: SCREEN_HEIGHT * 0.24, drift: 18, duration: 4400, delay: 300 },
          { size: 150, color: '#7C3AED', opacity: 0.12, x: SCREEN_WIDTH * 0.12, y: SCREEN_HEIGHT * 0.72, drift: 20, duration: 6000, delay: 600 },
        ]
      : [
          { size: 230, color: '#7C3AED', opacity: 0.13, x: SCREEN_WIDTH * 0.6, y: -60, drift: 18, duration: 5400 },
          { size: 180, color: '#EC4899', opacity: 0.13, x: -60, y: SCREEN_HEIGHT * 0.12, drift: 16, duration: 4600, delay: 250 },
          { size: 140, color: '#EC4899', opacity: 0.1, x: SCREEN_WIDTH * 0.68, y: SCREEN_HEIGHT * 0.78, drift: 18, duration: 6200, delay: 500 },
        ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {layout.map((blob, index) => (
        <Blob key={index} {...blob} />
      ))}
    </View>
  );
};

/** Gentle vertical float, e.g. for the welcome illustration. */
export const Floating = ({ children, distance = 8, duration = 2600, style }) => {
  const tick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tick, { toValue: 1, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(tick, { toValue: 0, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tick, duration]);

  return (
    <Animated.View
      style={[
        { transform: [{ translateY: tick.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }] },
        style,
      ]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
