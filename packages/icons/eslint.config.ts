import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, noMisusedPromisesConfig, vitestConfig } from '@packages/eslint-config'

const typeAwareFiles = ['index.ts', 'index.mts']

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
  noFloatingPromisesConfig(typeAwareFiles),
  noMisusedPromisesConfig(typeAwareFiles),
  {
    // `tsc -p tsconfig.cjs.json` emits the CJS entry and its declarations next to the source
    ignores: ['index.js', 'index.d.ts'],
  },
]
