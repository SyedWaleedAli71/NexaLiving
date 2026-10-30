import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EyeIcon, EyeOffIcon, CheckIcon } from './Icons';
import { colors, font, radius, spacing } from '../theme/theme';

/**
 * Brand-styled form field with an animated focus ring, leading icon and
 * inline error message. Reused by every authentication screen.
 */
export const AnimatedField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  isPassword = false,
  error,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete = 'off',
  maxLength,
  editable = true,
  returnKeyType = 'next',
  onSubmitEditing,
  blurOnSubmit,
  formatter,
  hint,
  accessibilityLabel,
}) => {
  const focus = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  // One animated value drives the ring, so focus *and* error states both fade.
  React.useEffect(() => {
    const animation = Animated.timing(focus, {
      toValue: focused ? 1 : error ? 0.9 : 0,
      duration: 200,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [focus, focused, error]);

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  const handleChange = text => onChangeText(formatter ? formatter(text) : text);

  const ringColor = error && !focused ? colors.error : colors.primary;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.field, !editable && styles.fieldDisabled]}>
        {/* Animated focus ring (opacity driven, so colours stay crisp). */}
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: ringColor, opacity: focus }]}
        />

        <Animated.View
          style={[
            styles.iconChip,
            {
              transform: [{ scale: focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              backgroundColor: focus.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.inputBg, colors.primarySoft],
              }),
            },
          ]}>
          {icon}
        </Animated.View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          maxLength={maxLength}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          secureTextEntry={hidden}
          accessibilityLabel={accessibilityLabel || label}
          cursorColor={colors.primary}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.trailing}
            onPress={() => setHidden(prev => !prev)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            {hidden ? (
              <EyeOffIcon size={20} color={focused ? colors.primary : colors.textSecondary} />
            ) : (
              <EyeIcon size={20} color={focused ? colors.primary : colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <AnimatedInError text={error} />
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

/** Tiny helper so error text always animates in from a fresh key. */
const AnimatedInError = ({ text }) => {
  const slide = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [slide, text]);

  return (
    <Animated.Text
      style={[
        styles.error,
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-5, 0] }) }],
        },
      ]}>
      {text}
    </Animated.Text>
  );
};

/** Animated square checkbox used for "Remember Me". */
export const Checkbox = ({ checked, onChange, label }) => {
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  React.useEffect(() => {
    const animation = Animated.spring(anim, {
      toValue: checked ? 1 : 0,
      useNativeDriver: false,
      speed: 12,
      bounciness: 6,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, checked]);

  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <Animated.View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked
              ? anim.interpolate({ inputRange: [0, 1], outputRange: [colors.white, colors.primary] })
              : colors.white,
            borderColor: checked ? colors.primary : colors.border,
          },
        ]}>
        <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
          <CheckIcon size={13} color={colors.white} />
        </Animated.View>
      </Animated.View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...font.label,
    marginBottom: spacing.sm,
  },
  field: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  ring: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.6,
    borderRadius: radius.md,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMain,
    paddingVertical: 0,
  },
  trailing: {
    paddingLeft: spacing.sm,
    width: 34,
    alignItems: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 2,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 11.5,
    marginTop: 6,
    marginLeft: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 7,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
