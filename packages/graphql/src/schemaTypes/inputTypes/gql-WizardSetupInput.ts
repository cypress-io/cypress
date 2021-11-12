import { inputObjectType } from 'nexus'
import { CodeLanguageEnum, FrontendFrameworkEnum, SupportedBundlerEnum } from '../enumTypes/gql-WizardEnums'

export const WizardSetupInput = inputObjectType({
  name: 'WizardSetupInput',
  definition (t) {
    t.nonNull.field('language', {
      type: CodeLanguageEnum,
    })

    t.nonNull.field('framework', {
      type: FrontendFrameworkEnum,
    })

    t.nonNull.field('bundler', {
      type: SupportedBundlerEnum,
    })
  },
})
