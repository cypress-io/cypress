import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      'app-dist/**/*',
      'lib-dist/**/*',
      '**/*.d.ts',
      // Decaffeinated copy of the old background script; nothing loads it
      'test/helpers/background.js',
    ],
  },
]
