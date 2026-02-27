module.exports = {
  preset: 'react-native',
  testMatch: ['**/src/__tests__/**/*.test.[jt]s?(x)'],
  modulePathIgnorePatterns: [
    '<rootDir>/example/',
    '<rootDir>/example/node_modules',
    '<rootDir>/lib/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/__tests__/**',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 33,
      functions: 23,
      lines: 23,
      statements: 24,
    },
  },
};
