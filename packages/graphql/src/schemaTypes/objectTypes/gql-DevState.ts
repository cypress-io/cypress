import { objectType } from 'nexus'

export const DevState = objectType({
  name: 'DevState',
  description: 'State associated/helpful for local development of Cypress',
  definition (t) {
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
