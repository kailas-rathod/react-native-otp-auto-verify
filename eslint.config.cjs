const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([
  {
    extends: compat.extends('@react-native-community', 'prettier'),
    rules: {
      'prettier/prettier': [
        'error',
        {
          quoteProps: 'consistent',
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          useTabs: false,
          endOfLine: 'auto',
        },
      ],
      'ft-flow/define-flow-type': 'off',
      'ft-flow/use-flow-type': 'off',
    },
  },
  globalIgnores(['**/node_modules/', '**/lib/', '**/coverage/']),
]);
