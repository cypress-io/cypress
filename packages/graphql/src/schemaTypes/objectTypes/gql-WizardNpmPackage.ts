import { objectType } from 'nexus'

export const WizardNpmPackage = objectType({
  name: 'WizardNpmPackage',
  description: 'Details about an NPM Package listed during the wizard install',
  node: 'name',
  definition (t) {
    t.nonNull.string('name', {
      description: 'The package name that you would npm install',
    })

    t.nonNull.string('description')
    t.nonNull.string('package')
  },
})
