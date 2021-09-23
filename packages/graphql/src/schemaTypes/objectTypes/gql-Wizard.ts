import { TestingTypeInfo } from './gql-TestingTypeInfo'
import { WizardBundler } from './gql-WizardBundler'
import { WizardFrontendFramework } from './gql-WizardFrontendFramework'
import { WizardNpmPackage } from './gql-WizardNpmPackage'
import { arg, nonNull, objectType } from 'nexus'
import { BUNDLERS, FRONTEND_FRAMEWORKS, TESTING_TYPES } from '@packages/types'
import { TestingTypeEnum, WizardCodeLanguageEnum, WizardStepEnum } from '../enumTypes/gql-WizardEnums'

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
    })

    t.nonNull.boolean('chosenTestingTypePluginsInitialized', {
      description: 'Whether the plugins for the selected testing type has been initialized',
      resolve: (source, args, ctx) => {
        return ctx.wizard.chosenTestingTypePluginsInitialized
      },
    })

    t.nonNull.boolean('canNavigateForward', {
      description: 'Given the current state, returns whether the user progress to the next step of the wizard',
      resolve: (source, args, ctx) => ctx.wizard.canNavigateForward,
    })

    t.string('description', {
      description: 'The title of the page, given the current step of the wizard',
    })

    t.field('framework', {
      type: WizardFrontendFramework,
      resolve: (source) => FRONTEND_FRAMEWORKS.find((f) => f.type === source.chosenFramework) ?? null,
    })

    t.nonNull.list.nonNull.field('frameworks', {
      type: WizardFrontendFramework,
      description: 'All of the component testing frameworks to choose from',
      resolve: () => Array.from(FRONTEND_FRAMEWORKS), // TODO(tim): fix this in nexus to accept Readonly
    })

    t.nonNull.boolean('isManualInstall', {
      description: 'Whether we have chosen manual install or not',
      resolve: (source) => source.chosenManualInstall,
    })

    t.list.nonNull.field('packagesToInstall', {
      type: WizardNpmPackage,
      description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
      resolve: (source, args, ctx) => ctx.wizard.packagesToInstall(),
    })

    t.string('sampleCode', {
      description: 'Configuration file based on bundler and framework of choice',
      args: {
        lang: arg({
          type: nonNull(WizardCodeLanguageEnum),
          default: 'js',
        }),
      },
      resolve: (source, args, ctx) => ctx.wizard.sampleCode(args.lang),
    })

    t.nonNull.field('step', {
      type: WizardStepEnum,
      resolve: (source) => source.currentStep,
    })

    t.field('testingType', {
      type: TestingTypeEnum,
      description: 'The testing type we are setting in the wizard, null if this has not been chosen',
    })

    t.nonNull.list.nonNull.field('testingTypes', {
      type: TestingTypeInfo,
      resolve: () => Array.from(TESTING_TYPES),
    })

    t.string('title', { description: 'The title of the page, given the current step of the wizard' })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
