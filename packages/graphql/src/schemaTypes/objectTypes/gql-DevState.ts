import { intArg, objectType } from 'nexus'
import debugLib from 'debug'
import util from 'util'

export const Patch = objectType({
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
          return util.inspect(o.value)
        }
      },
    })
  },
})

export const DevState = objectType({
  name: 'DevState',
  description: 'State associated/helpful for local development of Cypress',
  definition (t) {
    t.list.list.field('patches', {
      type: Patch,
      resolve: (source, args, ctx) => {
        return ctx.patches
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

  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'DevStateShape',
  },
})
