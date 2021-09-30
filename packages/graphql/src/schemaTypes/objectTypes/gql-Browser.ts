import { objectType, stringArg } from 'nexus'
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

    t.string('majorVersion', {
      args: {
        prefix: stringArg(),
      },
      resolve: (source, args) => {
        if (args.prefix && source.majorVersion) {
          return `${args.prefix}${source.majorVersion}`
        }

        return source.majorVersion ?? null
      },
    })

    t.nonNull.string('name')
    t.nonNull.string('path')
    t.nonNull.string('version')
  },
  sourceType: {
    module: '@packages/types',
    export: 'FoundBrowser',
  },
})
