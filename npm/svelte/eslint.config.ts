import { baseConfig, jsonConfig, regexpConfig } from '@packages/eslint-config'

export default [
  { ignores: ['**/dist', '**/*.d.ts', '**/package-lock.json', '**/tsconfig.json', '**/cypress/fixtures'] },
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
    },
    rules: {
      'no-console': 'off',
      'mocha/no-top-level-tests': 'off',
    },
  },
]
