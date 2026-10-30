module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // The @react-native config does not expose Jest globals by default.
      files: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
        'jest.setup.js',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
