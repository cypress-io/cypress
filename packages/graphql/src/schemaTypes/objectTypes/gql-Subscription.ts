import { subscriptionType } from 'nexus'
import { CurrentProject, Query } from '.'

export const Subscription = subscriptionType({
  definition (t) {
    t.field('authChange', {
      type: Query,
      description: 'Triggered when we have logged in / out of the application',
      subscribe (source, args, ctx) {
        return ctx.emitter.subscribeTo('authChange')
      },
      resolve () {
        return {}
      },
    })

    t.field('specsChanged', {
      type: CurrentProject,
      description: 'Triggered when we have added/removed specs from the project',
      subscribe (source, args, ctx) {
        return ctx.emitter.subscribeTo('specsChanged')
      },
      resolve (val, args, ctx) {
        if (ctx.coreData.currentProject) {
          return ctx.lifecycleManager
        }

        return null
      },
    })

    t.field('globalUpdate', {
      description: 'Triggered when we change the current project, add/remove from the project list',
      type: Query,
      subscribe (source, args, ctx) {
        return ctx.emitter.subscribeTo('globalUpdate')
      },
      resolve () {
        return {}
      },
    })

    t.field('projectUpdate', {
      type: CurrentProject,
      description: 'Triggered when the lifecyle of the project changes (loading state changes, etc.)',
      resolve: (val, args, ctx) => {
        if (ctx.coreData.currentProject) {
          return ctx.lifecycleManager
        }

        return null
      },
      subscribe (source, args, ctx) {
        return ctx.emitter.subscribeTo('projectUpdate')
      },
    })
  },
})
