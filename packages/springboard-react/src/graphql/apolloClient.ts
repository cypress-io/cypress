import {
  ApolloLink,
  FetchResult,
  ApolloClient,
  InMemoryCache,
  Observable,
} from '@apollo/client/core'
import { fetchGraphql } from './graphqlIpc'

const ipcLink = new ApolloLink((op) => {
  return new Observable((obs) => {
    fetchGraphql(op)
      .then((result) => {
        obs.next(result as FetchResult)
        obs.complete()

        return result
      })
      .catch((err) => {
        obs.error(err)
        obs.complete()
      })
  })
})

// Cache implementation
const cache = new InMemoryCache({
  typePolicies: {
    Wizard: {
      keyFields: [],
    },
  },
})

// Create the apollo client
export const apolloClient = new ApolloClient({
  link: ipcLink,
  cache,
})
