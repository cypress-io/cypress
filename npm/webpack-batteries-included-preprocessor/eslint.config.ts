import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['test/fixtures/**/*', 'test/_test-output/**', 'index.js', 'index.d.ts'],
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
