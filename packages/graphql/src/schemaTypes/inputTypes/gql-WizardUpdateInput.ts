import { inputObjectType } from 'nexus'
import { CodeLanguageEnum, FrontendFrameworkEnum, SupportedBundlerEnum } from '../enumTypes/gql-WizardEnums'

export const WizardUpdateInput = inputObjectType({
  name: 'WizardUpdateInput',
  definition (t) {
    t.field('framework', {
      type: FrontendFrameworkEnum,
    })

    t.field('bundler', {
      type: SupportedBundlerEnum,
    })

    t.field('codeLanguage', {
      type: CodeLanguageEnum,
    })
  },
})
