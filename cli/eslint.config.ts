import { baseConfig, cliOverrides, jsonConfig, nodeConfig, userNodeConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  {
    ...userNodeConfig,
    // CI runs the specs on the dev Node; only the shipped CLI runs on the user's
    ignores: ['test/**'],
  },
  ...vitestConfig,
  ...cliOverrides,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Type tests declare values, and write bare `x // $ExpectType T`
    // expressions, only so the type checker can assert on them
    files: ['types/tests/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
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
      '**/types/{aria-query,bluebird,chai,chai-jquery,jquery,lodash,minimatch,mocha,sinon,sinon-chai}/**/*',
      // Copied in by sync-typedefs from @packages/network-interception, which lints
      // the original. Its disable directive reads as unused against this config.
      '**/types/net-stubbing.d.ts',
      '.mocharc.js',
      '**/*.js',
    ],
  },
]
