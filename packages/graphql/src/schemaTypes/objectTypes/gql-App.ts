import { objectType } from 'nexus'

export const App = objectType({
  name: 'App',
  description: 'Namespace for information related to the app',
  definition (t) {
    t.nonNull.boolean('isInGlobalMode', {
      description: 'Whether the app is in global mode or not',
      resolve: (source, args, ctx) => {
        return ctx.app.isGlobalMode
      },
    })

    t.nonNull.boolean('isAuthBrowserOpened', {
      description: 'Whether the browser has been opened for auth or not',
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'AppDataShape',
  },
})
