import { baseConfig, cliOverrides } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...cliOverrides,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      '**/__snapshots__',
      '**/build/**/*',
      'package.json',
      '**/angular/**/*',
      '**/react/**/*',
      '**/vue/**/*',
      '**/svelte/**/*',
      '**/mount-utils/**/*',
      '**/types/{bluebird,chai,chai-jquery,jquery,lodash,minimatch,mocha,sinon,sinon-chai}/**/*',
      // Copied in by sync-typedefs from @packages/network-interception, which lints
      // the original. Its disable directives read as unused against this config.
      '**/types/net-stubbing.d.ts',
      '.mocharc.js',
      '**/*.js',
    ],
  },
]
