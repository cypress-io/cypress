import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  // test/fixtures are webpack inputs, including one that deliberately fails to compile
  { ignores: ['test/fixtures/**'] },
  ...baseConfig,
  ...jsonConfig,
  {
    files: ['**/*.spec.ts', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
