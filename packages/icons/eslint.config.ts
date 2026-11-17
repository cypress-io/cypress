import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Build scripts may use sync fs and the other APIs restricted in shipped code
    files: ['scripts/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  noFloatingPromisesConfig(['index.ts', 'index.mts']),
  {
    // `tsc -p tsconfig.cjs.json` emits the CJS entry and its declarations next to the source
    ignores: ['index.js', 'index.d.ts'],
  },
]
