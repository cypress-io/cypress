import { inputObjectType } from 'nexus'
import { SupportedBundlerEnum } from '../enumTypes/gql-WizardEnums'

export const WizardUpdateInput = inputObjectType({
  name: 'WizardUpdateInput',
  definition (t) {
    t.string('framework')

    t.field('bundler', {
      type: SupportedBundlerEnum,
    })
  },
})
