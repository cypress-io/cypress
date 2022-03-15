import { subscriptionType } from 'nexus'
import { DevState } from './gql-DevState'
import { Query } from './gql-Query'

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
      description: '',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('cloudViewerChange'),
      resolve: (source, args, ctx) => {
        return {
          requestPolicy: 'network-only',
        }
      },
    })
  },
})
