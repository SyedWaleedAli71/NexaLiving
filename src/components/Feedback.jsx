import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import GradientSurface from './GradientSurface';
import { CheckIcon } from './Icons';
import { colors, radius, shadows, spacing } from '../theme/theme';

const TONES = {
  info: { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
  warning: { bg: colors.warningSoft, border: '#FDE68A', text: '#92400E' },
  success: { bg: colors.successSoft, border: '#BBF7D0', text: '#166534' },
  error: { bg: colors.errorSoft, border: '#FECACA', text: '#991B1B' },
};

/**
 * Inline, animated status banner. Used to surface validation feedback and to
 * clearly separate "form completed" from "account actually created".
 */
export const Notice = ({ tone = 'info', title, message, visible = true }) => {
  const slide = useRef(new Animated.Value(0)).current;
  const palette = TONES[tone] || TONES.info;

  useEffect(() => {
    const animation = Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    animation.start();
    return () => animation.stop();
  }, [slide, visible]);

  return (
    <Animated.View
      style={{
        opacity: slide,
        transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        height: visible ? undefined : 0,
      }}>
      <View
        style={[
          styles.notice,
          { backgroundColor: palette.bg, borderColor: palette.border },
        ]}>
        <View style={[styles.noticeDot, { backgroundColor: palette.text }]} />
        <View style={styles.noticeBody}>
          {title ? <Text style={[styles.noticeTitle, { color: palette.text }]}>{title}</Text> : null}
          {message ? <Text style={[styles.noticeMessage, { color: palette.text }]}>{message}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
};

/**
 * Animated success mark: gradient disc springs in, a halo expands outwards
 * and the tick fades in on top.
 */
export const SuccessCheck = ({ size = 104 }) => {
  const pop = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.sequence([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }),
      Animated.timing(tick, { toValue: 1, duration: 260, useNativeDriver: true, easing: Easing.out(Easing.back(2)) }),
    ]);
    entrance.start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        // Same driver as the frame above: mixing JS and native animations on one
        // AnimatedValue throws on device.
        Animated.timing(halo, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      entrance.stop();
    };
  }, [pop, halo, tick]);

  return (
    <View style={[styles.checkWrap, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.secondary,
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] }),
            transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }], flex: 1 }}>
        <GradientSurface
          colors={[colors.primary, colors.secondary]}
          radius={size / 2}
          style={[styles.disc, { width: size, height: size }]}>
          <Animated.View
            style={{
              opacity: tick,
              transform: [
                { scale: tick.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                { rotate: tick.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
              ],
            }}>
            <CheckIcon size={size * 0.42} color={colors.white} />
          </Animated.View>
        </GradientSurface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: spacing.sm + 2,
  },
  noticeBody: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  noticeMessage: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primary,
  },
});
