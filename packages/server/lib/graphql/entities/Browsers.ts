import { queryField, objectType, enumType } from 'nexus'
import browsers from '@packages/server/lib/browsers'

const BrowserName = enumType({
  name: 'BrowserName',
  members: ['electron', 'chrome', 'chromium', 'firefox', 'edge'],
})

const BrowserChannel = enumType({
  name: 'BrowserChannel',
  members: ['stable', 'canary', 'beta', 'dev', 'nightly'],
})

const BrowserFamily = enumType({
  name: 'BrowserFamily',
  members: ['chromium', 'firefox'],
})

const Browser = objectType({
  name: 'Browser',
  definition (t) {
    t.nonNull.field('name', {
      type: BrowserName,
    })

    t.nonNull.field('family', {
      type: BrowserFamily,
    })

    t.nonNull.field('channel', {
      type: BrowserChannel,
    })

    t.int('majorVersion')
    t.int('minSupportedVersion')
    t.nonNull.string('displayName')
    t.nonNull.string('version')
    t.nonNull.string('path')
  },
})

export const allBrowsers = queryField((t) => {
  t.nonNull.list.field('browsers', {
    type: Browser,
    async resolve (_root, args, ctx) {
      return await browsers.get()
    },
  })
})
