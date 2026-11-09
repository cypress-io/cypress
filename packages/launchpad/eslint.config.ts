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
    // frontend-shared's vite config defines `process.env` for the browser bundle
    files: ['src/**/*.vue'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
]
