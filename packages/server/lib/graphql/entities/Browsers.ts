import { queryField, objectType, enumType, mutationField, nonNull, inputObjectType } from 'nexus'
import browsers from '@packages/server/lib/browsers'
import { projects } from '../../projects'

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

const AllBrowsersOutput = objectType({
  name: 'browsers',
  definition (t) {
    t.nonNull.list.field('all', {
      type: Browser,
    })

    t.field('current', {
      type: Browser,
    })
  },
})

export const allBrowsers = queryField((t) => {
  t.nonNull.field('browsers', {
    type: AllBrowsersOutput,
    async resolve (_root, args, ctx) {
      const all = await browsers.get()

      return {
        all,
        current: projects.currentBrowser as any, // types
      }
    },
  })
})

const SetBrowserInput = inputObjectType({
  name: 'SetBrowserInput',
  definition (t) {
    t.nonNull.string('path')
  },
})

export const setBrowser = mutationField((t) => {
  t.nonNull.field('setBrowser', {
    type: Browser,
    args: {
      input: nonNull(SetBrowserInput),
    },
    async resolve (_root, args, ctx) {
      return await projects.setBrowser(args.input) as any
    },
  })
})
