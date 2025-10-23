import { baseConfig } from '@packages/eslint-config'

const allowDefaultProject = ['cypress.config.ts', 'eslint.config.ts', 'support/index.js', 'vitest.config.ts']

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: {
          allowDefaultProject,
        },
      },
    },
  },
]
