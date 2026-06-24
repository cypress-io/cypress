import { Client, gql } from '@urql/core'
import { pipe, subscribe } from 'wonka'
import { GlobalSubscriptions_ErrorWarningChangeDocument, GlobalSubscriptions_PushFragmentDocument } from '../generated/graphql'

gql`
 subscription GlobalSubscriptions_PushFragment {
   pushFragment {
     target
     fragment
     data
     errors
     variables
     invalidateCache
   }
 }
`

gql`
subscription GlobalSubscriptions_ErrorWarningChange {
  errorWarningChange {
    baseError {
      id
      ...BaseError
    }
    warnings {
      id
      ...WarningContent
    }
  }
}
`

gql`
fragment WarningContent on ErrorWrapper {
  id
  title
  errorType
  errorMessage
}
`

/**
 * Serves as a place for us to keep "global subscriptions", where we are listening on the
 * same data changes on the app & launchpad globally
 */
export function initializeGlobalSubscriptions (client: Client) {
  // https://formidable.com/open-source/urql/docs/advanced/subscriptions/#one-off-subscriptions
  const { unsubscribe: unsubscribeErrorWarning } = pipe(
    client.subscription(GlobalSubscriptions_ErrorWarningChangeDocument),
    subscribe(() => {
      //
    }),
  )

  const { unsubscribe: unsubscribePushFragment } = pipe(
    client.subscription(GlobalSubscriptions_PushFragmentDocument),
    subscribe((val) => {
      // console.log(val)
    }),
  )

  return () => {
    unsubscribeErrorWarning()
    unsubscribePushFragment()
  }
}
