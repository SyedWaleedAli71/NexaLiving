import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/theme';

/**
 * Dependency-free icon set.
 * Every icon is drawn inside a 20x20 grid and scaled to the requested size,
 * so no icon package or asset bundle is required.
 */

const GRID = 20;

const Shell = ({ size = 20, children }) => (
  <View style={{ width: size, height: size }}>
    <View style={{ width: GRID, height: GRID, transform: [{ scale: size / GRID }] }}>
      {children}
    </View>
  </View>
);

const Stroke = ({ color, thickness = 1.6, style }) => (
  <View
    style={{
      position: 'absolute',
      borderWidth: thickness,
      borderColor: color,
      ...style,
    }}
  />
);

const Fill = ({ color, style }) => (
  <View
    style={{
      position: 'absolute',
      backgroundColor: color,
      borderRadius: 2,
      ...style,
    }}
  />
);

export const MailIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke color={color} style={{ left: 1, top: 4, width: 18, height: 13, borderRadius: 4 }} />
    <Fill
      color={color}
      style={{
        left: 2.6,
        top: 6.4,
        width: 9.4,
        height: 1.6,
        transform: [{ rotate: '32deg' }],
        transformOrigin: 'left center',
      }}
    />
    <Fill
      color={color}
      style={{
        right: 2.6,
        top: 6.4,
        width: 9.4,
        height: 1.6,
        transform: [{ rotate: '-32deg' }],
        transformOrigin: 'right center',
      }}
    />
  </Shell>
);

export const LockIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke
      color={color}
      style={{
        left: 5.5,
        top: 1.5,
        width: 9,
        height: 9,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        borderBottomColor: 'transparent',
      }}
    />
    <Stroke color={color} style={{ left: 2, top: 8.5, width: 16, height: 10, borderRadius: 3.5 }} />
    <Fill color={color} style={{ left: 9.2, top: 11.6, width: 1.7, height: 4.2, borderRadius: 1 }} />
  </Shell>
);

export const EyeIcon = ({ size = 20, color = colors.textSecondary }) => (
  <Shell size={size}>
    <Stroke color={color} style={{ left: 1.5, top: 5, width: 17, height: 10, borderRadius: 10 }} />
    <Fill color={color} style={{ left: 7.6, top: 7.6, width: 4.8, height: 4.8, borderRadius: 2.4 }} />
  </Shell>
);

export const EyeOffIcon = ({ size = 20, color = colors.textSecondary }) => (
  <Shell size={size}>
    <Stroke color={color} style={{ left: 1.5, top: 5, width: 17, height: 10, borderRadius: 10 }} />
    <Fill color={color} style={{ left: 7.6, top: 7.6, width: 4.8, height: 4.8, borderRadius: 2.4 }} />
    <Fill
      color={color}
      style={{
        left: 0.5,
        top: 9,
        width: 19,
        height: 1.9,
        borderRadius: 1,
        transform: [{ rotate: '-38deg' }],
      }}
    />
  </Shell>
);

export const UserIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke color={color} style={{ left: 6.5, top: 1.8, width: 7, height: 7, borderRadius: 3.5 }} />
    <Stroke
      color={color}
      style={{
        left: 3,
        top: 11,
        width: 14,
        height: 7.5,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        borderBottomColor: 'transparent',
      }}
    />
  </Shell>
);

export const PhoneIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke color={color} style={{ left: 4.5, top: 1.5, width: 11, height: 17, borderRadius: 3.2 }} />
    <Fill color={color} style={{ left: 8, top: 3.6, width: 4, height: 1.4 }} />
    <Fill color={color} style={{ left: 8.7, top: 15.1, width: 2.6, height: 1.4 }} />
  </Shell>
);

export const PinIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke
      color={color}
      style={{
        left: 4,
        top: 2.5,
        width: 12,
        height: 12,
        borderRadius: 7,
        borderTopLeftRadius: 2,
        transform: [{ rotate: '45deg' }],
      }}
    />
    <Fill color={color} style={{ left: 8.3, top: 6.8, width: 3.4, height: 3.4, borderRadius: 1.7 }} />
  </Shell>
);

export const IdCardIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke color={color} style={{ left: 1, top: 4, width: 18, height: 12.5, borderRadius: 3 }} />
    <Stroke color={color} thickness={1.4} style={{ left: 3.4, top: 7, width: 4.2, height: 4.2, borderRadius: 2.1 }} />
    <Fill color={color} style={{ left: 10, top: 7.4, width: 6.4, height: 1.5 }} />
    <Fill color={color} style={{ left: 10, top: 10.6, width: 4.4, height: 1.5 }} />
  </Shell>
);

export const ChevronLeftIcon = ({ size = 20, color = colors.textMain }) => (
  <Shell size={size}>
    <Fill
      color={color}
      style={{
        left: 6,
        top: 6,
        width: 8.6,
        height: 1.9,
        transform: [{ rotate: '45deg' }],
        transformOrigin: 'left center',
      }}
    />
    <Fill
      color={color}
      style={{
        left: 6,
        top: 12.1,
        width: 8.6,
        height: 1.9,
        transform: [{ rotate: '-45deg' }],
        transformOrigin: 'left center',
      }}
    />
  </Shell>
);

export const ArrowRightIcon = ({ size = 20, color = colors.white }) => (
  <Shell size={size}>
    <Fill color={color} style={{ left: 2.5, top: 9.1, width: 14, height: 1.9 }} />
    <Fill
      color={color}
      style={{
        right: 3.5,
        top: 9.1,
        width: 7.6,
        height: 1.9,
        transform: [{ rotate: '45deg' }],
        transformOrigin: 'right center',
      }}
    />
    <Fill
      color={color}
      style={{
        right: 3.5,
        top: 5.4,
        width: 7.6,
        height: 1.9,
        transform: [{ rotate: '-45deg' }],
        transformOrigin: 'right center',
      }}
    />
  </Shell>
);

export const CheckIcon = ({ size = 20, color = colors.white }) => (
  <Shell size={size}>
    <Fill
      color={color}
      style={{
        left: 4,
        top: 10.6,
        width: 5.4,
        height: 2.3,
        transform: [{ rotate: '45deg' }],
        transformOrigin: 'left center',
      }}
    />
    <Fill
      color={color}
      style={{
        left: 6.4,
        top: 12.4,
        width: 10.6,
        height: 2.3,
        transform: [{ rotate: '-45deg' }],
        transformOrigin: 'left center',
      }}
    />
  </Shell>
);

export const ShieldIcon = ({ size = 20, color = colors.primary }) => (
  <Shell size={size}>
    <Stroke
      color={color}
      style={{
        left: 3.5,
        top: 2,
        width: 13,
        height: 16,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
      }}
    />
    <Fill
      color={color}
      style={{
        left: 7.4,
        top: 9.4,
        width: 3.4,
        height: 1.7,
        transform: [{ rotate: '45deg' }],
        transformOrigin: 'left center',
      }}
    />
    <Fill
      color={color}
      style={{
        left: 8.9,
        top: 10.9,
        width: 5.6,
        height: 1.7,
        transform: [{ rotate: '-45deg' }],
        transformOrigin: 'left center',
      }}
    />
  </Shell>
);

/** Stylised Google mark: four colour arcs plus the blue crossbar. */
export const GoogleIcon = ({ size = 20 }) => (
  <Shell size={size}>
    <View
      style={{
        position: 'absolute',
        left: 2,
        top: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2.8,
        borderTopColor: colors.google.red,
        borderRightColor: colors.google.yellow,
        borderBottomColor: colors.google.green,
        borderLeftColor: colors.google.blue,
      }}
    />
    <Fill color={colors.google.blue} style={{ left: 9.5, top: 8.7, width: 8.5, height: 2.7 }} />
  </Shell>
);

/** Stylised Apple mark: rounded body, stem and leaf. */
export const AppleIcon = ({ size = 20, color = colors.apple }) => (
  <Shell size={size}>
    <Fill color={color} style={{ left: 3.2, top: 6.4, width: 7, height: 11, borderRadius: 3.6 }} />
    <Fill color={color} style={{ left: 9.8, top: 6.4, width: 7, height: 11, borderRadius: 3.6 }} />
    <Fill color={color} style={{ left: 3.2, top: 9, width: 13.6, height: 6, borderRadius: 3 }} />
    <Fill
      color={color}
      style={{ left: 9.4, top: 4.4, width: 1.7, height: 4, transform: [{ rotate: '12deg' }] }}
    />
    <Fill
      color={color}
      style={{
        left: 10.6,
        top: 2.6,
        width: 5,
        height: 2.8,
        borderRadius: 3,
        transform: [{ rotate: '-24deg' }],
      }}
    />
  </Shell>
);
