module.exports = {
  preset: 'react-native',
  testMatch: ['**/src/__tests__/**/*.test.[jt]s?(x)'],
  modulePathIgnorePatterns: [
    '<rootDir>/example/',
    '<rootDir>/example/node_modules',
    '<rootDir>/lib/',
  ],
};
