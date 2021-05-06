const customRules = require('./custom-rules')
const baseRules = {
  '@cypress/dev/arrow-body-multiline-braces': ['error', 'always'],
  curly: ['error', 'all'],
  'constructor-super': 'error',
  'default-case': 'error',
  eqeqeq: ['error', 'allow-null'],
  'no-buffer-constructor': 'error',
  'no-case-declarations': 'error',
  'no-class-assign': 'error',
  'no-cond-assign': 'error',
  'no-console': 'error',
  'no-const-assign': 'error',
  'no-constant-condition': 'error',
  'no-control-regex': 'error',
  'no-debugger': 'error',
  'no-delete-var': 'error',
  'no-dupe-class-members': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-duplicate-case': 'error',
  'no-duplicate-imports': 'error',
  'no-else-return': [
    'error',
    {
      allowElseIf: false,
    },
  ],
  'no-empty': 'error',
  'no-empty-character-class': 'error',
  'no-empty-pattern': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-fallthrough': 'error',
  'no-func-assign': 'error',
  'no-inner-declarations': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-negated-in-lhs': 'error',
  'no-new-symbol': 'error',
  'no-obj-calls': 'error',
  'no-octal': 'error',
  'no-redeclare': 'error',
  'no-regex-spaces': 'error',
  'no-self-assign': 'error',
  'no-spaced-func': 'error',
  'no-sparse-arrays': 'error',
  'no-this-before-super': 'error',
  'no-undef': 'error',
  'no-unexpected-multiline': 'error',
  'no-unneeded-ternary': 'error',
  'no-unreachable': 'error',
  'no-unused-labels': 'error',
  'no-unused-vars': ['error', { args: 'none' }],
  'no-useless-concat': 'error',
  'no-useless-constructor': 'error',
  'no-var': 'error',
  'no-whitespace-before-property': 'error',
  'one-var': ['error', 'never'],
  'padding-line-between-statements': [
    'error',
    {
      blankLine: 'always',
      prev: '*',
      next: 'return',
    },
    {
      blankLine: 'always',
      prev: [
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
      next: '*',
    },
    {
      blankLine: 'any',
      prev: ['const', 'let', 'var', 'import', 'cjs-import'],
      next: ['const', 'let', 'var', 'import', 'cjs-import'],
    },
  ],
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'prefer-template': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
}

// '@cypress/dev/no-only': 'error',

module.exports = {
  configs: {
    general: {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      plugins: ['json-format'],
      settings: {
        json: {
          'sort-package-json': 'pro',
        },
        react: {
          version: 'detect',
        },
      },
      env: {
        node: true,
        es6: true,
      },
      extends: ['plugin:prettier/recommended'],
      rules: {
        ...baseRules,
      },
      overrides: [
        {
          files: ['*.jsx', '*.tsx'],
          rules: {
            '@cypress/dev/arrow-body-multiline-braces': 'off',
          },
        },
        {
          files: '*.coffee',
          parser: '@fellow/eslint-plugin-coffee',
          parserOptions: {
            parser: 'babel-eslint',
            sourceType: 'module',
            ecmaVersion: 2018,
          },
          plugins: ['@fellow/eslint-plugin-coffee'],
          rules: {
            ...Object.assign({}, ...Object.keys(baseRules).map((key) => ({ [key]: 'off' }))),
            '@fellow/coffee/coffeescript-error': ['error', {}],
          },
        },
        {
          files: ['*.ts', '*.tsx'],
          parser: '@typescript-eslint/parser',
          plugins: ['@typescript-eslint'],
          rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
              'error',
              {
                args: 'none',
              },
            ],
            '@typescript-eslint/no-useless-constructor': ['error'],
          },
        },
      ],
    },

    tests: {
      env: {
        mocha: true,
      },
      globals: {
        expect: true,
      },
      plugins: ['mocha'],
      rules: {
        'mocha/handle-done-callback': 'error',
        'mocha/no-exclusive-tests': 'error',
        'mocha/no-global-tests': 'error',
        '@cypress/dev/skip-comment': 'error',
      },
      overrides: [
        {
          files: '*.spec.tsx',
          parser: '@typescript-eslint/parser',
          plugins: ['@typescript-eslint', 'react'],
          rules: {
            'no-unused-vars': 'off', // avoid interface imports to be warned against
          },
        },
      ],
    },
    react: {
      env: {
        browser: true,
      },
      parser: 'babel-eslint',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
          legacyDecorators: true,
        },
      },
      plugins: ['react'],
      rules: {
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-pascal-case': 'error',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/no-unknown-property': 'error',
        'react/prefer-es6-class': 'error',
        'react/react-in-jsx-scope': 'error',
        'react/require-render-return': 'error',
        'react/jsx-filename-extension': 'error',
      },
    },
  },
  rules: {
    ...customRules,
  },
}
