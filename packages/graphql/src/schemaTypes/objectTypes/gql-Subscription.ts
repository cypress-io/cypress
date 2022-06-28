import type { PushFragmentData } from '@packages/data-context/src/actions'
import { list, nonNull, objectType, stringArg, subscriptionType } from 'nexus'
import { CurrentProject, DevState, Query } from '.'
import { Spec } from './gql-Spec'

export const Subscription = subscriptionType({
  definition (t) {
    t.field('authChange', {
      type: Query,
      description: 'Triggered when the auth state changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('authChange', { sendInitial: false }),
      resolve: (source, args, ctx) => {
        return {
          requestPolicy: 'network-only',
        } as const
      },
    })

    t.field('errorWarningChange', {
      type: Query,
      description: 'Triggered when the base error or warning state changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('errorWarningChange'),
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
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('cloudViewerChange', { sendInitial: false }),
      resolve: (source, args, ctx) => {
        return {
          requestPolicy: 'network-only',
        } as const
      },
    })

    t.field('browserStatusChange', {
      type: CurrentProject,
      description: 'Status of the currently opened browser',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('browserStatusChange'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })

    t.field('configChange', {
      type: CurrentProject,
      description: 'Issued when cypress.config.js is re-executed due to a change',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('configChange'),
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

    t.nonNull.field('pushFragment', {
      description: 'When we have resolved a section of a query, and want to update the local normalized cache, we "push" the fragment to the frontend to merge in the client side cache',
      type: list(nonNull(objectType({
        name: 'PushFragmentPayload',
        definition (t) {
          t.nonNull.string('target')
          t.nonNull.json('fragment')
          t.json('data', {
            description: 'Raw data associated with the fragment to be written into the cache',
          })

          t.json('variables', {
            description: 'Variables associated with the fragment',
          })

          t.json('errors', {
            description: 'Any errors encountered when executing the operation',
          })

          t.boolean('invalidateCache', {
            description: 'If present, indicates we need to invalidate the client-side cache',
          })
        },
      }))),
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('pushFragment', { sendInitial: false }),
      resolve: (source: PushFragmentData[], args, ctx) => source,
    })

    t.string('startPollingForSpecs', {
      args: {
        projectId: stringArg(),
        branchName: stringArg(),
      },
      description: 'Initiates the polling mechanism with the Cypress Cloud to check if we should refetch specs, and mark specs as stale if we have updates',
      subscribe: (source, args, ctx) => {
        return ctx.remotePolling.subscribeAndPoll(args.branchName, args.projectId)
      },
      resolve: (o: string | null) => o,
    })
  },
})
