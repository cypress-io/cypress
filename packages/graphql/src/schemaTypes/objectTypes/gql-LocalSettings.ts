import { objectType } from 'nexus'
import { Editor } from './gql-Editor'

export const LocalSettingsPreferences = objectType({
  name: 'LocalSettingsPreferences',
  description: 'local setting preferences',
  definition (t) {
    t.nonNull.boolean('autoScrollingEnabled')
    t.nonNull.boolean('watchForSpecChange')
    t.nonNull.boolean('useDarkSidebar')
  }
})

export const LocalSettings = objectType({
  name: 'LocalSettings',
  description: 'local settings on a device-by-device basis',
  definition (t) {
    t.list.nonNull.field('availableEditors', {
      type: Editor,
    })

    t.nonNull.field('preferences', {
      type: LocalSettingsPreferences,
    })
  },
})
