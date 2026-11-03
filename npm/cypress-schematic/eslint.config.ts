import { baseConfig, cliOverrides, jsonConfig } from '@packages/eslint-config'
import { globalIgnores } from 'eslint/config'

export default [
  // these are configured to build in place, rather than in a separate
  // dist folder, so we need to ignore them
  globalIgnores(['src/**/*.{js,js.map,d.ts}']),
  ...baseConfig,
  ...jsonConfig,
  ...cliOverrides,
  {
    files: ['**/*.spec.ts', '**/*.component.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
