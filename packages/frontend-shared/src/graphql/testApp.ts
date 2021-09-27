import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'

export const app: CodegenTypeMap['App'] = {
  __typename: 'App',
  healthCheck: 'OK',
  isInGlobalMode: false,
  projects: [],
}
