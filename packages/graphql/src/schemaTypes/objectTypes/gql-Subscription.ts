import { enumType, objectType, subscriptionType } from 'nexus'
import { DevState, FileParts } from '.'
import { CurrentProject } from './gql-CurrentProject'
import { Query } from './gql-Query'

export const Subscription = subscriptionType({
  definition (t) {
    t.field('authChange', {
      type: Query,
      description: 'Issued when the authState field changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('authChange'),
      resolve: () => ({}),
    })

    t.field('specChange', {
      type: objectType({
        name: 'SubscriptionSpecChange',
        definition (t) {
          t.field('changeType', {
            type: enumType({
              name: 'SpecChangeType',
              members: ['add', 'remove', 'changed'],
            }),
          })

          t.field('file', {
            type: FileParts,
          })
        },
      }),
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('specChange'),
      resolve: () => ({}),
    })

    t.field('specListChanged', {
      type: CurrentProject,
      description: 'Issues when specs are added/removed from the project',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('specListChanged'),
      resolve: (source, args, ctx) => ctx.lifecycleManager,
    })

    t.field('projectUpdate', {
      type: CurrentProject,
      description: 'Issued when general internal state of the project changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('projectUpdate'),
      resolve: (source, args, ctx) => {
        if (ctx.coreData.currentProject) {
          return ctx.lifecycleManager
        }

        return null
      },
    })

    t.field('devChange', {
      type: DevState,
      description: 'Issued for internal development changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('devChange'),
      resolve: (source, args, ctx) => ctx.coreData.dev,
    })

    t.field('globalProjectListUpdate', {
      type: Query,
      description: 'Issued when the authState field changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('globalProjectListUpdate'),
      resolve: () => ({}),
    })

    t.field('changeBrowserStatus', {
      type: CurrentProject,
      description: 'Changes the browser status',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('changeBrowserStatus'),
      resolve: (source, args, ctx) => {
        if (ctx.coreData.currentProject) {
          return ctx.lifecycleManager
        }

        return null
      },
    })

    t.field('globalAlert', {
      type: Query,
      description: 'Triggered when the state of errors / warnings are changed',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('globalAlert'),
      resolve: (source, args, ctx) => ({}),
    })
  },
})
