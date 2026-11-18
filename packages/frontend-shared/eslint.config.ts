import { baseConfig, compatConfig, frontendOverrides, graphqlConfig, jsonConfig, vueTsxOverrides } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...compatConfig,
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
    // Build scripts and the package entry run in Node, not the browser
    files: ['index.js', 'script/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['vite.config.mjs'],
    rules: {
      // import-x cannot parse the `.d.mts` types of @vitejs/plugin-vue
      'import-x/default': 'off',
      'import-x/namespace': 'off',
    },
  },
  {
    ignores: [
      // Fixture data that specs load as-is
      'cypress/fixtures/**/*',
      // Written by `yarn build`
      '**/generated/**/*',
    ],
  },
]
