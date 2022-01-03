import { subscriptionType } from 'nexus'
import { CurrentProject, Query } from '.'

export const Subscription = subscriptionType({
  definition (t) {
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
