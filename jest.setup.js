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

// AsyncStorage v3 publishes its Jest mock as ESM, which Jest does not transform
// from node_modules in this project. Keep tests on a small in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map();
  return {
    __esModule: true,
    default: {
      getItem: async key => (values.has(key) ? values.get(key) : null),
      setItem: async (key, value) => { values.set(key, String(value)); },
      removeItem: async key => { values.delete(key); },
      clear: async () => { values.clear(); },
    },
  };
}, {virtual: true});
