import { baseConfig, regexpConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
    },
  },
]
