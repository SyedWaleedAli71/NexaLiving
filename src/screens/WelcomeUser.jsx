import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedIn, FloatingBlobs } from '../components/Motion';
import { PrimaryButton, TextButton } from '../components/Buttons';
import { SuccessCheck, Notice } from '../components/Feedback';
import GradientSurface from '../components/GradientSurface';
import { colors, radius, shadows, spacing } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedGreeting = ({ firstName }) => {
  const words = `Welcome to NexaLiving, ${firstName}!`.split(' ');
  return (
    <View style={styles.greetingRow}>
      {words.map((word, index) => (
        <AnimatedIn key={`${word}-${index}`} delay={260 + index * 120} distance={16} duration={460}>
          <Text style={styles.greeting}>{word}</Text>
        </AnimatedIn>
      ))}
    </View>
  );
};

/**
 * Shown after the registration form is completed. It deliberately separates
 * "form validated" from "account created", since no auth backend exists yet.
 */
const WelcomeUser = ({ firstName, email, onContinue, onLogin }) => (
  <SafeAreaView style={styles.safe}>
    <FloatingBlobs variant="hero" />

    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <AnimatedIn delay={60} distance={20}>
        <SuccessCheck size={108} />
      </AnimatedIn>

      <AnimatedGreeting firstName={firstName || 'Neighbour'} />

      <AnimatedIn delay={760} distance={16}>
        <Text style={styles.subtitle}>
          Your journey towards a better connected community starts here.
        </Text>
      </AnimatedIn>

      <AnimatedIn delay={900} distance={22} style={styles.cardFlex}>
        <View style={[styles.summary, shadows.card]}>
          <GradientSurface
            colors={[colors.primary, colors.secondary]}
            radius={radius.md}
            style={styles.summaryStrip}
          />
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>Registration form completed</Text>
            {email ? <Text style={styles.summaryEmail}>{email}</Text> : null}
            <Notice
              tone="warning"
              title="Account not created yet"
              message="NexaLiving has no authentication backend connected, so your details were validated on this device only and no account exists yet. Nothing was stored or transmitted."
            />
          </View>
        </View>
      </AnimatedIn>

      <AnimatedIn delay={1080} distance={20} style={styles.actions}>
        <PrimaryButton label="Continue" onPress={onContinue} height={56} />
        <View style={styles.loginRow}>
          <TextButton label="Return to Login" onPress={onLogin} color={colors.textSecondary} />
        </View>
      </AnimatedIn>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 6,
    marginTop: spacing.xl,
  },
  greeting: {
    fontSize: SCREEN_WIDTH > 380 ? 27 : 23,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: -0.5,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
  },
  cardFlex: {
    width: '100%',
    marginTop: spacing.xxl,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  summaryStrip: {
    width: 6,
  },
  summaryBody: {
    flex: 1,
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 4,
  },
  summaryEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  actions: {
    marginTop: spacing.xxl,
  },
  loginRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});

export default WelcomeUser;
