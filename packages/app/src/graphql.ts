import Debug from 'debug'
import { useSubscription as urqlUseSubscription } from '@urql/vue'

const debugSubscription = Debug('cypress:app:graphql-subscription')

export const useSubscription: typeof urqlUseSubscription = (...args) => {
  const name = (args[0].query as any)?.definitions?.[0]?.name?.value

  debugSubscription('Subscribing to %s: Variables: %o', name, args[0].variables)

  return urqlUseSubscription(...args)
}
