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
    // `tsc -p tsconfig.cjs.json` emits the CJS entry and its declarations next to the source
    ignores: ['index.js', 'index.d.ts'],
  },
]
