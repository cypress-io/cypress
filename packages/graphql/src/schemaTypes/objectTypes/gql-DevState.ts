import { intArg, list, nonNull, objectType, stringArg } from 'nexus'
import debugLib from 'debug'
import util from 'util'
import _ from 'lodash'

export const DevStateChange = objectType({
  name: 'DevStateChange',
  definition (t) {
    t.int('index', {
      description: 'The Array index in the list of state change patches',
    })

    t.nonNull.list.nonNull.field('changes', {
      type: DevStatePatch,
    })
  },
})

export const DevStatePatch = objectType({
  name: 'DevStatePatch',
  description: 'An immer patch',
  definition (t) {
    t.string('op')
    t.list.json('path')
    t.string('pathStr', {
      resolve: (o) => {
        return o.path.join('.')
      },
    })

    t.string('value', {
      args: {
        slice: intArg(),
      },
      resolve: (o, args) => {
        let val = ''

        try {
          val = JSON.stringify(o.value)
        } catch (e) {
          val = util.inspect(o.value)
        }
        if (args.slice) {
          return val.slice(0, args.slice)
        }

        return val
      },
    })

    t.json('valueJson', {
      resolve: (o) => {
        try {
          return JSON.parse(JSON.stringify(o.value))
        } catch (e) {
          return String(o.value)
        }
      },
    })
  },
})

export const DevState = objectType({
  name: 'DevState',
  description: 'State associated/helpful for local development of Cypress',
  definition (t) {
    t.json('coreData', {
      args: {
        pick: list(nonNull(stringArg())),
        omit: list(nonNull(stringArg())),
      },
      resolve: (source, args, ctx) => {
        const cache = new Set()

        function safe (key: string, value: any) {
          if (typeof value === 'object' && value !== null) {
            // Duplicate reference found, discard key
            if (cache.has(value)) return '[Circular]'

            // Store value in our collection
            cache.add(value)
          }

          return value
        }

        if (args.pick?.length) {
          return JSON.parse(JSON.stringify(_.pick(ctx.coreData, args.pick), safe))
        }

        return JSON.parse(JSON.stringify(_.omit(ctx.coreData, args.omit ?? []), safe))
      },
    })

    t.list.field('patches', {
      description: 'A list of state change "patches" via Immer, useful for debugging',
      type: DevStateChange,
      args: {
        afterIndex: intArg({ default: 0 }),
        last: intArg(),
      },
      resolve: (source, args, ctx) => {
        return ctx.dev.patches(args.afterIndex ?? 0, args.last)
      },
    })

    t.list.string('debugMatches', {
      resolve: () => debugLib.names.map((n) => n.source),
    })

    t.boolean('needsRelaunch', {
      description: 'When we have edited server related files, we may want to relaunch the client.',
      resolve (source, args, ctx) {
        return Boolean(source.refreshState)
      },
    })
  },
})
