import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  {
    // Lint only files at the repo root. Every workspace lints itself, and
    // lint-staged routes a workspace's files to its own config. The agent
    // settings files at the top of `.claude/` and `.cursor/` belong to no
    // workspace, so they are linted here too.
    ignores: [
      '*/',
      '!.claude/',
      '.claude/*/',
      '!.cursor/',
      '.cursor/*/',
    ],
  },
  ...baseConfig,
  ...jsonConfig,
  {
    // Root scripts and tool configs all run in Node
    files: ['*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
