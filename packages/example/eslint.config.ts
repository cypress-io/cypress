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
    // `app/` and `cypress/` are copied from cypress-example-kitchensink by
    // `bin/build.ts`, so fixes belong upstream. `build/` is the gulp output,
    // and `build-prod` emits `lib/*.js` beside its sources.
    ignores: ['app/**/*', 'cypress/**/*', 'build/**/*', 'lib/**/*.js'],
  },
]
