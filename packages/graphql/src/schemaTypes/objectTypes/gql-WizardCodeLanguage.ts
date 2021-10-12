import { objectType } from 'nexus'
import { CodeLanguageEnum } from '../enumTypes/gql-WizardEnums'

export const WizardCodeLanguage = objectType({
  name: 'WizardCodeLanguage',
  description: 'A code language that the user can choose from to create their cypress.config',
  node: 'type',
  definition (t) {
    t.nonNull.field('type', {
      type: CodeLanguageEnum,
      description: 'The key of the language',
    })

    t.nonNull.boolean('isSelected', {
      description: 'Whether this is the selected language in the wizard',
      resolve: (source, args, ctx) => ctx.wizardData.chosenLanguage === source.type,
    })

    t.nonNull.string('name', {
      description: 'The name of the language',
    })
  },
  sourceType: {
    module: '@packages/types',
    export: 'CodeLanguage',
  },
})
