import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientSurface from '../components/GradientSurface';
import { AnimatedIn, Floating, FloatingBlobs } from '../components/Motion';
import { PrimaryButton } from '../components/Buttons';
import { ArrowRightIcon, PinIcon, ShieldIcon, UserIcon } from '../components/Icons';
import { colors, radius, shadows, spacing } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Keeps the hero balanced on small phones without dominating large ones.
const HERO_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.5, 340), 440);

/** Animated word-by-word headline. */
const AnimatedHeadline = ({ text, style, delay = 0 }) => (
  <View style={styles.headlineRow}>
    {text.split(' ').map((word, index) => (
      <AnimatedIn key={`${word}-${index}`} delay={delay + index * 130} distance={18} duration={480}>
        <Text style={style}>{word}</Text>
      </AnimatedIn>
    ))}
  </View>
);

/** A single tower in the community illustration. */
const Tower = ({ width: w, height: h, body, roof, rows = 3, delay = 0 }) => (
  <AnimatedIn delay={delay} distance={22} style={{ alignItems: 'center' }}>
    <View style={[styles.tower, { width: w, height: h, backgroundColor: body }]}>
      <View style={[styles.towerTop, { backgroundColor: roof }]} />
      <View style={styles.windowGrid}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
          </View>
        ))}
      </View>
    </View>
  </AnimatedIn>
);

/** Decorative, asset-free "connected community" illustration. */
const CommunityArt = () => (
  <View style={styles.art}>
    <Floating distance={7} duration={2900}>
      <View style={styles.artInner}>
        <View style={styles.sun} />
        <View style={styles.towersRow}>
          <Tower width={44} height={78} body="#DDD6FE" roof={colors.primary} rows={3} delay={260} />
          <Tower width={54} height={106} body={colors.primary} roof={colors.secondary} rows={4} delay={340} />
          <Tower width={42} height={64} body="#FBCFE8" roof={colors.secondary} rows={2} delay={420} />
        </View>
        <View style={styles.ground} />
        <View style={styles.linkDotLeft}>
          <View style={styles.dotCore} />
        </View>
        <View style={styles.linkDotRight}>
          <View style={styles.dotCore} />
        </View>
      </View>
    </Floating>
  </View>
);

const FEATURES = [
  { icon: <UserIcon size={18} color={colors.primary} />, label: 'Community' },
  { icon: <ShieldIcon size={18} color={colors.secondary} />, label: 'Security' },
  { icon: <PinIcon size={18} color={colors.primary} />, label: 'Locations' },
];

const Welcome = ({ onNext }) => (
  <SafeAreaView style={styles.safe}>
    <FloatingBlobs variant="hero" />

    {/* Gradient hero panel */}
    <GradientSurface
      colors={[colors.primary, colors.secondary]}
      radius={44}
      center={false}
      style={styles.hero}>
      <View style={styles.heroInner}>
        <AnimatedIn delay={60} distance={16}>
          <View style={styles.glassBadge}>
            <Text style={styles.glassBadgeText}>N</Text>
          </View>
        </AnimatedIn>

        <AnimatedHeadline
          text="Welcome To NexaLiving"
          style={styles.heroTitle}
          delay={180}
        />

        <AnimatedIn delay={620} distance={16}>
          <Text style={styles.heroSubtitle}>
            Your Community, Your Comfort, Your Connected Living.
          </Text>
        </AnimatedIn>

        <CommunityArt />
      </View>
    </GradientSurface>

    {/* Feature chips */}
    <View style={styles.chipsRow}>
      {FEATURES.map((feature, index) => (
        <AnimatedIn
          key={feature.label}
          delay={720 + index * 120}
          distance={18}
          style={styles.chipFlex}>
          <View style={[styles.chip, shadows.soft]}>
            <View style={styles.chipIcon}>{feature.icon}</View>
            <Text style={styles.chipLabel}>{feature.label}</Text>
          </View>
        </AnimatedIn>
      ))}
    </View>

    <AnimatedIn delay={1080} distance={22} style={styles.bottomArea}>
      <Text style={styles.tagline}>
        Manage residences, amenities and neighbourhood conversations in one
        elegant place.
      </Text>

      {/* Next sits on the left of the bottom navigation area, as requested. */}
      <View style={styles.bottomRow}>
        <PrimaryButton
          label="Next"
          icon={<ArrowRightIcon size={18} color={colors.white} />}
          onPress={onNext}
          style={styles.nextButton}
          height={54}
        />
        <View style={styles.pagination}>
          <View style={[styles.pageDot, styles.pageDotActive]} />
          <View style={styles.pageDot} />
          <View style={styles.pageDot} />
        </View>
      </View>
    </AnimatedIn>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  heroInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  glassBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  glassBadgeText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
  },
  headlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 4,
  },
  heroTitle: {
    fontSize: SCREEN_WIDTH > 380 ? 32 : 27,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.6,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  art: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  artInner: {
    width: 220,
    height: 128,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sun: {
    position: 'absolute',
    right: 12,
    top: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  towersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tower: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  towerTop: {
    width: 16,
    height: 5,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginTop: -5,
  },
  windowGrid: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  windowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 8,
  },
  window: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  ground: {
    width: 200,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  linkDotLeft: {
    position: 'absolute',
    left: 2,
    top: 46,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkDotRight: {
    position: 'absolute',
    right: 26,
    bottom: 26,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: -24,
    zIndex: 5,
  },
  chipFlex: {
    flex: 1,
    marginHorizontal: 5,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  bottomArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  tagline: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextButton: {
    width: 168,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 3,
  },
  pageDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});

export default Welcome;
