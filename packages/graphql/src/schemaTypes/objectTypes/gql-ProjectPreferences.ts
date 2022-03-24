import { objectType } from 'nexus'

export const ProjectPreferences = objectType({
  name: 'ProjectPreferences',
  description: 'Preferences specific to a project',
  definition (t) {
    t.string('testingType', {
      description: 'The preferred testing type to start in',
    })
  },
})
