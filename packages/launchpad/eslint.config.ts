import { baseConfig, frontendOverrides, graphqlConfig, jsonConfig, vueTsxOverrides } from '@packages/eslint-config'

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
    // frontend-shared's vite config defines `process.env` for the browser bundle
    files: ['src/**/*.vue'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    ignores: [
      // vite build output for the e2e bundle
      'dist-*/**',
      // ambient declarations for vite and .vue imports
      '**/*.d.ts',
      'cypress/fixtures/**',
    ],
  },
]
