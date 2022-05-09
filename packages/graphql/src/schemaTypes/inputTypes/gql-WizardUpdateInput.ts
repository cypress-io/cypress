import { inputObjectType } from 'nexus'
import { FrontendFrameworkEnum, SupportedBundlerEnum } from '../enumTypes/gql-WizardEnums'

export const WizardUpdateInput = inputObjectType({
  name: 'WizardUpdateInput',
  definition (t) {
    t.field('framework', {
      type: FrontendFrameworkEnum,
    })

    t.field('bundler', {
      type: SupportedBundlerEnum,
    })
  },
})
