import { buildClientSchema, GraphQLObjectType } from 'graphql'
import schemaForTests from '../generated/schema-for-tests.gen.json'
import { stubMutation } from './testMutation'
import { stubQuery } from './testQuery'

// @ts-expect-error - for some reason the JSON type isn't strict enough
export const clientTestSchema = buildClientSchema(schemaForTests, { assumeValid: true })

const mutationType = clientTestSchema.getMutationType() as GraphQLObjectType
const mutationFields = mutationType.getFields()

for (const [fieldName, definition] of Object.entries(mutationFields)) {
  definition.resolve = typeof stubMutation[fieldName] === 'function' ? stubMutation[fieldName] : definition.resolve
}

const queryType = clientTestSchema.getMutationType() as GraphQLObjectType
const queryFields = queryType.getFields()

for (const [fieldName, definition] of Object.entries(queryFields)) {
  definition.resolve = typeof stubQuery[fieldName] === 'function' ? stubQuery[fieldName] : definition.resolve
}
