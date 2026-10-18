import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

/**
 * Validates `gql` template literals against the Cypress GraphQL schema. It
 * reads every document in the GraphQL packages when called, so only call it
 * from the config of a package that uses `gql`.
 */
export function graphqlConfig (): InfiniteDepthConfigWithExtends[] {
  // Required on call so packages that never use GraphQL do not load its
  // plugin, graphql 16, pluck and the Vue SFC compiler on every ESLint start
  const { createGraphqlConfig }: typeof import('./graphqlBlocks') = require('./graphqlBlocks')

  return createGraphqlConfig()
}
