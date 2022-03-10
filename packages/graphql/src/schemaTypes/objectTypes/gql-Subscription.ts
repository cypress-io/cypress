import { subscriptionType } from 'nexus'
import { DevState } from './gql-DevState'

export const Subscription = subscriptionType({
  definition (t) {
    t.field('devChange', {
      type: DevState,
      description: 'Issued for internal development changes',
      subscribe: (source, args, ctx) => ctx.emitter.subscribeTo('devChange'),
      resolve: (source, args, ctx) => ctx.coreData.dev,
    })
  },
})
