import { TestingTypeInfo } from './gql-TestingTypeInfo'
import { WizardBundler } from './gql-WizardBundler'
import { WizardFrontendFramework } from './gql-WizardFrontendFramework'
import { WizardNpmPackage } from './gql-WizardNpmPackage'
import { objectType } from 'nexus'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS, TESTING_TYPES } from '@packages/types'
import { TestingTypeEnum, WizardStepEnum } from '../enumTypes/gql-WizardEnums'
import { WizardCodeLanguage } from './gql-WizardCodeLanguage'
import { WizardSampleConfigFile } from './gql-WizardSampleConfigFile'

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
      resolve: (source, args, ctx) => ctx.wizard.description ?? null,
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

    t.nonNull.boolean('isManualInstall', {
      description: 'Whether we have chosen manual install or not',
      resolve: (source) => source.chosenManualInstall,
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

    t.nonNull.field('step', {
      type: WizardStepEnum,
      resolve: (source) => source.currentStep,
    })

    t.field('testingType', {
      type: TestingTypeEnum,
      description: 'The testing type we are setting in the wizard, null if this has not been chosen',
      resolve: (source) => source.chosenTestingType,
    })

    t.nonNull.list.nonNull.field('testingTypes', {
      type: TestingTypeInfo,
      resolve: () => Array.from(TESTING_TYPES),
    })

    t.string('title', {
      description: 'The title of the page, given the current step of the wizard',
      resolve: (source, args, ctx) => ctx.wizard.title ?? null,
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
