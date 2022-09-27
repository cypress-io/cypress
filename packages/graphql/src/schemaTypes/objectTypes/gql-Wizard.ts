import { WizardBundler } from './gql-WizardBundler'
import { WizardFrontendFramework } from './gql-WizardFrontendFramework'
import { WizardNpmPackage } from './gql-WizardNpmPackage'
import { objectType } from 'nexus'
import { WIZARD_BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'

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
      resolve: (source, args, ctx) => ctx.coreData.wizard.chosenBundler ?? null,
    })

    t.field('framework', {
      type: WizardFrontendFramework,
      resolve: (source, args, ctx) => ctx.coreData.wizard.chosenFramework ?? null,
    })

    t.nonNull.list.nonNull.field('frameworks', {
      type: WizardFrontendFramework,
      description: 'All of the component testing frameworks to choose from',
      resolve: () => Array.from(WIZARD_FRAMEWORKS), // TODO(tim): fix this in nexus to accept Readonly
    })

    t.nonNull.list.nonNull.field('packagesToInstall', {
      type: WizardNpmPackage,
      description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
      resolve: async (source, args, ctx) => {
        return (await ctx.wizard.packagesToInstall()).map((pkg) => {
          return {
            name: pkg.dependency.name,
            package: pkg.dependency.package,
            description: pkg.dependency.description,
            minVersion: pkg.dependency.minVersion,
            detectedVersion: pkg.detectedVersion,
            satisfied: pkg.satisfied,
          }
        })
      },
    })

    t.string('installDependenciesCommand', {
      description: 'Command to install required command',
      resolve: (source, args, ctx) => ctx.wizard.installDependenciesCommand(),
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'WizardDataShape',
  },
})
