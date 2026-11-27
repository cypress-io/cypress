import { baseConfig, jsonConfig, reactConfig, regexpConfig } from '@packages/eslint-config'

// Root config files outside tsconfig may use the default project (no ** globs allowed).
const allowDefaultProject = [
  'babel.config.js',
  'cypress.config.ts',
  'eslint.config.ts',
  'rollup.config.mjs',
  'vite.config.ts',
]

// Only enable projectService for files in tsconfig or allowDefaultProject so cypress/** is linted without type-aware rules.
const projectServiceFiles = [
  'src/**/*.ts',
  'babel.config.js',
  'cypress.config.ts',
  'eslint.config.ts',
  'rollup.config.mjs',
  'vite.config.ts',
]

export default [
  { ignores: ['**/dist', '**/*.d.ts', '**/package-lock.json', '**/tsconfig.json', '**/cypress/fixtures'] },
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  reactConfig(['**/*.{js,jsx,ts,tsx}']),
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'mocha/no-top-level-tests': 'off',
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
