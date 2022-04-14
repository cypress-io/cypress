import { buildClientSchema } from 'graphql'
import schemaForTests from '../../../src/generated/schema-for-tests.gen.json'

// @ts-expect-error - for some reason the JSON type isn't strict enough
export const clientTestSchema = buildClientSchema(schemaForTests, { assumeValid: true })
