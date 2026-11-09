import { baseConfig, frontendOverrides, graphqlConfig, jsonConfig, vueA11yConfig, vueTsxOverrides } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...vueTsxOverrides,
  ...frontendOverrides,
  ...vueA11yConfig,
  ...graphqlConfig(),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // The e2e specs and their plugins run Cypress against itself and may use sync fs
    // and the other APIs restricted in shipped code
    files: ['cypress/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Copied from the cloud-delivered bundles by `gulpCloudDeliveredTypes`, so they
    // can't be fixed here. Each declares a const that only its exported types read.
    files: ['src/prompt/prompt-app-types.ts', 'src/studio/studio-app-types.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['vite.config.mjs'],
    rules: {
      // import-x cannot parse the `.d.ts` types of @vitejs/plugin-legacy
      'import-x/default': 'off',
      'import-x/namespace': 'off',
    },
  },
  {
    ignores: [
      // Written by `yarn build`
      'src/generated/**/*',
      // Data that specs load as written; the mochaEvents snapshots are rewritten by
      // `cypress:run:e2e:update:snapshots`
      'cypress/fixtures/**/*',
      'cypress/e2e/runner/snapshots/**/*',
    ],
  },
]
