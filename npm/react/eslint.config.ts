import { baseConfig } from '@packages/eslint-config'

// Root config files outside tsconfig may use the default project (no ** globs allowed).
const allowDefaultProject = [
  'babel.config.js',
  'cypress.config.js',
  'eslint.config.ts',
  'rollup.config.mjs',
  'vite.config.ts',
]

// Only enable projectService for files in tsconfig or allowDefaultProject so cypress/** is linted without type-aware rules.
const projectServiceFiles = [
  'src/**/*.ts',
  'babel.config.js',
  'cypress.config.js',
  'eslint.config.ts',
  'rollup.config.mjs',
  'vite.config.ts',
]

export default [
  { ignores: ['**/dist', '**/*.d.ts', '**/package-lock.json', '**/tsconfig.json', '**/cypress/fixtures'] },
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'mocha/no-global-tests': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: projectServiceFiles,
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: {
          allowDefaultProject,
        },
      },
    },
  },
  {
    files: ['cypress/**/*.js', 'cypress/**/*.ts', 'cypress/**/*.jsx', 'cypress/**/*.tsx'],
    languageOptions: {
      globals: {
        Cypress: 'readonly',
        cy: 'readonly',
        expect: 'readonly',
      },
    },
  },
]
