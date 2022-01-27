import { objectType } from 'nexus'
import { BrowserFamilyEnum } from '../enumTypes/gql-BrowserFamilyEnum'

export const Browser = objectType({
  name: 'Browser',
  description: 'Container representing a browser',
  node: (obj, args, ctx) => ctx.browser.idForBrowser(obj),
  definition (t) {
    t.nonNull.string('channel')
    t.nonNull.boolean('disabled', {
      resolve: () => false,
    })

    t.nonNull.boolean('isSelected', {
      resolve: (source, args, ctx) => ctx.browser.isSelected(source),
    })

    t.nonNull.string('displayName')
    t.nonNull.field('family', {
      type: BrowserFamilyEnum,
    })

    t.string('majorVersion')
    t.nonNull.string('name')
    t.nonNull.string('path')
    t.nonNull.string('version')
    t.nonNull.boolean('isFocusSupported', {
      resolve: (source, args, ctx) => ctx.browser.isFocusSupported(source),
    })
  },
  sourceType: {
    module: '@packages/types',
    export: 'FoundBrowser',
  },
})
