import type { Linter } from 'eslint'

/**
 * A block that gives `files` a project service and turns on `rules`. The
 * blocks built here take the same `files` in every workspace, so they share
 * one TypeScript program; keep `files` narrow, since type-aware parsing is
 * what makes lint slower.
 */
const typeAwareConfig = (files: string[], rules: Linter.RulesRecord): Linter.Config => {
  return {
    files,
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      ...rules,
      // With type information this rule type-checks every operand for a Vue
      // `Ref`, and no workspace that opts in here is a Vue package
      'vue/no-ref-as-operand': 'off',
    },
  }
}

/**
 * Reports promises that are neither awaited, returned nor handled, which
 * reject unobserved. Add the block it returns after `baseConfig`, scoped to
 * the TypeScript files the workspace's `tsconfig.json` covers.
 */
export const noFloatingPromisesConfig = (files: string[]): Linter.Config => {
  return typeAwareConfig(files, {
    '@typescript-eslint/no-floating-promises': 'error',
  })
}

/**
 * Reports a promise passed where nothing awaits it: an async callback handed
 * to an emitter, socket or HTTP handler that ignores its return value, or a
 * promise used as a condition. Pass the same `files` as
 * `noFloatingPromisesConfig`.
 */
export const noMisusedPromisesConfig = (files: string[]): Linter.Config => {
  return typeAwareConfig(files, {
    '@typescript-eslint/no-misused-promises': 'error',
  })
}
