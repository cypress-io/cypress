const customRules = require('./custom-rules')
const baseRules = {
  '@cypress/dev/arrow-body-multiline-braces': [
    'error',
    'always',
  ],
  'array-bracket-newline': [
    'error',
    'consistent',
  ],
  'array-bracket-spacing': [
    'error',
    'never',
  ],
  'arrow-parens': [
    'error',
    'always',
  ],
  'arrow-spacing': 'error',
  'block-spacing': 'error',
  'brace-style': [
    'error',
    '1tbs',
    {
      'allowSingleLine': false,
    },
  ],
  'function-paren-newline': [
    'error',
    'consistent',
  ],
  'comma-dangle': [
    'error',
    'always-multiline',
  ],
  'comma-spacing': 'error',
  'curly': [
    'error',
    'multi-line',
    'consistent',
  ],
  'constructor-super': 'error',
  'default-case': 'error',
  'eol-last': 'error',
  'eqeqeq': [
    'error',
    'allow-null',
  ],
  'indent': [
    'error',
    2,
    {
      // TODO: fix this, we shouldn't need to ignore TemplateLiterals
      'ignoredNodes': ['TemplateLiteral'],
      'SwitchCase': 1,
      'MemberExpression': 0,
    },
  ],
  'key-spacing': 'error',
  'keyword-spacing': 'error',
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
      'allowElseIf': false,
    },
  ],
  'no-empty': 'error',
  'no-empty-character-class': 'error',
  'no-empty-pattern': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-extra-semi': 'error',
  'no-fallthrough': 'error',
  'no-func-assign': 'error',
  'no-inner-declarations': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-mixed-spaces-and-tabs': 'error',
  'no-multiple-empty-lines': [
    'error',
    {
      'max': 1,
      'maxEOF': 0,
      'maxBOF': 0,
    },
  ],
  'no-multi-spaces': 'error',
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
  'no-trailing-spaces': 'error',
  'no-undef': 'error',
  'no-unexpected-multiline': 'error',
  'no-unneeded-ternary': 'error',
  'no-unreachable': 'error',
  'no-unused-labels': 'error',
  'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
  'no-useless-concat': 'error',
  'no-useless-constructor': 'error',
  'no-var': 'error',
  'no-whitespace-before-property': 'error',
  'object-curly-spacing': [
    'error',
    'always',
  ],
  'object-shorthand': 'error',
  'one-var': [
    'error',
    'never',
  ],
  'padded-blocks': ['error', 'never'],
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
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'prefer-template': 'error',
  'quotes': [
    'error',
    'single',
    {
      'allowTemplateLiterals': true,
    },
  ],
  'semi': [
    'error',
    'never',
  ],
  'semi-spacing': 'error',
  'space-before-blocks': 'error',
  'space-before-function-paren': 'error',
  'space-in-parens': [
    'error',
    'never',
  ],
  'space-infix-ops': 'error',
  'space-unary-ops': 'error',
  // TODO: change this back to 'error'
  'template-curly-spacing': 'off',
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
      plugins: [
        'json-format',
      ],
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
      rules: {
        ...baseRules,
      },
      overrides: [
        {
          files: [
            '*.jsx',
            '*.tsx',
          ],
          rules: {
            '@cypress/dev/arrow-body-multiline-braces': 'off',
          },
        },
        {
          files: [
            '*.ts',
            '*.tsx',
            '*.vue',
          ],
          parser: '@typescript-eslint/parser',
          plugins: [
            '@typescript-eslint',
            'import',
          ],
          rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'indent': 'off',
            'no-useless-constructor': 'off',
            'no-duplicate-imports': 'off',
            'import/no-duplicates': 'error',
            '@typescript-eslint/no-unused-vars': [
              'error',
              {
                'args': 'none',
                'ignoreRestSiblings': true,
                'argsIgnorePattern': '^_',
              },
            ],
            '@typescript-eslint/type-annotation-spacing': 'error',
            '@typescript-eslint/no-useless-constructor': [
              'error',
            ],
            '@typescript-eslint/member-delimiter-style': [
              'error',
              {
                'multiline': {
                  'delimiter': 'none',
                },
                'singleline': {
                  'delimiter': 'comma',
                },
              },
            ],
            '@typescript-eslint/indent': [
              'error',
              2,
              {
                'ignoredNodes': ['TemplateLiteral', 'TSTypeParameterInstantiation'],
                'SwitchCase': 1,
                'MemberExpression': 0,
              },
            ],
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
      overrides: [{
        files: '*.spec.tsx',
        parser: '@typescript-eslint/parser',
        plugins: [
          '@typescript-eslint',
          'react',
        ],
        rules: {
          'no-unused-vars': 'off', // avoid interface imports to be warned against
        },
      }],
    },
    react: {
      env: {
        browser: true,
      },
      parser: '@babel/eslint-parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        requireConfigFile: false,
        ecmaFeatures: {
          jsx: true,
          legacyDecorators: true,
        },
      },
      plugins: ['react'],
      rules: {
        'react/jsx-curly-spacing': 'error',
        'react/jsx-equals-spacing': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-pascal-case': 'error',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/jsx-wrap-multilines': 'error',
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
