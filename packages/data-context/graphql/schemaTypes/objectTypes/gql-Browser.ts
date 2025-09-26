import { objectType } from 'nexus'
import { BrowserFamilyEnum } from '../enumTypes/gql-BrowserFamilyEnum'

export const Browser = objectType({
  name: 'Browser',
  description: 'Container representing a browser',
  node: (obj, args, ctx) => ctx.browser.idForBrowser(obj),
  definition (t) {
    t.nonNull.string('channel')
    t.boolean('disabled')

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
    t.string('warning')
    t.nonNull.boolean('isFocusSupported', {
      resolve: (source, args, ctx) => ctx.browser.isFocusSupported(source),
    })

    t.nonNull.boolean('isVersionSupported', {
      resolve: (source, args, ctx) => ctx.browser.isVersionSupported(source),
    })
  },
  sourceType: {
    module: '@packages/types',
    export: 'FoundBrowser',
  },
})
