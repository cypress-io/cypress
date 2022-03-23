import { objectType } from 'nexus'
import { LastBrowser } from './gql-LastBrowser'

export const ProjectPreferences = objectType({
  name: 'ProjectPreferences',
  description: 'Preferences specific to a project',
  definition (t) {
    t.string('testingType', {
      description: 'The preferred testing type to start in',
    })

    t.field('lastBrowser', {
      type: LastBrowser,
      description: 'The preferred browser to launch',
    })
  },
})
