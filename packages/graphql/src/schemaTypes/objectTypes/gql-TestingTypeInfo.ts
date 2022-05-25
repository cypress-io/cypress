import { objectType } from 'nexus'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'

export const TestingTypeInfo = objectType({
  name: 'TestingTypeInfo',
  node: 'type',
  definition (t) {
    t.nonNull.field('type', {
      type: TestingTypeEnum,
    })

    t.nonNull.string('description')
    t.nonNull.string('title')
  },
})
