import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

/**
 * Enables the type-aware rules that `tslint` used to enforce. Building a
 * TypeScript program is the expensive part of linting, so callers pass the
 * narrowest set of source globs that needs the coverage rather than applying
 * this across a whole package.
 */
export const typeCheckedConfig = (files: string[]): InfiniteDepthConfigWithExtends[] => [
  {
    files,
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
]
