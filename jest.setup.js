/* eslint-env jest */
/**
 * Jest setup for NexaLiving.
 *
 * react-native-safe-area-context renders its children through a native view,
 * which hides the whole tree from react-test-renderer. The library ships an
 * official JS mock for exactly this case.
 */
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
