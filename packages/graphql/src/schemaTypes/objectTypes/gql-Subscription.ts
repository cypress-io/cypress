import type { RequestPolicy } from '@urql/core'
import { list, subscriptionType } from 'nexus'
import { CurrentProject, DevState, Query } from '.'
import { Spec } from './gql-Spec'

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
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('cloudViewerChange', false),
      resolve: (source: { requestPolicy: RequestPolicy }, args, ctx) => {
        return {
          onCacheUpdate: () => {
            ctx.emitter.cloudViewerChange({ requestPolicy: 'cache-only' })
          },
          ...source,
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

    t.field('gitInfoChange', {
      type: list(Spec),
      description: 'When the git info has refreshed for some or all of the specs, we fire this event with the specs updated',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('gitInfoChange'),
      resolve: (absolutePaths: string[] | undefined, args, ctx) => {
        // Send back the git info for all specs on subscribe
        if (absolutePaths === undefined) {
          return ctx.project.specs
        }

        const pathsToSend = new Set(absolutePaths)

        return ctx.project.specs.filter((s) => pathsToSend.has(s.absolute))
      },
    })

    t.field('branchChange', {
      type: CurrentProject,
      description: 'Issued when the current branch of a project changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('branchChange'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })
  },
})
