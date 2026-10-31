/* Rule overrides shared by the Vue frontend packages: app, launchpad and frontend-shared */
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

// Spread after `baseConfig`. A later `.vue` block that sets
// `@typescript-eslint/no-restricted-imports` replaces these options rather
// than merging with them, so add any new pattern here instead.
// The rule stays on `.vue` files: some `.ts` modules, like the urql client,
// import browser-safe values from data-context on purpose.
export const frontendOverrides = [
  {
    files: ['**/*.vue'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@packages/data-context', '@packages/data-context/*'],
            allowTypeImports: true,
            message: 'data-context is server-side; a Vue component may only borrow its types.',
          },
        ],
      }],
    },
  },
] satisfies InfiniteDepthConfigWithExtends[]
