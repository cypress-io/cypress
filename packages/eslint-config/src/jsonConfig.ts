import type { Linter } from 'eslint'
import jsonc from 'eslint-plugin-jsonc'
import * as jsoncParser from 'jsonc-eslint-parser'

// Puts scripts and dependencies near the top so they are readable without
// scrolling. Keys not listed here are left unchecked and may sit anywhere.
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
 * Opt-in JSON linting. Spread it after `baseConfig`, which registers the
 * `@stylistic` plugin and supplies `eol-last`:
 * `export default [...baseConfig, ...jsonConfig]`.
 *
 * `--fix` rewrites each file to the `JSON.stringify(value, null, 2)` layout.
 */
export const jsonConfig: Linter.Config[] = [
  {
    files: ['**/*.json'],
    // tsconfig and VS Code settings are JSONC, which allows comments, and
    // package-lock.json is generated
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
