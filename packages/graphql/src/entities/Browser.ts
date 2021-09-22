import { objectType } from 'nexus'
import { BrowserFamilyEnum } from '../constants'

export const Browser = objectType({
  name: 'Browser',
  description: 'Container representing a browser',
  node: (obj) => `${obj.name}-${obj.version}-${obj.displayName}`,
  definition (t) {
    t.nonNull.string('channel')
    t.nonNull.boolean('disabled', {
      resolve: () => false,
    })

    t.nonNull.string('displayName')
    t.nonNull.field('family', {
      type: BrowserFamilyEnum,
    })

    t.string('majorVersion')
    t.nonNull.string('name')
    t.nonNull.string('path')
    t.nonNull.string('version')
  },
  sourceType: {
    module: '@packages/types',
    export: 'FoundBrowser',
  },
})
