import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'
import { stubApp } from './testApp'
import { stubWizard } from './testWizard'

export const stubQuery: CodegenTypeMap['Query'] = {
  __typename: 'Query',
  app: stubApp,
  wizard: stubWizard,
}
