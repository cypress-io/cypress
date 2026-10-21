import { baseConfig, cliOverrides, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...cliOverrides,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Type tests declare values only so the type checker can assert on them
    files: ['types/tests/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
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
