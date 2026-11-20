import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

/**
 * Opt-in linting for `gql` template literals, validated against
 * `@packages/data-context`'s schema. Spread it after `baseConfig`, whose `.vue`
 * processor it replaces: `export default [...baseConfig, ...graphqlConfig()]`.
 *
 * Files without a `gql` template pass through untouched.
 */
export const graphqlConfig = (): InfiniteDepthConfigWithExtends[] => {
  // Required on call rather than imported, so the packages that never lint
  // GraphQL don't load graphql-eslint, its own copy of graphql and the Vue SFC
  // compiler every time ESLint starts
  const { graphqlBlocks }: typeof import('./graphqlBlocks') = require('./graphqlBlocks')

  return graphqlBlocks
}
