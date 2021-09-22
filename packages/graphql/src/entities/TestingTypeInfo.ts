import { objectType } from 'nexus'
import { TestingTypeDescriptions, TestingTypeEnum, TestingTypeNames } from '../constants'

export const TestingTypeInfo = objectType({
  name: 'TestingTypeInfo',
  node: (source) => source,
  definition (t) {
    t.nonNull.field('type', {
      type: TestingTypeEnum,
      resolve: (source) => source,
    })

    t.nonNull.string('description', {
      resolve: (source) => TestingTypeDescriptions[source],
    })

    t.nonNull.string('title', {
      resolve: (source) => TestingTypeNames[source],
    })
  },
  sourceType: {
    module: '@packages/graphql/src/constants',
    export: 'TestingType',
  },
})
