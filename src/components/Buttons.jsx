import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import GradientSurface from './GradientSurface';
import { colors, font, radius, shadows } from '../theme/theme';

/**
 * Touch feedback wrapper — React Native has no hover state, so every
 * interactive element responds with a spring scale on press instead.
 */
export const PressableScale = ({
  children,
  onPress,
  disabled = false,
  scaleTo = 0.965,
  style,
  accessibilityLabel,
}) => {
  const pressed = useRef(new Animated.Value(0)).current;

  const onPressIn = () =>
    Animated.spring(pressed, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 4 }).start();
  const onPressOut = () =>
    Animated.spring(pressed, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}>
      <Animated.View
        style={{
          transform: [{ scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) }],
          opacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }),
        }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

/** Primary call-to-action with the purple -> pink brand gradient. */
export const PrimaryButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  height = 56,
}) => (
  <PressableScale
    onPress={onPress}
    disabled={disabled || loading}
    accessibilityLabel={label}
    style={[{ marginHorizontal: 0 }, style]}>
    <GradientSurface
      colors={[colors.primary, colors.secondary]}
      radius={radius.md}
      style={[styles.primary, { height }, shadows.primary]}>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={styles.primaryRow}>
          {icon ? <View style={styles.primaryIcon}>{icon}</View> : null}
          <Text style={font.button}>{label}</Text>
        </View>
      )}
    </GradientSurface>
  </PressableScale>
);

/** Flat white button used for Google / Apple sign-in. */
export const SocialButton = ({ label, icon, onPress, disabled = false }) => (
  <PressableScale
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={label}
    style={styles.socialFlex}>
    <View style={[styles.social, shadows.soft]}>
      <View style={styles.socialIcon}>{icon}</View>
      <Text style={styles.socialLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  </PressableScale>
);

/** Borderless text action (Forgot password, Sign up links). */
export const TextButton = ({ label, onPress, color = colors.primary, style, disabled = false }) => (
  <PressableScale onPress={onPress} disabled={disabled} scaleTo={0.94} accessibilityLabel={label} style={style}>
    <Text style={[styles.textButton, { color }]}>{label}</Text>
  </PressableScale>
);

/** Small circular back button used in screen headers. */
export const IconButton = ({ onPress, children, style, accessibilityLabel = 'Back' }) => (
  <PressableScale onPress={onPress} scaleTo={0.9} accessibilityLabel={accessibilityLabel} style={style}>
    <View style={styles.iconButton}>{children}</View>
  </PressableScale>
);

const styles = StyleSheet.create({
  primary: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIcon: {
    marginRight: 10,
  },
  socialFlex: {
    flex: 1,
  },
  social: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textMain,
  },
  textButton: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
