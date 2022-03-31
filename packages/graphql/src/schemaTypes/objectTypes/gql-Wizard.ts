import { WizardBundler } from './gql-WizardBundler'
import { WizardFrontendFramework } from './gql-WizardFrontendFramework'
import { WizardNpmPackage } from './gql-WizardNpmPackage'
import { objectType } from 'nexus'
import { CODE_LANGUAGES } from '@packages/types'
import { WIZARD_BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import { WizardCodeLanguage } from './gql-WizardCodeLanguage'

export const Wizard = objectType({
  name: 'Wizard',
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
  definition (t) {
    t.nonNull.list.nonNull.field('allBundlers', {
      type: WizardBundler,
      description: 'All of the bundlers to choose from',
      resolve: () => Array.from(WIZARD_BUNDLERS),
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
      resolve: () => Array.from(WIZARD_FRAMEWORKS), // TODO(tim): fix this in nexus to accept Readonly
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

    t.nonNull.list.nonNull.field('packagesToInstall', {
      type: WizardNpmPackage,
      description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
      resolve: (source, args, ctx) => {
        return ctx.wizard.packagesToInstall().map(pkg => {
          return {
            name: pkg.dependency.name,
            package: pkg.dependency.package,
            description: pkg.dependency.description,
            minVersion: pkg.dependency.minVersion,
            detectedVersion: pkg.detectedVersion,
            satisfied: pkg.satisfied
          }
        })
      }
    })

    t.list.nonNull.string('installedPackages', {
      description: 'The list of packages to install that are currently installed',
      resolve: (source, args, ctx) => ctx.wizard.installedPackages()
    })

    t.string('installDependenciesCommand', {
      description: 'Command to install required command',
      resolve: (source, args, ctx) => ctx.wizard.installDependenciesCommand()
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
