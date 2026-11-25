import { baseConfig, jsonConfig, nodeConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

const allowDefaultProject = ['cypress.config.ts', 'eslint.config.ts', 'support/index.js', 'vitest.config.ts']

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...vitestConfig,
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
