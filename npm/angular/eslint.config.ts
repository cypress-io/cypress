import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
    },
  },
]
