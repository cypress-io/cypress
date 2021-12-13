import _ from 'lodash'
import { objectType } from 'nexus'

export const DevState = objectType({
  name: 'DevState',
  description: 'State associated/helpful for local development of Cypress',
  definition (t) {
    t.json('state', {
      description: 'For debugging, the current application state',
      resolve: (source, args, ctx) => {
        function replacer (key: string, val: unknown) {
          if (val && !Array.isArray(val) && _.isObject(val) && !_.isPlainObject(val)) {
            return `[${val.constructor.name}]`
          }

          return val
        }

        return {
          coreData: JSON.parse(JSON.stringify(ctx.coreData, replacer)),
          modeOptions: ctx.modeOptions,
        }
      },
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
