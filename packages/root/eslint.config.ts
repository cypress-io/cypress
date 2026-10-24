import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  // rollup writes the build next to the source, outside the shared cjs/esm/dist ignores
  {
    ignores: ['index.js', 'index.mjs'],
  },
  {
    files: ['**/*.spec.ts', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
