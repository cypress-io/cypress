import { nonNull, objectType } from 'nexus'
import { WizardSetupInput } from '../inputTypes/gql-WizardSetupInput'
import { WizardSampleConfigFile } from './gql-WizardSampleConfigFile'

export const Wizard = objectType({
  name: 'Wizard',
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
  definition (t) {
    t.list.nonNull.field('sampleConfigFiles', {
      type: WizardSampleConfigFile,
      args: {
        input: nonNull(WizardSetupInput),
      },
      description: 'Set of sample configuration files based bundler, framework and language of choice',
      resolve: (source, args, ctx) => ctx.wizard.sampleConfigFiles(args.input),
    })

    t.string('sampleTemplate', {
      args: {
        input: nonNull(WizardSetupInput),
      },
      description: 'IndexHtml file based on bundler and framework of choice',
      resolve: (source, args, ctx) => ctx.wizard.sampleTemplate(args.input),
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
