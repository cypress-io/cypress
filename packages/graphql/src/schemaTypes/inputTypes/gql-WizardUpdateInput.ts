import { inputObjectType } from 'nexus'
import { TestingTypeEnum, WizardNavigateDirectionEnum } from '../enumTypes/gql-WizardEnums'

export const WizardUpdateInput = inputObjectType({
  name: 'WizardUpdateInput',
  definition (t) {
    t.field('testingType', {
      type: TestingTypeEnum,
    })

    t.field('direction', {
      type: WizardNavigateDirectionEnum,
    })
  },
})
