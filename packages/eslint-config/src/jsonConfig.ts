import type { Linter } from 'eslint'
import jsonc from 'eslint-plugin-jsonc'
import packageJson from 'eslint-plugin-package-json'
import * as jsoncParser from 'jsonc-eslint-parser'

/**
 * Opt-in JSON linting. Spread it after `baseConfig`, which registers the
 * `@stylistic` and `@cypress/dev` plugins and supplies `eol-last`:
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
      '@cypress/dev/json-empty-container-spacing': 'error',
    },
  },
  {
    files: ['**/package.json'],
    plugins: {
      'package-json': packageJson,
    },
    rules: {
      'package-json/order-properties': ['error', { order: 'sort-package-json' }],
      // Not the rule's default list: that includes `exports`, where the order
      // of conditions is significant and `default` must come last
      'package-json/sort-collections': [
        'error',
        [
          'scripts',
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'optionalDependencies',
        ],
      ],
    },
  },
]
