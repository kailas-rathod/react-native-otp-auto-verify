module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: ['module:react-native-builder-bob/babel-preset'],
    },
    {
      include: /[\\/]node_modules[\\/]react-native[\\/]/,
      presets: ['module:@react-native/babel-preset', '@babel/preset-typescript'],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
