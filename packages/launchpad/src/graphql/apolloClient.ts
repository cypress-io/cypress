import { ApolloLink, FetchResult, ApolloClient, InMemoryCache, Observable } from '@apollo/client/core'
import { fetchGraphql, initGraphQLIPC } from './graphqlIpc'

export function makeApolloCache () {
  return new InMemoryCache({
    typePolicies: {
      Wizard: {
        keyFields: [],
      },
      App: {
        keyFields: [],
      },
      WizardNpmPackage: {
        keyFields: ['name'],
      },
    },
  })
}

export function makeApolloClient () {
  initGraphQLIPC()

  const ipcLink = new ApolloLink((op) => {
    return new Observable((obs) => {
      fetchGraphql(op).then((result) => {
        obs.next(result as FetchResult)
        obs.complete()
      }).catch((err) => {
        obs.error(err)
        obs.complete()
      })
    })
  })

  return new ApolloClient({
    link: ipcLink,
    cache: makeApolloCache(),
  })
}
