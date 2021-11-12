import { inputObjectType } from 'nexus'
import { SupportedBundlerEnum } from '../enumTypes/gql-WizardEnums'

export const WizardUpdateInput = inputObjectType({
  name: 'WizardUpdateInput',
  definition (t) {
    t.field('bundler', {
      type: SupportedBundlerEnum,
    })
  },
})
