import { baseConfig, typeCheckedConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.spec.ts', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  ...typeCheckedConfig(['src/**/*.ts']),
]
