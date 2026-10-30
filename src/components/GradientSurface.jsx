import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * A pure React Native stand-in for a linear/radial gradient.
 *
 * react-native-linear-gradient is not part of this project, so the blend is
 * faked with stacked, clipped colour discs. Visually it reads as a soft
 * purple -> pink gradient and costs nothing in dependencies or re-renders.
 */
const GradientSurface = ({
  colors: palette = ['#7C3AED', '#EC4899'],
  style,
  radius = 20,
  center = true,
  children,
}) => {
  const [from, to] = palette;
  return (
    <View style={[{ backgroundColor: from, borderRadius: radius, overflow: 'hidden' }, style]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: to, opacity: 0.28 }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.disc,
          {
            backgroundColor: to,
            opacity: 0.55,
            width: '150%',
            height: '150%',
            left: '28%',
            top: '-40%',
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.disc,
          {
            backgroundColor: to,
            opacity: 0.75,
            width: '95%',
            height: '95%',
            left: '52%',
            top: '-12%',
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.disc,
          {
            backgroundColor: from,
            opacity: 0.45,
            width: '110%',
            height: '110%',
            left: '-45%',
            bottom: '-55%',
          },
        ]}
      />
      <View style={[styles.content, center && styles.centered]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  disc: {
    position: 'absolute',
    borderRadius: 9999,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GradientSurface;
