import { objectType } from 'nexus'

export const WizardErroredFramework = objectType({
  name: 'WizardErroredFramework',
  description: '',
  node: 'path',
  definition (t) {
    t.string('name', {
      description: 'The display name of the framework',
    }),

    t.string('path', {
      description: 'The location of the framework\'s package.json file',
    }),

    t.string('reason', {
      description: 'The reason for the error',
    })
  },
})
