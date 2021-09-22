import { objectType } from 'nexus'
import { PACKAGES_DESCRIPTIONS } from '../constants/wizardConstants'

export const WizardNpmPackage = objectType({
  name: 'WizardNpmPackage',
  description: 'Details about an NPM Package listed during the wizard install',
  node: (source) => source,
  definition (t) {
    t.nonNull.string('name', {
      description: 'The package name that you would npm install',
      resolve: (source) => source,
    })

    t.nonNull.string('description', {
      resolve: (source) => {
        return PACKAGES_DESCRIPTIONS[source]
      },
    })
  },
  sourceType: {
    module: '@packages/graphql/src/constants',
    export: 'NpmPackages',
  },
})
