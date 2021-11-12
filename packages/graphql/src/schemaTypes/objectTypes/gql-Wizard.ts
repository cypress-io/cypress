import { WizardFrontendFramework } from './gql-WizardFrontendFramework'
import { WizardNpmPackage } from './gql-WizardNpmPackage'
import { objectType } from 'nexus'
import { CODE_LANGUAGES, FRONTEND_FRAMEWORKS } from '@packages/types'
import { WizardCodeLanguage } from './gql-WizardCodeLanguage'
import { WizardSampleConfigFile } from './gql-WizardSampleConfigFile'

export const Wizard = objectType({
  name: 'Wizard',
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
  definition (t) {
    t.nonNull.boolean('currentTestingTypePluginsInitialized', {
      description: 'Whether the plugins for the selected testing type has been initialized',
      resolve: (source, args, ctx) => {
        return ctx.wizard.currentTestingTypePluginsInitialized
      },
    })

    t.field('framework', {
      type: WizardFrontendFramework,
      resolve: (source, args, ctx) => ctx.wizard.chosenFramework ?? null,
    })

    t.nonNull.list.nonNull.field('frameworks', {
      type: WizardFrontendFramework,
      description: 'All of the component testing frameworks to choose from',
      resolve: () => Array.from(FRONTEND_FRAMEWORKS), // TODO(tim): fix this in nexus to accept Readonly
    })

    t.field('language', {
      type: WizardCodeLanguage,
      resolve: (source, args, ctx) => ctx.wizard.chosenLanguage ?? null,
    })

    t.nonNull.list.nonNull.field('allLanguages', {
      type: WizardCodeLanguage,
      description: 'All of the languages to choose from',
      resolve: () => Array.from(CODE_LANGUAGES), // TODO(tim): fix this in nexus to accept Readonly
    })

    t.list.nonNull.field('packagesToInstall', {
      type: WizardNpmPackage,
      description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
      resolve: (source, args, ctx) => ctx.wizard.packagesToInstall(),
    })

    t.list.nonNull.field('sampleConfigFiles', {
      type: WizardSampleConfigFile,
      description: 'Set of sample configuration files based bundler, framework and language of choice',
      resolve: (source, args, ctx) => ctx.wizard.sampleConfigFiles(),
    })

    t.string('sampleTemplate', {
      description: 'IndexHtml file based on bundler and framework of choice',
      resolve: (source, args, ctx) => ctx.wizard.sampleTemplate(),
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
