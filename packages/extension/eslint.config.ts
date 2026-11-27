import { baseConfig, jsonConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...vitestConfig,
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
