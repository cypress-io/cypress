import { useApolloClient } from '@apollo/client'
import * as React from 'react'

export const withApolloClient = (Component) => {
  const HOC = (props) => {
    const apolloClient = useApolloClient()

    return <Component {...props} apolloClient={apolloClient} />
  }

  HOC.displayName = `withApolloClient(${Component.displayName ?? Component.name})`

  return HOC
}
