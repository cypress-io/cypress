import ReactDOM from 'react-dom'
import * as React from 'react'
import './main.scss'

import { SpringboardApp } from './SpringboardApp'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './graphql/apolloClient'

declare global {
  interface Window {
    App: any
  }
}

window.App = {
  start() {
    ReactDOM.render(
      <ApolloProvider client={apolloClient}>
        <SpringboardApp />
      </ApolloProvider>,
      document.getElementById('app'),
    )
  },
}

export {}
