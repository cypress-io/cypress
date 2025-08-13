import { baseConfig } from '@packages/eslint-config'

const allowDefaultProject = ['cypress.config.ts', 'eslint.config.ts', 'support/index.js']

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject,
        },
      },
    },
  },
]
