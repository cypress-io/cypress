import { baseConfig, frontendOverrides, graphqlConfig, jsonConfig, vueTsxOverrides } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...vueTsxOverrides,
  ...frontendOverrides,
  ...graphqlConfig(),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      '**/*.d.ts',
      'cypress/fixtures/**',
      // graphql-codegen output
      '**/generated/**',
    ],
  },
  {
    files: ['index.js', 'script/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Test support and the e2e plugin setup run in Node, where sync fs is fine
    files: ['cypress/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // import-x cannot parse the `.d.mts` types of @vitejs/plugin-vue
    files: ['vite.config.mjs'],
    rules: {
      'import-x/namespace': 'off',
      'import-x/default': 'off',
    },
  },
]
