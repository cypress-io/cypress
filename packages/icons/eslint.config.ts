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
    // Build scripts may use sync fs and the other APIs restricted in shipped code
    files: ['scripts/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // no-floating-promises needs type information, so the shipped source gets a project service
    files: ['index.ts', 'index.mts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    // `tsc -p tsconfig.cjs.json` emits the CJS entry and its declarations next to the source
    ignores: ['index.js', 'index.d.ts'],
  },
]
