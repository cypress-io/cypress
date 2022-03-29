import { subscriptionType } from 'nexus'
import { CurrentProject, DevState, Query } from '.'
import type { NexusGenFieldTypes } from '../../gen/nxs.gen'

export const Subscription = subscriptionType({
  definition (t) {
    t.field('authChange', {
      type: Query,
      description: 'Triggered when the auth state changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('authChange'),
      resolve: (source, args, ctx) => ({}),
    })

    t.field('devChange', {
      type: DevState,
      description: 'Issued for internal development changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('devChange'),
      resolve: (source, args, ctx) => ctx.coreData.dev,
    })

    t.field('cloudViewerChange', {
      type: Query,
      description: 'Triggered when there is a change to the info associated with the cloud project (org added, project added)',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('cloudViewerChange'),
      resolve: (source, args, ctx) => {
        return {
          requestPolicy: 'network-only',
        }
      },
    })

    t.field('browserStatusChange', {
      type: CurrentProject,
      description: 'Status of the currently opened browser',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('browserStatusChange'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })

    t.field('specsChange', {
      type: CurrentProject,
      description: 'Issued when the watched specs for the project changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('specsChange'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })

    t.field('versionsResolved', {
      description: 'When we resolve the version info, triggered if it took longer than the timeout',
      type: Query,
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('versionsResolved'),
      resolve: (source: NexusGenFieldTypes['Query']) => source,
    })

    t.field('cloudProjectChange', {
      description: 'When the cloud project associated with the current project has changed',
      type: CurrentProject,
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('cloudProjectChange'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })

    t.field('currentProjectChange', {
      description: 'When direct attributes (branch, loading, etc) change on the current project',
      type: CurrentProject,
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('currentProjectChange'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })
  },
})
