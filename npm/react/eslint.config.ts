import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'mocha/no-global-tests': 'off',
      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['.js', '.jsx', '.tsx'],
        },
      ],
    },
  },
]
