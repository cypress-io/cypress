import { objectType } from 'nexus'
import { Editor } from './gql-Editor'

export const LocalSettings = objectType({
  name: 'LocalSettings',
  description: 'local settings on a device-by-device basis',
  definition (t) {
    t.list.nonNull.field('availableEditors', {
      type: Editor,
    })
  },
})
