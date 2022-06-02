import { objectType } from 'nexus'

export const WizardNpmPackage = objectType({
  name: 'WizardNpmPackage',
  description: 'Details about an NPM Package listed during the wizard install',
  node: 'name',
  definition (t) {
    t.nonNull.string('name', {
      description: 'The package name that you would npm install',
    })

    t.nonNull.string('description', {
      description: 'Short description about the purpose of the package',
    })

    t.nonNull.string('package', {
      description: 'Name of the package on npm',
    })

    t.string('detectedVersion', {
      description: 'Version of the package the user has installed',
    })

    t.nonNull.string('minVersion', {
      description: 'Minimum version of the package that Cypress works with',
    })

    t.nonNull.boolean('satisfied', {
      description: 'If the package is installed, does the version satisfy Cypress minimum requirements',
    })
  },
})
