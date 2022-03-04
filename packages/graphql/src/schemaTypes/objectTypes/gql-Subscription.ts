import { subscriptionType } from 'nexus'

export const Subscription = subscriptionType({
  definition (t) {
    t.boolean('ping', {
      async *subscribe () {
        let i = 0

        while (true) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          yield i++
        }
      },
      resolve: (val: number) => {
        return val % 2 === 0
      },
    })
  },
})
