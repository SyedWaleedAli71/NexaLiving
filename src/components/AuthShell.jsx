import React from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientSurface from './GradientSurface';
import { AnimatedIn, FloatingBlobs } from './Motion';
import { colors, font, radius, shadows, spacing } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Circular "N" brand mark used across the authentication flow. */
export const BrandBadge = ({ size = 56, showWordmark = false }) => (
  <View style={styles.badgeRow}>
    <GradientSurface
      colors={[colors.primary, colors.secondary]}
      radius={size / 2}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[styles.badgeText, { fontSize: size * 0.44 }]}>N</Text>
    </GradientSurface>
    {showWordmark ? <Text style={styles.wordmark}>NexaLiving</Text> : null}
  </View>
);

/**
 * Shared scaffold for every authentication screen: safe area, floating brand
 * glow, keyboard handling, scroll on small devices and an elevated card.
 */
const AuthShell = ({ children, header, scrollable = true }) => (
  <SafeAreaView style={styles.safe}>
    <FloatingBlobs />
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            {header}
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.innerStatic}>
          {header}
          {children}
        </View>
      )}
    </KeyboardAvoidingView>
  </SafeAreaView>
);

/** White elevated card that holds the form content. */
export const AuthCard = ({ children, delay = 120 }) => (
  <AnimatedIn delay={delay} distance={34} style={styles.cardFlex}>
    <View style={[styles.card, shadows.card]}>{children}</View>
  </AnimatedIn>
);

/** Standard screen title block. */
export const ScreenHeader = ({ title, subtitle, badge = true, delay = 0 }) => (
  <AnimatedIn delay={delay} style={styles.header}>
    {badge ? <BrandBadge size={54} /> : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </AnimatedIn>
);

export const Divider = ({ label }) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerLabel}>{label}</Text>
    <View style={styles.dividerLine} />
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  innerStatic: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...font.h2,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...font.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  card: {
    width: SCREEN_WIDTH > 600 ? 460 : '100%',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardFlex: {
    width: '100%',
  },
  badgeRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontWeight: '800',
  },
  wordmark: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
});

export default AuthShell;
