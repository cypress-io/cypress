import js from '@eslint/js'
import { InfiniteDepthConfigWithExtends, configs as tsConfigs, parser as tsParser } from 'typescript-eslint'

import cy from 'eslint-plugin-cypress'

import mocha from 'eslint-plugin-mocha'
import globals from 'globals'
import vue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import react from 'eslint-plugin-react'

import { flatConfigs as eslintPluginImportXFlatConfigs } from 'eslint-plugin-import-x'

export const baseConfig = <InfiniteDepthConfigWithExtends[]>[
  js.configs.recommended,
  ...tsConfigs.recommended,
  cy.configs.recommended,
  mocha.configs?.recommended ?? {},
  ...vue.configs['flat/recommended'],
  {
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: '18',
      },
    },
  },
  // importing { config } from @stylistic/eslint-plugin causes errors
  stylistic.configs.customize({
    'braceStyle': '1tbs',
    'arrowParens': true,
  }),
  eslintPluginImportXFlatConfigs.typescript,

  // set up ts parser & import plugin
  {
    files: ['**/*.{ts,js,jsx,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // common node files
  {
    files: ['vite.config.mjs', 'webpack.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // overrides for stylistic rules
  {
    rules: {
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/multiline-ternary': 'off',
      // the following rules are very inconsistent across the codebase.
      // enabling them, even with customized options, may result in large diffs.
      '@stylistic/indent': 'off', // ['warn', 2, { MemberExpression: 0 }],
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/quote-props': 'off',
      '@stylistic/spaced-comment': 'off',
      '@stylistic/no-extra-parens': 'off',
      '@stylistic/new-parens': 'off',
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/template-curly-spacing': 'off',
      '@stylistic/no-mixed-operators': 'off',
      '@stylistic/jsx-tag-spacing': 'off',
      '@stylistic/jsx-function-call-newline': 'off',
      '@stylistic/jsx-wrap-multilines': 'off',
      '@stylistic/jsx-closing-tag-location': 'off',
      '@stylistic/jsx-first-prop-new-line': 'off',
      '@stylistic/jsx-closing-bracket-location': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/jsx-max-props-per-line': 'off',
      '@stylistic/jsx-curly-brace-presence': 'off',
      '@stylistic/jsx-quotes': 'off',
    },
  },

  // overrides for basic recommended rules, and custom rules
  {
    rules: {
      'no-console': 'error',
      'no-restricted-properties': [
        'warn',
        {
          object: 'process',
          property: 'geteuid',
          message: 'process.geteuid() will throw on Windows. Do not use it unless you catch any potential errors.',
        },
        {
          object: 'os',
          property: 'userInfo',
          message: 'os.userInfo() will throw when there is not an `/etc/passwd` entry for the current user (like when running with --user 12345 in Docker). Do not use it unless you catch any potential errors.',
        },
      ],
      'no-restricted-syntax': [
        // esquery tool: https://estools.github.io/esquery/
        'warn',
        {
          // match sync FS methods except for `existsSync`
          // examples: fse.readFileSync, fs.readFileSync, this.ctx.fs.readFileSync...
          selector: `MemberExpression[object.name='fs'][property.name=/^[A-z]+Sync$/]:not(MemberExpression[property.name='existsSync']), MemberExpression[property.name=/^[A-z]+Sync$/]:not(MemberExpression[property.name='existsSync']):has(MemberExpression[property.name='fs'])`,
          message: 'Synchronous fs calls should not be used in Cypress. Use an async API instead.',
        },
      ],
      'padding-line-between-statements': [
        'error',
        {
          'blankLine': 'always',
          'prev': '*',
          'next': 'return',
        },
        {
          'blankLine': 'always',
          'prev': [
            'const',
            'let',
            'var',
            'if',
            'while',
            'export',
            'cjs-export',
            'import',
            'cjs-import',
            'multiline-expression',
          ],
          'next': '*',
        },
        {
          'blankLine': 'any',
          'prev': [
            'const',
            'let',
            'var',
            'import',
            'cjs-import',
          ],
          'next': [
            'const',
            'let',
            'var',
            'import',
            'cjs-import',
          ],
        },
      ],
    },
  },

  {
    // rules that are gold standard, but have many violations
    // these are off while developing eslint, but should eventually be enabled
    rules: {
      'no-useless-escape': 'off',
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      'no-prototype-builtins': 'off',
      'no-global-assign': 'off',
      'no-unsafe-finally': 'off',
      'no-async-promise-executor': 'off',
      'no-unsafe-optional-chaining': 'off',
      'prefer-spread': 'warn',

      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',

      'mocha/no-mocha-arrows': 'off',
      'mocha/no-setup-in-describe': 'off',
      'mocha/max-top-level-suites': 'off',
      'mocha/no-top-level-hooks': 'off',
      'mocha/no-identical-title': 'off',
      'mocha/consistent-spacing-between-blocks': 'off',
      'mocha/no-global-tests': 'off',
      'mocha/no-sibling-hooks': 'off',
      'mocha/no-skipped-tests': 'off',
      'mocha/no-exports': 'off',
      'mocha/no-async-describe': 'off',
      'mocha/no-return-and-callback': 'off',
      'mocha/no-pending-tests': 'off',
      'mocha/no-nested-tests': 'off',

      'vue/multi-word-component-names': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/no-dupe-keys': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/no-useless-template-attributes': 'off',

      'cypress/no-unnecessary-waiting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
      'cypress/no-async-tests': 'off',
      'cypress/no-assigning-return-values': 'off',

      'react/no-string-refs': 'warn',
      'react/prop-types': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/no-unknown-property': 'warn',
      'react/jsx-key': 'warn',
      'react/display-name': 'warn',

      // we use react 18+, so these rules do not apply
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // these are generally noisy, and not that helpful at this point. Maybe
      // down the line we can enable them.
      'import-x/default': 'warn',
      'import-x/namespace': 'warn',
    },
  },

  // common file patterns to ignore
  {
    ignores: [
      '.releaserc.js',
      'dist/**/*',
      '**/__snapshots__/**/*',
      'test/.mocharc.js',
    ],
  },

  // globals necessary for mixed js/ts
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        ...globals['shared-node-browser'],
        ...globals['es2020'], // this should be aligned with tsconfig "lib"
      },
    },
  },

  // cy, *sx, and vue files are always in browser
  {
    files: ['**/*.cy.{js,ts}', '**/*.{j,t}sx', '**/*.vue'],
    languageOptions: {
      globals: {
        ...globals['browser'],
      },
    },
  },

  {
    files: ['webpack.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]
