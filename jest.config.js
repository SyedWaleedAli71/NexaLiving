module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    // The default preset misses .jsx files, which breaks App.jsx imports.
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Animated entrance effects make the first render slower than the default 5s.
  testTimeout: 20000,
};
