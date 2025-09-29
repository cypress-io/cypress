import { objectType } from 'nexus'

export const WizardErroredFramework = objectType({
  name: 'WizardErroredFramework',
  description: 'Represents a Framework Definition that failed to load when detected',
  node: 'path',
  definition (t) {
    t.string('path', {
      description: `The location of the framework's package.json file`,
    })
  },
})
