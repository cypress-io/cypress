import type { Linter } from 'eslint'
import jsonc from 'eslint-plugin-jsonc'
import * as jsoncParser from 'jsonc-eslint-parser'

// The "pro" order from eslint-plugin-json-format, which the eslintrc
// `@cypress/dev/general` preset applied to every package.json. Keys not listed
// here may appear anywhere after them.
const packageJsonKeyOrder = [
  'name',
  'version',
  'description',
  'private',
  'main',
  'browser',
  'scripts',
  'husky',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'files',
  'bin',
  'engines',
  'types',
  'typings',
  'productName',
  'license',
  'repository',
  'homepage',
  'author',
  'bugs',
]

/**
 * Opt-in JSON linting. Spread it after `baseConfig`:
 * `export default [...baseConfig, ...jsonConfig]`.
 *
 * Enforces the `JSON.stringify(value, null, 2)` layout and `package.json` key
 * order that eslint-plugin-json-format enforced under eslintrc.
 */
export const jsonConfig: Linter.Config[] = [
  {
    files: ['**/*.json'],
    // JSONC files that eslint-plugin-json-format skipped too, and generated lockfiles
    ignores: [
      '**/tsconfig*.json',
      '**/.vscode/**',
      '**/package-lock.json',
    ],
    plugins: {
      jsonc,
    },
    languageOptions: {
      parser: jsoncParser,
    },
    rules: {
      ...jsonc.configs['recommended-with-json'].rules,

      'jsonc/indent': ['error', 2],
      'jsonc/key-spacing': 'error',
      'jsonc/comma-style': 'error',
      'jsonc/object-curly-newline': ['error', { minProperties: 1 }],
      'jsonc/object-property-newline': 'error',
      'jsonc/array-bracket-newline': ['error', { minItems: 1 }],
      'jsonc/array-element-newline': ['error', 'always'],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 0 }],
    },
  },
  {
    files: ['**/package.json'],
    rules: {
      'jsonc/sort-keys': [
        'error',
        {
          pathPattern: '^$',
          order: packageJsonKeyOrder,
        },
        {
          pathPattern: '^(?:dev|peer|optional)?[Dd]ependencies$',
          order: { type: 'asc' },
        },
      ],
    },
  },
]
