import type { Linter } from 'eslint'

/**
 * Reports promises that are neither awaited, returned nor handled, which
 * reject unobserved. Add the block it returns after `baseConfig`, scoped to
 * the TypeScript files the workspace's `tsconfig.json` covers. The rule needs type
 * information, so these files get a project service; keep `files` narrow,
 * since type-aware parsing is what makes lint slower.
 */
export const noFloatingPromisesConfig = (files: string[]): Linter.Config => {
  return {
    files,
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      // With type information this rule type-checks every operand for a Vue
      // `Ref`, and no workspace that opts in here is a Vue package
      'vue/no-ref-as-operand': 'off',
    },
  }
}
