import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'
import { app } from './testApp'
import { wizard } from './testWizard'

export const query: CodegenTypeMap['Query'] = {
  __typename: 'Query',
  app,
  wizard,
}
