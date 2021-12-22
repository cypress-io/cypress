import { WizardBundler } from './gql-WizardBundler'
import { WizardFrontendFramework } from './gql-WizardFrontendFramework'
import { WizardNpmPackage } from './gql-WizardNpmPackage'
import { objectType } from 'nexus'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS } from '@packages/types'
import { WizardCodeLanguage } from './gql-WizardCodeLanguage'

export const Wizard = objectType({
  name: 'Wizard',
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
  definition (t) {
    t.nonNull.list.nonNull.field('allBundlers', {
      type: WizardBundler,
      description: 'All of the bundlers to choose from',
      resolve: () => Array.from(BUNDLERS),
    })

    t.field('bundler', {
      type: WizardBundler,
      resolve: (source, args, ctx) => ctx.wizard.chosenBundler ?? null,
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
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
